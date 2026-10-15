# HappyGradSweetie — Tài liệu và hướng dẫn phát triển

Một món quà chúc mừng tốt nghiệp dành cho **Nguyễn Võ Mai Khuê** — trải nghiệm kể chuyện tương tác gồm intro mở quà, thiệp tốt nghiệp, lời chúc, gallery kỷ niệm 3D, thư tình và lời kết.

## Đọc từ đâu?

| Tài liệu | Mục đích |
|---|---|
| [PROGRESS.md](PROGRESS.md) | Trạng thái mới nhất, các phase đã làm/đã duyệt, checkpoint, kiểm thử và việc còn lại |
| [PLAN1.md](PLAN1.md) | Kế hoạch hiện hành **A Love Letter in Motion**, kiến trúc, acceptance criteria và review gates |
| [Notes/note4.txt](Notes/note4.txt) | Brief hiện hành; giữ nguyên nội dung người dùng cung cấp |
| [Notes](Notes/) | `note.txt`, `note2.txt`, `note3.txt`, `note4.txt`: các yêu cầu gốc theo từng đợt, không tự thay bằng kế hoạch mới |
| [Reviews/plan1](Reviews/plan1/README.md) | Baseline, Portrait, Hero, Scroll, Gallery, Content và bằng chứng kiểm chứng |
| [Archive/plan.md](Archive/plan.md) | Kế hoạch lịch sử; không dùng số phase cũ để suy trạng thái PLAN1 |

**Trạng thái ngày 16/10/2026:** PLAN1 đã hoàn thiện trong phạm vi được bạn chấp thuận: **Chromium Approved; thiết bị thật Waived by user, không phải Passed**. Source cuối đạt 105 tests, production/Pages build và đối chiếu integrity; giữ bằng chứng visual/loop đã duyệt. [Hồ sơ phát hành](Reviews/plan1/RELEASE-2026-10-16.md) ghi checkpoint theo phase, bằng chứng và giới hạn; [checklist Safari](Reviews/plan1/PHASE7-SAFARI-CHECKLIST.md) giữ làm tài liệu tùy chọn.

### Quy ước thư mục

```text
README.md                  # Trang giới thiệu ngắn ở gốc GitHub
Docs/
  README.md                # Mục lục + hướng dẫn phát triển (file này)
  PROGRESS.md              # Tiến trình hiện tại
  PLAN1.md                 # Kế hoạch đang thực hiện
  Notes/note*.txt          # Brief gốc, giữ nguyên byte/nội dung
  Archive/plan.md          # Kế hoạch trước PLAN1
  Reviews/plan1/           # Báo cáo Markdown theo từng mốc review
qa/plan1/                  # JSON, screenshot, video; không đổi vị trí evidence
scripts/qa/                # Collector/verifier; không phải tài liệu
```

Lệnh shell và đường dẫn trong code block được hiểu từ **gốc repository**. Các link Markdown dùng đường dẫn tương đối từ file tài liệu. JSON/capture cũ giữ nguyên đường dẫn lịch sử để bảo toàn evidence; ảnh/video local-only được đánh dấu trong review và không tự upload khi sắp xếp docs.

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
npm ci
npm start
```

Mở `http://localhost:4200/`. Để xem lại Intro sau khi đã mở quà, dùng nút replay ở phần Closing hoặc xóa session storage của website trong DevTools.

34 thumbnails hiện có đã được kiểm tra; không cần sinh lại khi chỉ chạy website. Chỉ chạy `images:thumbnails` khi bạn chủ động thay đổi bộ ảnh và muốn cập nhật thumbnail.

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

Nếu Edge compat-layer tự relaunch khiến Karma chạy xong nhưng không thoát, dùng launcher QA đã kiểm chứng (không đổi cấu hình ứng dụng):

```powershell
npm test -- --karma-config scripts/qa/karma-edge.cjs --browsers EdgeHeadlessQA
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

Xem [PLAN1.md](PLAN1.md) cho kế hoạch hiện hành và [PROGRESS.md](PROGRESS.md) cho trạng thái triển khai. [plan.md lịch sử](Archive/plan.md) vẫn được giữ để đối chiếu, không ghi đè.
