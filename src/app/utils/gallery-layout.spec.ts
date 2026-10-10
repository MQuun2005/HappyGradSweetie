import { Photo } from '../models/celebration.models';
import {
  DESKTOP_PHOTOS_PER_PAGE,
  getCardLayout,
  getPhotoPage,
  getPhotoPageCount,
} from './gallery-layout';

const photos: readonly Photo[] = Array.from({ length: 34 }, (_, index) => ({
  id: index + 1,
  src: `Image/${index + 1}.jpg`,
  thumbnailSrc: `Image/thumb/${index + 1}.jpg`,
  alt: `Ảnh ${index + 1}`,
  title: `Ảnh ${index + 1}`,
  caption: '',
  order: index + 1,
}));

describe('gallery layout', () => {
  it('splits 34 photos into five desktop pages and keeps six on the final page', () => {
    expect(getPhotoPageCount(photos.length, DESKTOP_PHOTOS_PER_PAGE)).toBe(5);

    const finalPage = getPhotoPage(photos, 4, DESKTOP_PHOTOS_PER_PAGE);
    expect(finalPage).toHaveSize(6);
    expect(finalPage[0].id).toBe(29);
    expect(finalPage[5].id).toBe(34);
  });

  it('places the central card nearest to the viewer', () => {
    const center = getCardLayout(3, 7);
    const outer = getCardLayout(0, 7);

    expect(center.slot).toBe(0);
    expect(center.depth).toBe(0);
    expect(outer.depth).toBeLessThan(center.depth);
  });
});
