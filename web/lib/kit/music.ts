import { TRACKS, type Track } from "./generated/music";

export { TRACKS, type Track };

export const trackByKey = (key: string | null | undefined): Track | null => TRACKS.find((t) => t.key === key) ?? null;

/** Volume the track fades up to, and how long the fade takes (prototype `music.volume`, 1800 ms). */
export const MUSIC_VOLUME = 0.6;
export const MUSIC_FADE_MS = 1800;
