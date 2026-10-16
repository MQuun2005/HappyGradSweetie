import { CelebrationContent, Photo } from '../models/celebration.models';

const captions: Readonly<Record<number, string>> = {
  1: 'Cô cử nhân xinh đẹp nhất trong mắt anh.',
  2: 'Chiếc mũ tốt nghiệp xinh thật, nhưng vợ iu còn xinh hơn gấp bội.',
  3: 'Nụ cười tỏa nắng làm bừng sáng cả ngày hôm nay.',
  4: 'Khuê của anh hôm nay rạng ngời và kiêu hãnh lắm.',
  5: 'Góc nào của em anh cũng muốn ngắm mãi không thôi.',
  6: 'Nhìn em hạnh phúc thế này, lòng anh cũng ngập tràn ấm áp.',
  7: 'Dù đứng giữa bao nhiêu người, ánh mắt anh vẫn chỉ tìm thấy em.',
  8: 'Nét dịu dàng đặc biệt mà anh chỉ muốn giữ làm của riêng.',
  9: 'Rạng rỡ theo cách của riêng vợ iu.',
  10: 'Bao nhiêu vất vả học hành, đổi lại bằng nụ cười viên mãn này.',
  11: 'Hôm nay em là cô gái rực rỡ và hạnh phúc nhất trần đời.',
  12: 'Thích ngắm vẻ mặt tự tin và đầy kiêu hãnh này của em.',
  13: 'Một chút bẽn lẽn đáng yêu làm tim anh rung rinh.',
  14: 'Đáng yêu thế này thì ai mà không xiêu lòng cho được chứ.',
  15: 'Tà áo cử nhân hôm nay thật vừa vặn với vẻ đẹp của em.',
  16: 'Ánh mắt lấp lánh như gom hết cả mùa thu vào trong đó.',
  17: 'Vợ iu của anh giỏi quá đi thôi, tự hào về em hết nấc!',
  18: 'Chỉ cần nhìn thấy nụ cười này là bao nhiêu mệt mỏi trong anh tan biến hết.',
  19: 'Vẻ đẹp tri thức của tân cử nhân Luật làm anh say đắm.',
  20: 'Khoảnh khắc nào có em cũng đều hóa thành điều kỳ diệu.',
  21: 'Cứ mỗi lần cười là hai má lại ửng hồng cưng xỉu.',
  22: 'Dáng vẻ tập trung lúc nào cũng toát lên sự cuốn hút lạ kỳ.',
  23: 'Cứ tự tin và tỏa sáng như thế nhé, cô gái của anh.',
  24: 'Cảm ơn em vì đã luôn kiên trì và chưa từng bỏ cuộc.',
  25: 'Nụ cười này, ánh mắt này, anh xin nhận thầu trọn đời nhé.',
  26: 'Một chút ngọt ngào cho ngày tốt nghiệp thêm trọn vẹn.',
  27: 'Hôm nay em xinh đẹp như một nàng công chúa bước ra từ cổ tích.',
  28: 'Mỗi góc ảnh đều lưu lại thanh xuân rực rỡ nhất của em.',
  29: 'Một chút dịu dàng làm tim anh lỡ nhịp.',
  30: 'Từng bước chân của em hôm nay đều có anh dõi theo với tất cả tự hào.',
  31: 'Chẳng cần tạo dáng cầu kỳ, em cứ là em đã đủ làm anh mê mẩn.',
  32: 'Chúc mừng tân cử nhân xuất sắc và đáng yêu nhất của anh.',
  33: 'Thương em từ những ngày ôn thi vất vả đến giây phút vinh quang này.',
  34: 'Thật hạnh phúc vì ngày này có anh cùng em đi qua.',
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
    body: 'Không phải món quà gì to tát đâu, chỉ là một góc nhỏ anh gói ghém yêu thương để cất giữ nụ cười rạng rỡ nhất của em trong ngày đặc biệt này.',
    actionLabel: 'Vợ iu mở quà nhé ♡',
  },
  hero: {
    eyebrow: '17.10.2026 · Ngày đặc biệt của vợ iu',
    title: 'Vợ iu tốt nghiệp rồi!',
    subheading: 'Một cột mốc thật đẹp của Nguyễn Võ Mai Khuê.',
    lead: 'Vợ iu của anh làm được rồi này! Bao nhiêu đêm thức khuya ôn bài, bao nhiêu vất vả cuối cùng cũng nở hoa. Nhìn em rạng rỡ hôm nay, anh tự hào về em vô cùng.',
    ctaLabel: 'Cùng anh xem tiếp nha',
    scrollHint: 'Cuộn xuống cùng anh xem tiếp nhé, vợ iu ♡',
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
    note: 'Ngày để tôn vinh sự kiên trì và nỗ lực tuyệt vời của cô cử nhân Luật. Cảm ơn em vì đã không bao giờ bỏ cuộc, và cảm ơn vì đã cho anh cơ hội được đồng hành bên em.',
  },
  message: {
    eyebrow: 'Từ anh, gửi vợ iu',
    title: 'Anh tự hào về vợ iu nhiều lắm',
    body: 'Học Luật chưa bao giờ là dễ dàng, anh biết em đã trải qua biết bao kỳ thi căng thẳng và những chồng tài liệu dày cộp. Nhưng nhìn nụ cười của em hôm nay, anh biết mọi nỗ lực đều xứng đáng. Mong cô gái của anh bước tiếp con đường phía trước luôn vững vàng, hạnh phúc và luôn nhớ rằng: em xứng đáng với tất cả những điều dịu dàng nhất.',
  },
  gallery: {
    eyebrow: 'Những khoảnh khắc thật xinh',
    title: '34 khoảnh khắc anh muốn ngắm mãi',
    lead: 'Từng bức ảnh là từng nụ cười, từng nét đáng yêu của em mà anh gom góp lại. Sau này nhìn lại, anh chỉ mong em luôn nhớ rằng mình đã từng có một thanh xuân rực rỡ và xinh đẹp đến thế.',
    instruction: 'Chạm vào một bức ảnh để ngắm vợ iu rõ hơn nhé.',
  },
  letter: {
    eyebrow: 'Một lá thư nhỏ từ anh',
    title: 'Gửi vợ iu của anh',
    paragraphs: [
      'Vợ iu à, vậy là chặng đường đại học đầy ắp kỷ niệm đã chính thức khép lại rồi. Nhìn em rạng ngời bước lên bục nhận bằng hôm nay, anh vừa hạnh phúc, vừa thương em nhiều lắm. Anh biết để chạm tới ngày hôm nay, em đã phải trải qua không ít đêm thức trắng, những áp lực và lo âu. Anh chỉ muốn ôm em vào lòng thật chặt và nói: Khuê của anh giỏi lắm, em thực sự rất cừ khôi!',
      'Anh mê nhất là những lúc em cười tít mắt, và lại càng thương hơn khi thấy ánh mắt em lấp lánh niềm tự hào về chính mình. Lễ tốt nghiệp này không chỉ là một lời chúc mừng, mà là để em nhận ra rằng cô gái nhỏ của anh mạnh mẽ và kiên cường đến thế nào. Cứ mãi tự tin như vậy nhé, vì em luôn là điều tuyệt vời nhất.',
      'Chặng đường sắp tới khi bước ra trường đời chắc chắn sẽ có nhiều bỡ ngỡ và thử thách mới. Sẽ có những ngày ngập tràn niềm vui, nhưng cũng có thể có lúc em thấy mệt mỏi hay chênh vênh. Những lúc như thế, em chỉ cần nhớ rằng sau lưng em luôn có anh. Em sẽ không bao giờ phải một mình đối diện với bất cứ điều gì cả.',
      'Anh muốn tiếp tục được ở bên em, được nghe em kể những chuyện vụn vặt mỗi ngày, cùng em nấu ăn, dạo phố và đi qua thêm thật nhiều cột mốc nữa của cuộc đời. Cảm ơn em vì đã đến và mang lại cho anh biết bao bình yên. Chúc mừng tốt nghiệp nhé, tình yêu to bự của anh!',
    ],
    signature: 'Thương vợ iu rất nhiều,\nQuân iu',
  },
  closing: {
    title: 'Vợ iu ơi, hành trình đẹp nhất vẫn còn ở phía trước',
    body: 'Chúc cô cử nhân của anh luôn giữ trọn ngọn lửa đam mê, luôn an yên và được làm những điều mình yêu thích. Còn bão giông hay nhọc nhằn phía trước, cứ để anh cùng em san sẻ. Mình cùng nhau bước tiếp nhé!',
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
