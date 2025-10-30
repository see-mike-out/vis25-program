<script lang="ts">
  import {
    papers,
    workshops,
    blocks,
    day_order,
    session_order,
    paperLocations,
    locationOrder,
    roomFloor,
  } from "$lib/data";
  import { onMount } from "svelte";
  import type {
    PaperItem,
    PaperItemParsed,
    SessionItemParsed,
    WorkshopItem,
    WorkshopItemParsed,
  } from "./types";
  import { writable, type Writable } from "svelte/store";
  import Papers from "./Papers.svelte";

  const LSKEY = "vis25-interests";
  let interests: Writable<{ [key: string]: boolean }> = writable();
  let conflicts: Writable<{ [key: string]: boolean }> = writable({});

  let Days: string[] = [],
    SessionsTypes: string[] = [];
  function preprocessPapers(items: PaperItem[]): SessionItemParsed[] {
    let parsed: SessionItemParsed[] = [];
    let parsed_map: { [key: string]: SessionItemParsed } = {};
    for (const item of items) {
      let loc = paperLocations[item.session];
      let paper_parsed: PaperItemParsed = {
        session: item.session,
        // "date": "Tuesday, November 4",
        date: item.date.split(", ")[1],
        day: item.date.split(", ")[0],
        // "time": "2:00pm - 3:15pm (CET)",
        time_start: item.time.split(" - ")[0],
        time_end: item.time.split(" - ")[1].split(" ")[0],
        block: blocks[item.time] ?? "unknown",
        title: item.title,
        authors: item.authors,
        type: item.type,
        location: loc,
      };
      let session = item.session;
      if (!parsed_map[session]) {
        parsed_map[session] = {
          session,
          date: paper_parsed.date,
          day: paper_parsed.day,
          time_start: paper_parsed.time_start,
          time_end: paper_parsed.time_end,
          block: paper_parsed.block,
          papers: [paper_parsed],
          type: paper_parsed.type,
          index:
            session_order[paper_parsed.block] +
            day_order[paper_parsed.day] * 100,
          broad_type: "Papers",
          location: loc,
          locationOrder: locationOrder[loc] ?? 30,
          floor: roomFloor[loc] ?? undefined,
        };
      } else {
        parsed_map[session].papers.push(paper_parsed);
      }
    }
    parsed = Object.keys(parsed_map).map((k) => parsed_map[k]);

    return parsed;
  }

  function preprocessWorkshops(items: WorkshopItem[]): WorkshopItemParsed[] {
    let parsed: WorkshopItemParsed[] = items.map((item) => {
      let date = item.date.split(", ")[1];
      let day = item.date.split(", ")[0];
      let block = blocks[item.time] ?? "unknown";
      return {
        session: item.title,
        date,
        day,
        // "time": "2:00pm - 3:15pm (CET)",
        time_start: item.time.split(" - ")[0],
        time_end: item.time.split(" - ")[1].split(" ")[0],
        block,
        title: item.title,
        authors: [],
        organizers: item.organizers,
        panels: item.panels,
        type: item.type,
        broad_type: item.type,
        link: item.link,
        index: session_order[block] + day_order[day] * 100,
        series: item.series ?? undefined,
        location: item.location,
        locationOrder: locationOrder[item.location] ?? 30,
        floor: roomFloor[item.location] ?? undefined,
      };
    });
    return parsed;
  }

  let filter_day: Writable<string | undefined> = writable();
  let filter_session: Writable<string | undefined> = writable();
  let filter_interest: Writable<boolean> = writable(false);

  let sessions: Array<SessionItemParsed | WorkshopItemParsed> = [];
  let sessions_sorted: Array<Array<SessionItemParsed | WorkshopItemParsed>> =
    [];

  onMount(() => {
    interests.set(JSON.parse(localStorage.getItem(LSKEY) ?? "{}"));
    sessions.push(...preprocessPapers(papers));
    sessions.push(...preprocessWorkshops(workshops));
    SessionsTypes = Array.from(new Set(sessions.map((d) => d.broad_type)));
    Days = Array.from(new Set(sessions.map((d) => d.day))).toSorted(
      (a, b) => day_order[a] - day_order[b],
    );
    let sessions_grouped = sessions
      .toSorted((a, b) => a.locationOrder - b.locationOrder)
      .reduce(
        (acc, cur) => {
          let k = cur.day + " " + cur.block;
          if (!acc[k]) acc[k] = [];
          acc[k].push(cur);
          return acc;
        },
        {} as { [key: string]: Array<SessionItemParsed | WorkshopItemParsed> },
      );
    sessions_sorted = Object.keys(sessions_grouped)
      .reduce(
        (acc, cur) => {
          acc.push(sessions_grouped[cur]);
          return acc;
        },
        [] as Array<Array<SessionItemParsed | WorkshopItemParsed>>,
      )
      .toSorted((a, b) => a[0].index - b[0].index);
    interests.subscribe((inter) => {
      console.log(inter);
      if (Object.keys(inter).length > 0) {
        localStorage.setItem(LSKEY, JSON.stringify(inter));
      }
      sessions_sorted.forEach((sessions) => {
        conflicts.update((c) => {
          let block_key = `${sessions[0].day}-${sessions[0].block}`;
          c[block_key] =
            sessions.map((session) => inter[session.session]).filter((e) => e)
              .length >= 2;
          return c;
        });
      });
    });
  });
</script>

<div id="filters">
  <span>Filter by</span>
  <label>
    Day
    <select
      on:change={(e) => {
        //@ts-ignore
        filter_day.set(e.target.value);
      }}
    >
      <option value={undefined} selected={undefined == $filter_day}
        >Clear</option
      >
      {#each Days as day, i}
        <option value={day} selected={day == $filter_day}>{day}</option>
      {/each}
    </select>
  </label>
  <label>
    Session type
    <select
      on:change={(e) => {
        //@ts-ignore
        filter_session.set(e.target.value);
      }}
    >
      <option value={undefined} selected={undefined == $filter_session}
        >Clear</option
      >
      {#each SessionsTypes as stype, i}
        <option value={stype} selected={stype == $filter_session}
          >{stype}</option
        >
      {/each}
    </select>
  </label>
  <label>
    <input
      type="checkbox"
      checked={$filter_interest}
      on:change={(e) => {
        //@ts-ignore
        filter_interest.set(e.target.checked);
      }}
    />
    <span>Interested only</span>
  </label>
</div>

<section>
  {#if sessions_sorted.length > 0}
    {#each sessions_sorted as sessions_group, gi}
      {#if !$filter_day || $filter_day == sessions_group[0].day}
        <article>
          <h3 class="date-time">
            {sessions_group[0].day} ({sessions_group[0].date}) {sessions_group[0]
              .block}
            {#if $conflicts[sessions_group[0].day + "-" + sessions_group[0].block]}
              <span class="conflict">!Conflicts</span>
            {/if}
          </h3>
          <div class="sessions">
            {#each sessions_group as session, si}
              {#if !$filter_session || $filter_session == session.broad_type}
                {#if !$filter_interest || $interests[session.session]}
                  <div
                    class={"session " +
                      (session.type.includes("Papers")
                        ? "Papers"
                        : session.type.replaceAll(" ", "-"))}
                  >
                    <span class="session-type">{session.type}</span>
                    <h4 class="session-title">
                      {#if "series" in session && session.series}<span
                          class="series">[{session.series}]</span
                        >{/if}
                      {session.session}
                    </h4>
                    <span class="location">{session.location}  {#if session.floor !== undefined} (Level: {session.floor}){/if}</span>
                    <label class="interest"
                      ><input
                        type="checkbox"
                        checked={$interests[session.session]}
                        on:click={(e) => {
                          //@ts-ignore
                          $interests[session.session] = e.target.checked;
                        }}
                      /> <span>Interested</span></label
                    >
                    {#if "organizers" in session && session.organizers && session.organizers.length > 0}
                      <span class="organizers"
                        ><strong>Organizers</strong>
                        {session.organizers.join(", ")}</span
                      >
                    {/if}
                    {#if "panels" in session && session.panels && session.panels.length > 0}
                      <span class="organizers"
                        ><strong>Panels</strong>
                        {session.panels.join(", ")}</span
                      >
                    {/if}
                    {#if "link" in session && session.link && session.link.length > 0}
                      <a
                        href={session.link}
                        target="_blank"
                        style="font-size: 0.9rem; margin-top: 0.25rem;"
                        >Find more here</a
                      >
                    {/if}
                    {#if "papers" in session && session.papers}
                      <Papers papers={session.papers}></Papers>
                    {/if}
                  </div>
                {/if}
              {/if}
            {/each}
          </div>
        </article>
      {/if}
    {/each}
  {/if}
</section>

<style>
  #filters {
    position: sticky;
    top: 63px;
    border-bottom: 1px solid #ddd;
    background-color: white;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    display: flex;
    flex-wrap: wrap;
    column-gap: 1rem;
    row-gap: 0.5rem;
    align-items: center;
    z-index: 999;
  }
  #filters > * {
    display: block;
  }
  #filters > *:last-child {
    border-right: 0;
    padding-right: 0;
  }
  #filters > span {
    font-weight: 600;
  }
  #filters label {
    display: flex;
    vertical-align: middle;
  }
  section {
    display: flex;
    flex-direction: column;
    row-gap: 1rem;
    padding: 1rem;
  }
  h3.date-time {
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
  }
  .conflict {
    color: #dd2c00;
    font-size: 0.8rem;
    background-color: #ffebee;
    border-radius: 0.25rem;
    padding: 0.05rem 0.2rem;
  }
  @media (max-width: 500px) {
    .sessions {
      display: flex;
      column-gap: 0.5rem;
      row-gap: 0.5rem;
      flex-direction: column;
    }
  }
  @media (min-width: 501px) {
    .sessions {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
      column-gap: 0.5rem;
    }
  }
  .session {
    padding: 0.5rem;
    background-color: white;
    border-radius: 0.5rem;
    border: 1px solid #ddd;
  }
  .session-type {
    font-size: 0.8rem;
    font-weight: 700;
    display: block;
    line-height: 100%;
  }
  .session h4 {
    font-size: 0.9rem;
    font-weight: 400;
    margin: 0.25rem 0;
    line-height: 100%;
  }
  .session.Workshop .session-type {
    color: #ff6f00;
  }
  .session.Tutorial .session-type {
    color: #dd2c00;
  }
  .session.Contest .session-type {
    color: #00bfa5;
  }
  .session.Poster .session-type {
    color: #00bfa5;
  }
  .session.Vis-Arts-Program .session-type {
    color: #00bfa5;
  }
  .session.Papers .session-type {
    color: #6200ea;
  }
  .session.Panel .session-type {
    color: #aa00ff;
  }
  .session.Meetup .session-type {
    color: #aa00ff;
  }
  .session.Vis-In-Practice .session-type {
    color: #aa00ff;
  }
  .session.Others .session-type {
    color: #d50000;
  }
  .interest {
    color: #454545;
    font-size: 0.9rem;
    line-height: 100%;
  }
  label {
    display: flex;
    align-items: center;
  }
  label > input {
    display: block;
    margin-left: 0;
  }
  label > span {
    display: block;
    margin-top: 0.1rem;
    margin-left: 0.25rem;
  }
  label > select {
    display: block;
    margin-left: 0.25rem;
  }
  .organizers {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.85rem;
  }
  .organizers strong {
    font-weight: 600;
    background-color: #efefef;
    padding: 0.05rem 0.15rem;
    border-radius: 0.25rem;
  }
  .series {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 600;
    color: #666;
    font-size: 0.8rem;
  }
  .location {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.85rem;
    color: #666;
  }
</style>
