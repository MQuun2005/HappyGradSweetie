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

  it('preserves the exact graduation facts and the approved two-line signature', () => {
    expect(celebrationContent.invitation.recipient).toBe('Nguyễn Võ Mai Khuê');
    expect(celebrationContent.invitation.degree).toBe('Cử nhân Luật');
    expect(celebrationContent.invitation.school).toBe('Đại học Tôn Đức Thắng');
    expect(celebrationContent.invitation.dateLabel).toBe('17 tháng 10 năm 2026');
    expect(celebrationContent.letter.signature).toBe('Thương vợ iu rất nhiều,\nQuân iu');
    expect(celebrationContent.letter.paragraphs).toHaveSize(4);
  });

  it('exposes the Phase 6 copy from one data source', () => {
    expect(celebrationContent.intro.title).toBe('Anh có một điều muốn dành cho vợ iu…');
    expect(celebrationContent.intro.actionLabel).toBe('Vợ iu mở quà nhé ♡');
    expect(celebrationContent.invitation.title).toBe('Ngày của vợ iu');
    expect(celebrationContent.message.title).toBe('Anh tự hào về vợ iu nhiều lắm');
    expect(celebrationContent.gallery.title).toBe('34 khoảnh khắc anh muốn ngắm mãi');
    expect(celebrationContent.gallery.instruction).toBe('Chạm vào một bức ảnh để ngắm vợ iu rõ hơn nhé.');
    expect(celebrationContent.closing.finalHighlight).toBe('Anh thương vợ iu. Nhiều lắm.');
  });

  it('keeps captions sparse and tied to the same eight photo IDs', () => {
    expect(celebrationContent.photos.filter(photo => photo.caption).map(photo => photo.id))
      .toEqual([1, 5, 9, 14, 18, 23, 29, 34]);
    expect(celebrationContent.photos.find(photo => photo.id === 9)?.caption)
      .toBe('Rạng rỡ theo cách của riêng vợ iu.');
  });

  it('does not add contact numbers or reset the approved audio/portrait configuration', () => {
    const { photos, hero, ...copy } = celebrationContent;
    expect(JSON.stringify(copy)).not.toMatch(/(?:\+84|\b0)[\d .-]{8,}\b/);
    expect(celebrationContent.music.volume).toBe(0.35);
    expect(celebrationContent.music.loop).toBeTrue();
    expect(hero.portraitSrc).toBe('Image/hero/mai-khue-cutout.webp');
    expect(hero.title).toBe('Vợ iu tốt nghiệp rồi!');
    expect(photos).toHaveSize(34);
  });
});
