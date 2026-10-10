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
      expect(photo.featured).toBeFalse();
    });
  });

  it('contains the recipient and sender content without placeholders', () => {
    const content = JSON.stringify(celebrationContent);

    expect(content).toContain('Nguyễn Võ Mai Khuê');
    expect(content).toContain('Quân iu');
    expect(content).not.toContain('[Tên');
    expect(celebrationContent.music.src).toBe('Audio/Ariana Grande bye Altare Remix.mp3');
  });
});
