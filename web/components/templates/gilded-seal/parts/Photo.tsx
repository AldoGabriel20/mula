import type { Photo as PhotoT } from "../config";

/**
 * A photograph filling its (relatively positioned) parent. With no photo it renders nothing, so the
 * parent's own gradient shows: that is the prototype's empty `<image-slot>`.
 */
export function Photo({ photo, eager = false }: { photo: PhotoT | { url: string | null; alt: string } | null; eager?: boolean }) {
  if (!photo || !photo.url) return null;
  // eslint-disable-next-line @next/next/no-img-element -- signed, expiring API URLs: next/image's optimiser cannot fetch them
  return <img src={photo.url} alt={photo.alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
}
