<script lang="ts">
  import type { PaperItemParsed } from "./types";

  export let papers: PaperItemParsed[];
  let show_detail = false;
  function truncate(text: string, max_len: number, sd: boolean) {
    return !sd ? text.slice(0, max_len) + "  ..." : text;
  }
</script>

<button
  class="details"
  on:click={() => {
    show_detail = !show_detail;
  }}>{show_detail ? "Hide" : "Show"} detail</button
>
{#if papers}
  {#each papers as paper, pi}
    <div class={"paper " + (show_detail ? "show-detail" : "hide-detail")}>
      <span class="paper-title">
        {truncate(paper.title, 50, show_detail)}
      </span>
      <span class="paper-authors">
        {truncate(paper.authors.join(", "), 80, show_detail)}
      </span>
    </div>
  {/each}
{/if}

<style>
  button {
    position: relative;
    border-radius: 0.5rem;
    border: 0;
    background-color: #eee;
    font-size: 0.8rem;
    padding: 0.25rem;
    line-height: 100%;
    left: 100%;
    transform: translateX(-100%);
  }
  @media (max-width: 500px) {
    .hide-detail .paper-title,
    .hide-detail .paper-authors {
      height: 1rem;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
  @media (min-width: 501px) {
    .hide-detail .paper-title,
    .hide-detail .paper-authors {
      width: calc(100vw / 8 - 2rem);
      height: 2rem;
      white-space: wrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
  .paper {
    width: 100%;
    border-top: 1px solid #ddd;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    color: #666;
  }
  .paper-title {
    display: block;
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }
  .paper-authors {
    display: block;
    font-size: 0.8rem;
  }
</style>
