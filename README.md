# HappyGradSweetie

Một món quà chúc mừng tốt nghiệp dành cho **Nguyễn Võ Mai Khuê** — trải nghiệm kể chuyện tương tác gồm intro mở quà, thiệp tốt nghiệp, lời chúc, gallery kỷ niệm 3D, thư tình và lời kết.

## Điểm nổi bật

- Angular 20 standalone components và TypeScript strict.
- Giao diện pastel responsive cho desktop, điện thoại và iPad.
- 34 ảnh kỷ niệm: thumbnail cho gallery, ảnh gốc cho Lightbox.
- Gallery curved 3D liên tục với virtual window, autoplay nhẹ, hover/focus, drag/swipe và keyboard.
- Lightbox có ảnh gốc, caption, loading/error, điều hướng vòng, preload ảnh kề, focus trap và khóa scroll nền.
- Intro ghi nhớ trong session và có thể replay toàn bộ hành trình.
- Nhạc nền không có nút UI: bắt đầu khi mở quà nếu trình duyệt cho phép; autoplay rejection được xử lý an toàn.
- GitHub Pages sẵn sàng với base path `/HappyGradSweetie/`.

## Yêu cầu môi trường

- Node.js tương thích Angular 20.
- npm.
- Chromium/Chrome/Edge để chạy Karma headless. Trên Windows có thể đặt `CHROME_BIN` tới `msedge.exe`.

## Chạy local

```bash
npm install
npm run images:thumbnails
npm start
```

Mở `http://localhost:4200/`. Để xem lại Intro sau khi đã mở quà, dùng nút replay ở phần Closing hoặc xóa session storage của website trong DevTools.

## Scripts

```bash
npm start                    # Dev server
npm test                     # Jasmine/Karma headless
npm run build                # Production build
npm run images:thumbnails    # Sinh thumbnail từ ảnh gốc
npm run build:github-pages   # Build và chuẩn bị artifact Pages
```

Trên Windows nếu Edge là Chromium duy nhất:

```powershell
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test
```

## Cấu trúc quan trọng

```text
src/app/data/celebration-content.ts       # Nội dung và metadata duy nhất
src/app/models/celebration.models.ts      # Data contract
src/app/components/interactive-photo-gallery/
src/app/components/photo-lightbox/
src/app/components/music-control/
src/app/utils/gallery-layout.ts
public/Image/original/                     # 34 ảnh gốc
public/Image/thumb/                        # 34 thumbnail
public/Audio/                              # Audio tùy chọn
.github/workflows/deploy-pages.yml
```

## Cá nhân hóa nội dung và ảnh

Chỉnh `src/app/data/celebration-content.ts` để thay intro, hero, thiệp, lời chúc, thư, closing, caption và metadata ảnh. Component đọc dữ liệu từ file này nên không cần sửa template để đổi copy.

Giữ contract ảnh:

```text
Image/original/{id}.jpg
Image/thumb/{id}.jpg
```

Không đặt ảnh mới đè lên `original/`. Script thumbnail dùng Sharp và có thể chạy lại khi cần. Gallery chỉ tải thumbnail trong virtual window; Lightbox mới tải ảnh gốc.

## Audio và chính sách trình duyệt

Audio được cấu hình trong `celebrationContent.music`:

```ts
music: {
  src: 'Audio/your-file.mp3',
  title: '...',
  volume: 0.35,
  loop: true,
}
```

Nhạc được thử phát đồng bộ khi người dùng bấm **Mở món quà**. Safari/iOS và một số trình duyệt có thể chặn autoplay có âm thanh; đây là giới hạn chính sách được tôn trọng. Promise rejection không làm hỏng website và không tạo nút nhạc chết.

Chỉ sử dụng audio mà bạn có quyền phát công khai, đặc biệt khi deploy lên GitHub Pages.

## GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` chạy khi push lên nhánh `master`.

Build thủ công:

```bash
npm run build:github-pages
```

Artifact nằm tại `dist/happy-grad-sweetie/browser`, với base href `/HappyGradSweetie/`. Sau khi push, GitHub Actions sẽ tự build và publish nếu Pages đã được bật trong repository settings. Deploy có thể mất vài phút; xem tab **Actions** để kiểm tra trạng thái.

## Kiểm tra responsive và accessibility

Nên kiểm tra: desktop 1366×768, 1440×900, 1920×1080; iPhone 16 emulation 393×852 và landscape; iPad Gen 10 820×1180 và 1180×820.

Kiểm tra thêm keyboard focus, `prefers-reduced-motion`, refresh tại `#memories`, back/forward, orientation change, Lightbox, console và network. Nếu dùng browser emulation, ghi rõ đó là mô phỏng Chromium; không xem đó là kiểm thử Safari thật.

## Phạm vi bảo vệ

Project này chỉ thay đổi `HappyGradSweetie`: không sửa `WomenDayCeleration`, không xóa ảnh gốc, không thêm dependency lớn và không tự deploy ngoài workflow đã cấu hình.

Xem [plan.md](plan.md) để đọc kiến trúc, phases, rủi ro, checklist nghiệm thu và nhật ký triển khai chi tiết.
