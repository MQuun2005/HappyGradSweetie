import { CelebrationContent, Photo } from '../models/celebration.models';

const captions: Readonly<Record<number, string>> = {
  1: 'Một chiếc ảnh xinh của vợ iu.',
  5: 'Cô gái mà anh luôn tự hào.',
  9: 'Rạng rỡ theo cách riêng của em.',
  14: 'Một khoảnh khắc thật đáng yêu.',
  18: 'Nụ cười anh thương nhất.',
  23: 'Cứ luôn vui vẻ và hạnh phúc như thế này nhé.',
  29: 'Một điều dịu dàng anh muốn giữ mãi.',
  34: 'Chúc mừng dấu mốc thật đẹp của em.',
};

const photos: readonly Photo[] = Array.from({ length: 34 }, (_, index) => {
  const id = index + 1;

  return {
    id,
    src: `Image/original/${id}.jpg`,
    thumbnailSrc: `Image/thumb/${id}.jpg`,
    alt: `Khoảnh khắc tốt nghiệp của Mai Khuê ${id}`,
    title: `Khoảnh khắc ${id} của Mai Khuê`,
    caption: captions[id],
    order: id,
    featured: false,
  };
});

export const celebrationContent: CelebrationContent = {
  intro: {
    eyebrow: 'Một món quà nhỏ',
    title: 'Anh có một món quà nhỏ dành cho vợ iu.',
    body: 'Dành cho Mai Khuê, để giữ lại thật dịu dàng dấu mốc đẹp này.',
    actionLabel: 'Mở món quà của anh',
  },
  hero: {
    eyebrow: '17.10.2026 · Một dấu mốc thật đẹp',
    title: 'Chúc mừng tốt nghiệp, Mai Khuê của anh',
    lead: 'Anh tự hào về em nhiều lắm — về sự kiên trì, dịu dàng và cách em đã đi đến cột mốc rực rỡ này.',
    ctaLabel: 'Xem thiệp tốt nghiệp',
  },
  invitation: {
    eyebrow: 'Graduation celebration',
    title: 'Một ngày thật đặc biệt của cô gái anh thương',
    recipient: 'Nguyễn Võ Mai Khuê',
    degree: 'Cử nhân Luật',
    school: 'Đại học Tôn Đức Thắng',
    dateLabel: '17 tháng 10, 2026',
    note: 'Một dấu mốc thật đáng tự hào, được giữ lại bằng tất cả yêu thương.',
  },
  message: {
    eyebrow: 'Dành cho Mai Khuê',
    title: 'Cô gái anh luôn tự hào',
    body:
      'Từng ngày kiên trì đã góp lại thành thành quả thật đẹp hôm nay. Anh mong em sẽ luôn tự tin, vui vẻ và hạnh phúc trên mọi chặng đường phía trước.',
  },
  gallery: {
    eyebrow: 'Kỷ niệm tốt nghiệp',
    title: 'Những khoảnh khắc anh muốn ngắm mãi',
    lead: 'Chạm vào từng tấm ảnh để cùng anh giữ lại những lát cắt rạng rỡ của em.',
  },
  letter: {
    eyebrow: 'Một lá thư nhỏ từ anh',
    title: 'Gửi vợ iu của anh',
    paragraphs: [
      'Mai Khuê à, vậy là em đã đi đến một cột mốc thật đẹp rồi. Chúc mừng em tốt nghiệp — một thành quả mà anh biết là được góp nhặt từ rất nhiều sự kiên trì và cố gắng.',
      'Anh tự hào về cô gái dịu dàng nhưng luôn bền bỉ này. Nhìn em chạm tới dấu mốc hôm nay, anh chỉ muốn nói rằng em đã thật sự rất giỏi.',
      'Anh mong những chặng đường phía trước sẽ luôn dịu dàng với em, để em được làm điều mình yêu, được tự tin theo đuổi điều mình chọn và nhận về thật nhiều niềm vui.',
      'Cứ rạng rỡ theo cách riêng của em nhé, vợ iu. Anh sẽ luôn ở đây, yêu thương và đồng hành cùng em.',
    ],
    signature: 'Quân iu',
  },
  closing: {
    title: 'Và đây mới chỉ là khởi đầu',
    body: 'Chúc vợ iu luôn vững vàng, rạng rỡ và tìm thấy thật nhiều điều xứng đáng trên chặng đường mới.',
    actionLabel: 'Xem lại những khoảnh khắc',
    replayLabel: 'Mở lại món quà',
  },
  music: {
    src: 'Audio/Ariana Grande bye Altare Remix.mp3',
    title: 'Bản nhạc dành cho Mai Khuê',
    volume: 0.35,
  },
  photos,
};
