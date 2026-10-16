import { CelebrationContent, Photo } from '../models/celebration.models';

const captions: Readonly<Record<number, string>> = {
  1: 'Cô cử nhân của anh đây rồi.',
  2: 'Mũ tốt nghiệp hợp vợ iu ghê.',
  3: 'Tấm này anh nhìn hơi lâu đó nha.',
  4: 'Xinh kiểu rất Mai Khuê.',
  5: 'Cho anh lưu tấm này vào mục yêu thích.',
  6: 'Tự nhiên nhìn ảnh này thấy vui.',
  7: 'Vợ iu biết mình đáng yêu không vậy?',
  8: 'Định chọn ít ảnh thôi mà anh không làm được.',
  9: 'Một chút dịu dàng của vợ iu.',
  10: 'Tấm này cũng phải giữ lại chứ.',
  11: 'Anh hơi thiên vị vợ iu, chắc chắn luôn.',
  12: 'Khuê của anh, dễ thương ghê.',
  13: 'Lại thêm một tấm khiến anh mỉm cười.',
  14: 'Chẳng cần làm gì đặc biệt, vẫn xinh.',
  15: 'Anh thích những khoảnh khắc thế này.',
  16: 'Một góc rất riêng của vợ iu.',
  17: 'Cô cử nhân Luật làm anh mất tập trung rồi.',
  18: 'Sao ngắm mãi vẫn chưa thấy chán ta?',
  19: 'Cứ là vợ iu thôi, đã đáng yêu lắm rồi.',
  20: 'Thêm một tấm ảnh anh muốn cất kỹ.',
  21: 'Một tấm ảnh nhỏ, một niềm vui to.',
  22: 'Tấm này cho anh khoe một xíu nhé.',
  23: 'Nhìn vợ iu là anh lại thấy tự hào.',
  24: 'Đáng yêu kiểu rất tự nhiên.',
  25: 'Giữ lại một chút của ngày đáng nhớ.',
  26: 'Có vợ iu trong ảnh là anh thấy xinh rồi.',
  27: 'Anh chọn ảnh khó thật, vì ảnh nào cũng thích.',
  28: 'Album này toàn ảnh của người anh thương.',
  29: 'Thích tấm này. Chấm hết.',
  30: 'Vợ iu cứ rạng rỡ theo cách của mình nha.',
  31: 'Để dành mai mốt mở ra ngắm tiếp.',
  32: 'Cho anh xem thêm một tấm nữa đi.',
  33: 'Cảm ơn vợ iu vì đã cố gắng đến đây.',
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
    eyebrow: 'Một món quà nhỏ xíu cho vợ iu',
    title: 'Vợ iu ơi, anh có cái này cho vợ iu nè ♡',
    body: 'Anh gom mấy tấm hình anh thích, thêm một chút yêu thương với những lời anh muốn nói, rồi cất hết vào đây. Không phải món quà gì to tát đâu, nhưng anh làm riêng cho vợ iu đó. Mở ra xem với anh nha.',
    actionLabel: 'Vợ iu mở quà nha ♡',
  },
  hero: {
    eyebrow: '17.10.2026 · Ngày đặc biệt của vợ iu',
    title: 'Chúc mừng tốt nghiệp, vợ iu!',
    subheading: 'Nguyễn Võ Mai Khuê · Cử nhân Luật',
    lead: 'Nói nhỏ nè, anh tự hào về vợ iu lắm. Không chỉ vì tấm bằng đâu, mà vì vợ iu đã đi hết một chặng đường của riêng mình. Cho anh khoe một chút nhé: cô cử nhân xinh này là người yêu anh đó.',
    ctaLabel: 'Còn một chút nữa, vợ iu xem nha',
    scrollHint: 'Kéo xuống với anh một xíu nè ♡',
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
    title: 'Ngày của cô cử nhân anh thương',
    recipient: 'Nguyễn Võ Mai Khuê',
    degree: 'Cử nhân Luật',
    school: 'Đại học Tôn Đức Thắng',
    dateLabel: '17 tháng 10 năm 2026',
    note: 'Anh muốn giữ ngày 17/10 ở đây, để mỗi lần mở lại, vợ iu nhớ mình đã đi đến một cột mốc thật đẹp. Mong ngày ấy có thật nhiều nụ cười, nhiều tấm hình xinh và những người thương vợ iu ở bên. Phần tự hào về vợ iu thì để anh lo.',
  },
  message: {
    eyebrow: 'Anh muốn nói với vợ iu',
    title: 'Cho anh khen vợ iu một chút nha',
    body: 'Đi học, thi cử, rồi bao nhiêu chuyện phải lo... chắc chắn không phải ngày nào cũng dễ dàng. Vậy mà vợ iu đã đi đến cột mốc này rồi. Anh thấy vui thay cho vợ iu, thật đó. Nếu sau này có hôm nào vợ iu hơi nghi ngờ bản thân, nhớ mở lại trang này nhé. Có một người luôn nghĩ vợ iu giỏi lắm, và người đó là anh.',
  },
  gallery: {
    eyebrow: 'Một góc nhỏ để ngắm vợ iu',
    title: '34 tấm hình, một người anh thương',
    lead: 'Có tấm anh vừa nhìn đã thấy vui, có tấm lại muốn ngắm lâu thêm một chút. Anh gom hết vào đây vì tiếc chẳng muốn bỏ tấm nào. Ba mươi bốn tấm nghe thì nhiều, mà sao anh vẫn thấy chưa đủ nhỉ?',
    instruction: 'Chạm vào tấm nào vợ iu thích để ngắm rõ hơn nha ♡',
  },
  letter: {
    eyebrow: 'Mấy lời anh muốn giữ riêng cho vợ iu',
    title: 'Gửi vợ iu của anh',
    paragraphs: [
      'Vợ iu à, trước tiên cho anh nói điều quan trọng nhất nha: chúc mừng tốt nghiệp, cô cử nhân Luật của anh. Viết mấy chữ này thôi mà anh đã thấy vui rồi. Nghĩ đến ngày tốt nghiệp của vợ iu, anh vừa mừng, vừa muốn ôm vợ iu một cái thật lâu. Một ngày như vậy đáng được giữ lại thật kỹ mà.',
      'Anh không biết hết những ngày vợ iu đã phải cố gắng ra sao, và anh cũng không muốn nói như thể mình hiểu tất cả. Nhưng anh biết để đi tới đây chẳng dễ chút nào. Cho nên hôm nay, vợ iu nhớ tự khen mình một chút nhé. Không cần đợi ai công nhận đâu, vì những gì vợ iu đã làm được vốn đã rất đáng tự hào rồi.',
      'Cũng phải thú nhận là anh hơi thiên vị vợ iu. Nhìn tấm ảnh nào anh cũng thấy xinh, đọc tên Nguyễn Võ Mai Khuê bên cạnh hai chữ Cử nhân Luật là lại muốn khoe. Nhưng điều làm anh thương nhất không phải chiếc mũ tốt nghiệp hay tấm bằng, mà là chính cô gái đã cố gắng đi đến ngày này. Anh mong vợ iu cũng nhìn bản thân bằng ánh mắt dịu dàng như thế.',
      'Chặng đường sau này chắc sẽ có thêm nhiều điều mới, có những hôm háo hức và cũng có thể có những hôm chẳng vui lắm. Anh không dám hứa sẽ làm mọi chuyện dễ dàng hơn, nhưng anh muốn là người vợ iu có thể kể chuyện cùng, than thở một chút, hoặc chỉ ngồi cạnh mà không cần nói gì. Vợ iu không phải lúc nào cũng cần mạnh mẽ đâu. Mệt thì mình nghỉ một chút, rồi từ từ đi tiếp nhé.',
      'À, còn một chuyện nữa. Anh đã ngồi lựa ảnh, viết chữ, sửa đi sửa lại cái website này cũng kha khá lần. Có lúc chỉ một chi tiết nhỏ thôi mà anh loay hoay mãi. Nhưng cứ nghĩ đến lúc vợ iu mở ra xem, anh lại muốn làm thêm một chút nữa. Có thể món quà này chưa hoàn hảo, nhưng tình cảm anh đặt vào đây là thật. Mong mỗi lần ghé lại, vợ iu đều thấy mình được yêu thương. Chúc mừng tốt nghiệp nha, tình yêu của anh.',
    ],
    signature: 'Thương vợ iu nhiều lắm,\nQuân iu',
  },
  closing: {
    title: 'Mình còn nhiều ngày thật đẹp ở phía trước, vợ iu nhỉ?',
    body: 'Anh mong vợ iu được làm điều mình thích, gặp những người tử tế, có những ngày thật vui và những hôm mệt thì được nghỉ ngơi một chút. Mình không cần vội trở thành ai cả. Cứ sống theo cách vợ iu thấy hạnh phúc nhé. Còn anh, anh mong sẽ được ở bên, nghe vợ iu kể thêm thật nhiều chuyện và cùng vợ iu đón những cột mốc tiếp theo.',
    finalHighlight: 'Anh thương vợ iu. Nhiều lắm. ♡',
    actionLabel: 'Ngắm vợ iu thêm một xíu',
    replayLabel: 'Mở lại từ đầu nha ♡',
  },
  music: {
    src: 'Audio/Ariana Grande bye Altare Remix.mp3',
    title: 'Bản nhạc dành cho Mai Khuê',
    volume: 0.35,
    loop: true,
  },
  photos,
};
