# HappyGradSweetie

Website chúc mừng tốt nghiệp dành cho Mai Khuê, xây dựng bằng Angular với intro mở quà, thiệp tốt nghiệp, gallery vòng cung 3D, lightbox và nhạc nền tùy chọn.

## Chạy local

```bash
npm install
npm run images:thumbnails
npm start
```

Mở `http://localhost:4200/`.

## Kiểm tra

```bash
npm test
npm run build
```

Nếu máy Windows chỉ có Microsoft Edge, chạy test với `CHROME_BIN` trỏ đến `msedge.exe` (Karma Chrome launcher tương thích Chromium).

## Cá nhân hóa nội dung

Sửa `src/app/data/celebration-content.ts` để thay nội dung Intro, Hero, thiệp tốt nghiệp, lời chúc, người gửi, caption và metadata ảnh. Ảnh gốc được giữ tại `public/Image/original/`; gallery dùng thumbnail tại `public/Image/thumb/`, còn Lightbox dùng ảnh gốc.

Mỗi ảnh có `order`, `featured`, `title`, `alt`, `caption`, `thumbnailSrc` và `src`. Gallery dùng thứ tự này để chạy vòng cung liên tục qua toàn bộ ảnh.

## Nhạc nền

`music.src` trong `celebration-content.ts` trỏ đến file audio tương đối trong `public/Audio/`. Nhạc không tự phát; người xem phải bấm nút nhạc. Đặt `src: null` để ẩn hoàn toàn music control.

## GitHub Pages

```bash
npm run build:github-pages
```

Artifact được tạo tại `dist/happy-grad-sweetie/browser` với base path `/HappyGradSweetie/`. Workflow `.github/workflows/deploy-pages.yml` chỉ chạy sau khi bạn push lên nhánh `master`; repository này không tự được deploy bởi các lệnh local.
