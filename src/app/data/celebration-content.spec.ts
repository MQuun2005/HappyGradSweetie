import { celebrationContent } from './celebration-content';

describe('celebrationContent', () => {
  it('defines all 34 original and thumbnail image records in order', () => {
    expect(celebrationContent.photos).toHaveSize(34);

    celebrationContent.photos.forEach((photo, index) => {
      const id = index + 1;
      expect(photo.id).toBe(id);
      expect(photo.order).toBe(id);
      expect(photo.src).toBe(`Image/original/${id}.jpg`);
      expect(photo.thumbnailSrc).toBe(`Image/thumb/${id}.jpg`);
    });
  });
});
