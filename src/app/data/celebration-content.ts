import { CelebrationContent, Photo } from '../models/celebration.models';

const captions: Readonly<Record<number, string>> = {
  1: 'Chiếc ảnh xinh của vợ iu.',
  5: 'Cô gái mà anh luôn muốn ngắm mãi.',
  9: 'Rạng rỡ theo cách của riêng vợ iu.',
  14: 'Một khoảnh khắc thật đáng yêu.',
  18: 'Anh thích nụ cười này lắm.',
  23: 'Vợ iu cứ luôn tự tin như thế nhé.',
  29: 'Một chút dịu dàng anh muốn giữ lại.',
  34: 'Thêm một kỷ niệm thật đẹp của vợ iu.',
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
    eyebrow: 'Một món quà nhỏ dành riêng cho vợ iu',
    title: 'Anh có một điều muốn dành cho vợ iu…',
    body: 'Không phải điều gì quá lớn lao đâu. Chỉ là anh muốn dành một góc thật xinh để cất lại niềm vui của vợ iu trong ngày đặc biệt này.',
    actionLabel: 'Vợ iu mở quà nhé ♡',
  },
  hero: {
    eyebrow: '17.10.2026 · Ngày đặc biệt của vợ iu',
    title: 'Vợ iu tốt nghiệp rồi!',
    subheading: 'Một cột mốc thật đẹp của Nguyễn Võ Mai Khuê.',
    lead: 'Vợ iu của anh đã làm được rồi. Anh mong khoảnh khắc này sẽ luôn nhắc vợ iu nhớ rằng mình đã giỏi giang, mạnh mẽ và đáng tự hào đến nhường nào.',
    ctaLabel: 'Cùng anh xem tiếp nha',
    scrollHint: 'Kéo xuống một chút nữa nha, vợ iu.',
    portraitSrc: 'Image/hero/mai-khue-cutout.webp',
    portraitFallback: 'Image/hero/mai-khue-cutout.png',
    portraitSrcSet:
      'Image/hero/mai-khue-cutout-480.webp 480w, Image/hero/mai-khue-cutout-768.webp 768w, Image/hero/mai-khue-cutout.webp 1024w',
    portraitAlt: 'Mai Khuê trong trang phục tốt nghiệp, với mũ đen và tua vàng.',
    portraitWidth: 1024,
    portraitHeight: 1536,
  },
  invitation: {
    eyebrow: 'Một ngày thật đặc biệt',
    title: 'Ngày của vợ iu',
    recipient: 'Nguyễn Võ Mai Khuê',
    degree: 'Cử nhân Luật',
    school: 'Đại học Tôn Đức Thắng',
    dateLabel: '17 tháng 10 năm 2026',
    note: 'Một ngày thật đẹp để đánh dấu những cố gắng của vợ iu. Và cũng là một ngày mà anh muốn cất giữ thật lâu trong tim.',
  },
  message: {
    eyebrow: 'Từ anh, gửi vợ iu',
    title: 'Anh tự hào về vợ iu nhiều lắm',
    body: 'Có những thành quả không chỉ được đo bằng một tấm bằng, mà còn bằng cả một hành trình cố gắng phía sau. Anh vui vì vợ iu đã đi đến một cột mốc thật đẹp. Mong vợ iu sẽ luôn tự tin, luôn mỉm cười và luôn nhớ rằng bản thân xứng đáng với rất nhiều điều tốt đẹp.',
  },
  gallery: {
    eyebrow: 'Những khoảnh khắc thật xinh',
    title: '34 khoảnh khắc anh muốn ngắm mãi',
    lead: 'Mỗi bức ảnh là một chút rạng rỡ rất riêng của vợ iu. Anh muốn giữ lại tất cả ở đây, để bất cứ khi nào ghé xem, vợ iu cũng có thể mỉm cười vì những ngày tháng thật đẹp của mình.',
    instruction: 'Chạm vào một bức ảnh để ngắm vợ iu rõ hơn nhé.',
  },
  letter: {
    eyebrow: 'Một lá thư nhỏ từ anh',
    title: 'Gửi vợ iu của anh',
    paragraphs: [
      'Vợ iu à, vậy là một cột mốc thật đẹp đã được đánh dấu rồi. Anh biết phía sau ngày hôm nay là cả một hành trình mà vợ iu đã dành rất nhiều sự kiên trì và cố gắng. Anh chỉ muốn ôm vợ iu một cái thật lâu và nói rằng: vợ iu của anh giỏi lắm.',
      'Anh thích nhìn vợ iu vui, thích những lúc vợ iu cười và càng thích hơn khi thấy vợ iu tự hào về chính mình. Ngày tốt nghiệp này không chỉ là một lời chúc mừng, mà còn là dịp để anh nhắc vợ iu nhớ rằng những điều mình đã cố gắng đều thật đáng trân trọng.',
      'Anh không biết những chặng đường tiếp theo sẽ mang đến bao nhiêu điều mới mẻ, nhưng anh mong vợ iu sẽ luôn giữ được sự dịu dàng, niềm tin và những ước mơ của riêng mình. Có những ngày thật vui, cũng có thể sẽ có những ngày hơi mệt một chút. Dù thế nào, anh vẫn mong vợ iu luôn biết rằng mình không phải đối diện với mọi thứ một mình.',
      'Anh sẽ luôn muốn được ở bên, được lắng nghe những câu chuyện nhỏ mỗi ngày và cùng vợ iu giữ lại thêm thật nhiều kỷ niệm đẹp. Cảm ơn vợ iu vì đã là một người đặc biệt trong cuộc sống của anh. Chúc mừng tốt nghiệp nhé, tình yêu của anh.',
    ],
    signature: 'Thương vợ iu rất nhiều,\nQuân iu',
  },
  closing: {
    title: 'Vợ iu ơi, hành trình đẹp nhất vẫn còn ở phía trước',
    body: 'Chúc vợ iu luôn được làm những điều mình yêu, gặp những người thật tốt và có thật nhiều ngày bình yên, hạnh phúc. Còn anh, anh mong mình sẽ được cùng vợ iu đi qua thêm thật nhiều cột mốc đáng nhớ nữa.',
    finalHighlight: 'Anh thương vợ iu. Nhiều lắm.',
    actionLabel: 'Ngắm lại những khoảnh khắc của vợ iu',
    replayLabel: 'Mở lại món quà của anh',
  },
  music: {
    src: 'Audio/Ariana Grande bye Altare Remix.mp3',
    title: 'Bản nhạc dành cho Mai Khuê',
    volume: 0.35,
    loop: true,
  },
  photos,
};
