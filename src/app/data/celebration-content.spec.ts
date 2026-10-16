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
    expect(celebrationContent.letter.signature).toBe('Thương vợ iu nhiều lắm,\nQuân iu');
    expect(celebrationContent.letter.paragraphs).toHaveSize(5);
  });

  it('exposes the approved copy from one data source', () => {
    expect(celebrationContent.intro.title).toBe('Vợ iu ơi, anh có cái này cho vợ iu nè ♡');
    expect(celebrationContent.intro.actionLabel).toBe('Vợ iu mở quà nha ♡');
    expect(celebrationContent.invitation.title).toBe('Ngày của cô cử nhân anh thương');
    expect(celebrationContent.message.title).toBe('Cho anh khen vợ iu một chút nha');
    expect(celebrationContent.gallery.title).toBe('34 tấm hình, một người anh thương');
    expect(celebrationContent.gallery.instruction).toBe(
      'Chạm vào tấm nào vợ iu thích để ngắm rõ hơn nha ♡',
    );
    expect(celebrationContent.closing.finalHighlight).toBe('Anh thương vợ iu. Nhiều lắm. ♡');
  });

  it('defines affectionate captions for all 34 photos', () => {
    expect(celebrationContent.photos.every((photo) => Boolean(photo.caption))).toBeTrue();
    expect(celebrationContent.photos.find((photo) => photo.id === 9)?.caption).toBe(
      'Một chút dịu dàng của vợ iu.',
    );
  });

  it('does not add contact numbers or reset the approved audio/portrait configuration', () => {
    const { photos, hero, ...copy } = celebrationContent;
    expect(JSON.stringify(copy)).not.toMatch(/(?:\+84|\b0)[\d .-]{8,}\b/);
    expect(celebrationContent.music.volume).toBe(0.35);
    expect(celebrationContent.music.loop).toBeTrue();
    expect(hero.portraitSrc).toBe('Image/hero/mai-khue-cutout.webp');
    expect(hero.title).toBe('Chúc mừng tốt nghiệp, vợ iu!');
    expect(photos).toHaveSize(34);
  });
});
