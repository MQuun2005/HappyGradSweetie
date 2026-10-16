import { CelebrationContent, Photo } from '../models/celebration.models';

const captions: Readonly<Record<number, string>> = {
  1: 'Bà trời con của anh đây rồi.',
  2: 'Mũ tốt nghiệp hợp vợ iu ghê.',
  3: 'Tấm này anh nhìn hơi lâu đó nha.',
  4: 'Đáng eoo quá.',
  5: 'Cho anh lưu tấm này vào mục yêu thích.',
  6: 'Tự nhiên nhìn ảnh này thấy vui.',
  7: 'Vợ iu biết mình đáng eoo không z trời?',
  8: 'Định chọn ít ảnh thôi mà anh không làm được.',
  9: 'Anh thích tấm này lắm.',
  10: 'Tấm này cũng phải giữ lại chứ.',
  11: 'Anh hơi thiên vị vợ iu, chắc chắn luôn.',
  12: 'Cục dàng của anh, dễ thương ghê.',
  13: 'Lại thêm một tấm khiến toi mỉm cười.',
  14: 'Chẳng cần làm gì đặc biệt, vẫn xinh.',
  15: 'Anh thích những khoảnh khắc thế này.',
  16: 'Cho anh ngắm thêm một chút nha.',
  17: 'Mỹ nữ thiên hạ nhiều vô kể, chỉ có nàng khiến ta động sát tâm.',
  18: 'Sao ngắm mãi vẫn chưa thấy chán ta?',
  19: 'Cứ là vợ iu thôi, đã đáng yêu lắm rồi.',
  20: 'Thêm một tấm ảnh anh muốn cất kỹ.',
  21: 'Anh chưa chọn được tấm thích nhất đâu.',
  22: 'Tấm này cho anh khoe một xíu nhé.',
  23: 'Nhìn vợ iu là anh lại thấy tự hào.',
  24: 'Khen em đẹp thì thừa mất, thôi cất vào tim là vừa nhất.',
  25: 'Giữ lại một chút của ngày đáng nhớ.',
  26: 'Có vợ iu trong ảnh là anh thấy xinh rồi.',
  27: 'Anh chọn ảnh khó thật, vì ảnh nào cũng thích.',
  28: 'Album này toàn ảnh của người anh thương.',
  29: 'Thích tấm này. Chấm hết.',
  30: 'Tốt nghiệp rồi, cho anh chúc mừng thêm lần nữa nha.',
  31: 'Để dành mai mốt mở ra ngắm tiếp.',
  32: 'Cho anh xem thêm một tấm nữa đi.',
  33: 'Cho anh gửi cô cử nhân một cái ôm nha.',
  34: 'Hết ảnh rồi mà anh vẫn muốn ngắm tiếp.',
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
    eyebrow: 'Một món quà nhỏ từ anh',
    title: 'Vợ iu ơi, anh có quà nè 💗',
    body: 'Anh gom những tấm hình anh thích vào đây, rồi viết thêm vài lời cho vợ iu. Mở ra xem cùng anh nha.',
    actionLabel: 'Mở quà với anh nha 💗',
  },
  hero: {
    eyebrow: '17.10.2026 · Ngày đặc biệt của vợ iu',
    title: 'Chúc mừng tốt nghiệp nhan cục dàng!',
    subheading: 'Nguyễn Võ Mai Khuê',
    lead: 'Anh tự hào về vợ iu lắm. Nhìn vợ iu trong bộ đồ tốt nghiệp, anh cứ muốn khoe hoài: cô cử nhân xinh này là người yêu anh đó.',
    ctaLabel: 'Cùng anh xem tiếp nha',
    scrollHint: 'Kéo xuống một xíu nè 💗',
    portraitSrc: 'Image/hero/mai-khue-cutout.webp',
    portraitFallback: 'Image/hero/mai-khue-cutout.png',
    portraitSrcSet:
      'Image/hero/mai-khue-cutout-480.webp 480w, Image/hero/mai-khue-cutout-768.webp 768w, Image/hero/mai-khue-cutout.webp 1024w',
    portraitAlt: 'Mai Khuê trong trang phục tốt nghiệp, với mũ đen và tua vàng.',
    portraitWidth: 1024,
    portraitHeight: 1536,
  },
  invitation: {
    eyebrow: 'Một ngày đáng nhớ',
    title: 'Ngày của cô cử nhân toi thương',
    recipient: 'Nguyễn Võ Mai Khuê',
    degree: 'Cử nhân Luật',
    school: 'Đại học Tôn Đức Thắng',
    dateLabel: '17 tháng 10 năm 2026',
    note: 'Một tấm thiệp nhỏ cho ngày tốt nghiệp của vợ iu. Anh mong ngày này có thật nhiều tiếng cười, những tấm hình xinh và những người mình thương ở bên.',
  },
  message: {
    eyebrow: 'Anh muốn nói với vợ iu',
    title: 'Cho anh khen vợ iu một chút nha',
    body: 'Anh vui cho vợ iu lắm. Những cố gắng để có ngày này xứng đáng được chúc mừng mà. Hôm nay cứ tận hưởng niềm vui của mình nha. Cho anh gửi một cái ôm thật chặt nữa. Mà chắc cổ bận ôm mọi người rồi 😒.',
  },
  gallery: {
    eyebrow: 'Một góc nhỏ để ngắm vợ iu',
    title: '34 tấm hình, một người anh thương',
    lead: 'Anh tính chọn vài tấm thôi, mà nhìn lại tấm nào cũng thích. Thôi thì giữ hết ở đây, để mai mốt mình còn mở ra ngắm tiếp nha.',
    instruction: 'Chạm vào tấm nào vợ iu thích để ngắm rõ hơn nha 💗',
  },
  letter: {
    eyebrow: 'Có mấy lời anh muốn nói',
    title: 'Gửi vợ iu của anh',
    paragraphs: [
      'Vợ iu ơi, chúc mừng tốt nghiệp nha. Nhìn những tấm hình này, anh vừa muốn khoe với mọi người, vừa muốn ôm vợ iu một cái thật lâu. Cô cử nhân Luật của anh đây rồi. Anh tự hào lắm.',
      'Anh mong ngày tốt nghiệp này, vợ iu có thể vui thật thoải mái. Chụp những tấm hình mình thích, cười thật nhiều và tự thấy mình giỏi một chút nữa. Để có ngày này, vợ iu đã cố gắng rồi. Còn anh thì chỉ muốn nói thêm một câu thôi: thương vợ iu quá.',
      'Sau tốt nghiệp, có chuyện gì vui thì kể anh nghe nha. Chuyện không vui cũng kể được. Không cần phải đợi đến khi mọi thứ ổn rồi mới tìm anh đâu. Hôm nào mà chỉ muốn than một chút, chẳng cần lời khuyên gì hết, thì cứ nói với anh như vậy. Anh muốn được nghe cả những chuyện nhỏ xíu trong ngày của vợ iu nữa.',
      'Anh làm trang này để chúc mừng vợ iu, rồi cứ sửa thêm một chút, thêm một chút nữa. Lựa ảnh cũng vậy, tấm nào anh cũng tiếc không muốn bỏ. Đến cuối cùng thì thành cả một góc toàn hình người yêu anh. Mong lúc mở món quà này, vợ iu sẽ cười. Và mai mốt có ghé lại, vẫn thấy anh ở đây, đang chúc mừng và thương vợ iu nhiều như vậy.',
      'Chúc con đường sắp tới của em vạn dặm bình an, ngàn sự rực rỡ, chỉ tiến không lùi. Một bước đi vạn người quý, chúc lúc ở nhiều người thương. Chúc em sớm tìm được công việc thuận ý, và con đường phía trước sẽ luôn có những điều tốt đẹp. Anh sẽ luôn ở bên, cùng em đi qua những ngày vui và cả những ngày chẳng có gì đặc biệt. Anh thương vợ iu nhiều lắm.',
      'And remember, I pray that you win in life and achieve all your dreams. I really want to see you happy, successful in your life and become the person you want to be. I believe in you.',
    ],
    signature: 'Thương vợ iu nhiều lắm,\nQuân iu',
  },
  closing: {
    title: 'Rồi mình cùng đón những ngày tiếp theo nha',
    body: 'Anh mong vợ iu được làm những điều mình thích. Còn anh thì muốn được ở bên, cùng vui mỗi khi có tin tốt và nghe kể cả những ngày chẳng có gì đặc biệt. Chúc mừng tốt nghiệp nha, Khuê của anh.',
    finalHighlight: 'Anh thương vợ iu. Nhiều lắm. 💗',
    actionLabel: 'Ngắm vợ iu thêm một xíu',
    replayLabel: 'Mở lại từ đầu nha 💗',
  },
  music: {
    src: 'Audio/Ariana Grande bye Altare Remix.mp3',
    title: 'Bản nhạc dành cho Mai Khuê',
    volume: 0.35,
    loop: true,
  },
  photos,
};
