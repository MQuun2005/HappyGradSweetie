# HappyGradSweetie — Kế hoạch triển khai và checklist

> Website quà tốt nghiệp dành cho Nguyễn Võ Mai Khuê. Tài liệu này là nguồn tham chiếu cho kiến trúc, phạm vi, tiến độ và nghiệm thu.

## 1. Mục tiêu và nguyên tắc

HappyGradSweetie là trải nghiệm kể chuyện tương tác một trang: mở món quà, xem lời chúc, khám phá 34 kỷ niệm bằng gallery 3D, đọc thư và khép lại bằng lời nhắn yêu thương.

- Giữ nguyên nội dung Mai Khuê/Quân iu và 34 ảnh gốc.
- Không sửa `WomenDayCeleration`, không thêm framework/WebGL hoặc thư viện carousel nặng.
- Không để animation ảnh hưởng khả năng đọc, điều hướng và accessibility.
- Mọi thay đổi lớn phải qua test, build và visual QA phù hợp.

## 2. Trạng thái hiện tại

Source đã có Angular standalone/strict TypeScript, intro `sessionStorage` và replay, sáu chương Hero/Invitation/Message/Memories/Letter/Closing, gallery 3D continuous position với virtual window và RAF motion, drag/swipe/keyboard, Lightbox ảnh gốc với preload/focus trap/loading/error/scroll restore, audio gesture-aware, responsive phone/iPad, safe-area và GitHub Pages.

Visual QA vẫn cần xác nhận bằng screenshot/preview: chiều sâu 3D, clipping, Safari/iOS thật, audio policy và performance profile.

## 3. Kiến trúc

```text
src/app/
  app.ts | app.html | app.css
  components/{gift-intro,graduation-hero,graduation-invitation,
    graduation-message,interactive-photo-gallery,photo-lightbox,
    graduation-letter,closing-section,music-control,section-navigator}/
  data/celebration-content.ts
  models/celebration.models.ts
  utils/gallery-layout.ts
src/index.html | src/styles.css
public/Image/{original,thumb}/
public/Audio/
scripts/{generate-thumbnails,prepare-github-pages}.mjs
.github/workflows/deploy-pages.yml
```

`celebration-content.ts` là nguồn dữ liệu duy nhất cho copy, metadata ảnh và audio.

## 4. Quyết định kỹ thuật

### Nền tảng và visual

- Angular 20.3.x, standalone components, Signals, strict TypeScript.
- Angular CDK cho focus trap; Sharp cho thumbnail; GSAP có sẵn cho animation phù hợp.
- Không dùng Three.js/WebGL, Router hay thư viện carousel/state-management mới.
- Palette pastel: ivory `#FFF9F3`, cream `#F7EDE3`, blush `#EAB8BE`, peach `#F4CCB9`, lavender `#E7E0F1`, gold `#C9A46A`, dusty rose `#B9707D`, navy `#27324B`, body `#5E5A68`.
- Cormorant Garamond cho heading, Plus Jakarta Sans cho body; motion transform/opacity 300–650ms và tôn trọng reduced motion.

### Gallery 3D

Continuous logical position thay cho phân trang. Geometry tính theo relative position, camera profile và virtual window; desktop tối đa 11 card DOM. Thumbnail chỉ tải trong window, original chỉ tải khi Lightbox mở.

RAF là single writer cho transform/opacity. Signals chỉ cập nhật active photo và virtual anchor. State ưu tiên: `destroyed > reduced-motion > suspended > offscreen > dragging > inertia > hovering/focused > paused > auto-moving`.

### Scroll, navigation và audio

- Native CSS scroll snap `proximity`, không chặn wheel/touch.
- Active section lấy quanh narrative line ở 42% viewport, có hysteresis 64px.
- ID chuẩn: `home`, `invitation`, `message`, `memories`, `letter`, `closing`.
- Intro/Lightbox khóa scroll nền và khôi phục vị trí.
- Một audio element duy nhất; `openGift()` gọi play trong user gesture, bắt rejection, loop và fade-in.

## 5. Data và asset contract

`Photo`: `id`, `src`, `thumbnailSrc`, `alt`, `title`, `caption`, `order`, `featured`.

- `Image/original/{id}.jpg` và `Image/thumb/{id}.jpg`.
- ID/order duy nhất 1–34, `featured` mặc định `false`.
- Không ghi đè, đổi tên hoặc chỉnh sửa ảnh gốc.

## 6. Phases

### Phase 0 — Kế hoạch

Lưu tài liệu trước source; dùng checklist này làm chuẩn review.

### Phase 1 — Foundation và content

Chuẩn hóa Angular/strict TS, scripts, models, nội dung Mai Khuê và 34 metadata; kiểm tra paths.

### Phase 2 — Visual foundation

Áp dụng pastel tokens, typography, spacing, focus state và safe area; kiểm tra 390/768/1440px.

### Phase 3 — Intro, invitation và journey

Hoàn thiện mở quà, replay, invitation và CTA; khóa/mở scroll nền đúng lifecycle.

### Phase 4 — Static 3D gallery

Chốt geometry rail, camera 3/4, depth sorting, responsive profile và virtual window. Dừng để review screenshot trước autoplay.

### Phase 5 — Motion và interaction

Thêm auto motion, pause/resume, hover/focus, pointer capture, drag/swipe, inertia, keyboard và cleanup; loop 34 → 1 không jump.

### Phase 6 — Lightbox

Tích hợp pause gallery, original image, loading/error, circular navigation, preload, focus trap và restore vị trí.

### Phase 7 — Letter, audio và closing

Reveal thư, sparkle nhẹ, audio lifecycle duy nhất và replay journey; không hiển thị control nhạc chết.

### Phase 8 — QA và phát hành

Chạy tests/build/Pages build, kiểm tra artifact, screenshot, console, network, reduced motion, keyboard và touch. Commit/push/deploy chỉ theo yêu cầu.

## 7. Test và nghiệm thu

Tự động: `npm test`, `npm run build`, `npm run build:github-pages`; unit test geometry/modulo/window/responsive/content; component test empty/single/34 photos, ARIA, controls, audio và Lightbox.

Visual: desktop 1366×768, 1440×900, 1920×1080; iPhone 16 393×852; iPad Gen 10 820×1180 và 1180×820; kiểm tra first visit, replay, `#memories`, back/forward, 30–60 giây gallery, Lightbox, orientation và reduced motion.

### Acceptance checklist

- [ ] 34 original + 34 thumbnail nguyên vẹn, paths hợp lệ.
- [ ] Không placeholder, không console/runtime error.
- [ ] Gallery có near/mid/far depth, không clipping/overflow, loop liên tục.
- [ ] Hover, drag, swipe, keyboard và Lightbox không xung đột.
- [ ] Audio rejection an toàn, không duplicate/reset.
- [ ] Safe-area, touch target và responsive phone/iPad đạt yêu cầu.
- [ ] Ba lệnh test/build ở trên đều thành công.

## 8. Rủi ro và nhật ký

| Rủi ro | Kiểm soát |
| --- | --- |
| CSS 3D clipping/stacking | perspective, preserve-3d, virtual window và screenshot QA |
| Angular render quá nhiều | RAF single-writer, Signals chỉ semantic |
| Drag xung đột scroll dọc | threshold 8px, ưu tiên hướng ngang |
| Autoplay bị chặn | play trong gesture, bắt Promise rejection |
| Safari dynamic viewport | svh/dvh và safe-area variables |
| Pages sai asset path | base href `/HappyGradSweetie/` và Pages build |
| Mất dữ liệu cá nhân | bảo vệ original, content source và file ngoài phạm vi |

| Hạng mục | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Foundation/content | Hoàn thành | Angular 20, strict TS, 34 metadata |
| UI/responsive base | Hoàn thành code | pastel tokens, safe area, phone/iPad profiles |
| Gallery/Lightbox | Hoàn thành code | continuous position, RAF, virtual window, focus trap |
| Audio | Hoàn thành code | audio-only, loop, gesture play, rejection handling |
| Tests/build | Hoàn thành | 16 Jasmine tests; production/Pages build pass |
| Browser visual QA | Chờ kiểm tra | cần Chromium preview hoặc screenshot/video thiết bị |
| Git | Đã push | commit `d88ed00` trên `master`; workflow Pages tự chạy |
