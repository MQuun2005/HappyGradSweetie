import { Photo } from '../models/celebration.models';

export const DESKTOP_PHOTOS_PER_PAGE = 7;
export const COMPACT_PHOTOS_PER_PAGE = 3;

export interface GalleryCardLayout {
  readonly slot: number;
  readonly offsetY: number;
  readonly depth: number;
  readonly rotateY: number;
  readonly rotateZ: number;
  readonly focusShiftX: number;
}

export function getPhotoPage(
  photos: readonly Photo[],
  pageIndex: number,
  pageSize: number,
): readonly Photo[] {
  const start = pageIndex * pageSize;
  return photos.slice(start, start + pageSize);
}

export function getPhotoPageCount(photoCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(photoCount / pageSize));
}

export function getCardLayout(slotIndex: number, visibleCount: number): GalleryCardLayout {
  const slot = slotIndex - (visibleCount - 1) / 2;
  const distanceFromCenter = Math.abs(slot);

  return {
    slot,
    offsetY: Math.round(distanceFromCenter * 22),
    depth: Math.round(-distanceFromCenter * 118),
    rotateY: Math.round(-slot * 9),
    rotateZ: Number((slot * 2.4).toFixed(1)),
    focusShiftX: Math.round(-slot * 30),
  };
}
