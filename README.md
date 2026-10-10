# HappyGradSweetie

Website chúc mừng tốt nghiệp xây dựng bằng Angular, với gallery ảnh 3D và lightbox truy cập được.

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

Sửa duy nhất `src/app/data/celebration-content.ts` để thay tên người nhận, lời chúc, người gửi, caption và metadata ảnh. Ảnh gốc được giữ tại `public/Image/`; gallery dùng bản rút gọn trong `public/Image/thumb/` còn lightbox dùng ảnh gốc.

## GitHub Pages

```bash
npm run build:github-pages
```

Artifact được tạo tại `dist/happy-grad-sweetie/browser` với base path `/HappyGradSweetie/`. Workflow `.github/workflows/deploy-pages.yml` chỉ chạy sau khi bạn push lên nhánh `master`; repository này không tự được deploy bởi các lệnh local.
