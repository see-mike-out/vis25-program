export type PaperItem = {
  session: string,
  date: string,
  time: string,
  title: string,
  authors: string[],
  type: string
}

export type WorkshopItem = {
  title: string,
  date: string,
  time: string,
  series: string,
  type: string,
  link: string,
  index?: number,
  organizers?: string[],
  panels?: string[]
}

export type PaperItemParsed = {
  session: string,
  date: string,
  day: string,
  time_start: string,
  time_end: string,
  block: string,
  title: string,
  authors: string[],
  type: string,
}

export type SessionItemParsed = {
  session: string,
  date: string,
  day: string,
  time_start: string,
  time_end: string,
  block: string,
  papers: PaperItemParsed[],
  type: string,
  broad_type: string,
  index: number,
  link?: string
}

export type WorkshopItemParsed = {
  session: string,
  date: string,
  day: string,
  time_start: string,
  time_end: string,
  block: string,
  title: string,
  authors: string[],
  type: string,
  broad_type: string,
  index: number,
  link?: string,
  organizers?: string[],
  panels?: string[]
}