import { CelebrationContent, Photo } from '../models/celebration.models';

const photos: readonly Photo[] = Array.from({ length: 34 }, (_, index) => {
  const id = index + 1;

  return {
    id,
    src: `Image/original/${id}.jpg`,
    thumbnailSrc: `Image/thumb/${id}.jpg`,
    alt: `Khoảnh khắc tốt nghiệp ${id}`,
    title: `Khoảnh khắc ${id}`,
    caption: '',
    order: id,
  };
});

export const celebrationContent: CelebrationContent = {
  hero: {
    eyebrow: 'Một cột mốc thật đẹp',
    title: 'Chúc mừng ngày tốt nghiệp, [Tên người nhận]',
    lead: 'Hôm nay là dịp để nhìn lại một hành trình đáng tự hào và mở ra những điều rực rỡ phía trước.',
    ctaLabel: 'Mở những khoảnh khắc',
  },
  message: {
    eyebrow: 'Dành cho bạn',
    title: 'Một chặng đường đã nở hoa',
    body:
      'Từng ngày kiên trì đã góp lại thành khoảnh khắc đáng nhớ này. Mong rằng niềm tự hào hôm nay sẽ luôn ở bên bạn trên mọi hành trình tiếp theo.',
  },
  gallery: {
    eyebrow: 'Kỷ niệm tốt nghiệp',
    title: 'Những khoảnh khắc đáng nhớ',
    lead: 'Di chuyển qua từng lớp ảnh để mở lại những lát cắt thật đẹp của ngày hôm nay.',
  },
  letter: {
    eyebrow: 'Một lá thư nhỏ',
    title: 'Gửi đến [Tên người nhận]',
    paragraphs: [
      'Chúc mừng bạn vì đã đi đến một cột mốc thật đáng tự hào. Tấm bằng hôm nay là kết quả của rất nhiều cố gắng, dịu dàng và bền bỉ.',
      'Mong rằng bạn sẽ giữ thật lâu niềm vui của ngày hôm nay, tin vào con đường mình chọn và luôn gặp được những điều xứng đáng ở phía trước.',
    ],
    signature: '[Tên người gửi]',
  },
  closing: {
    title: 'Và đây mới chỉ là khởi đầu',
    body: 'Chúc bạn luôn vững vàng, rạng rỡ và tìm thấy thật nhiều niềm vui trên chặng đường mới.',
    actionLabel: 'Xem lại kỷ niệm',
  },
  photos,
};
