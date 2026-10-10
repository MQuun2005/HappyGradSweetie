# HappyGradSweetie — Kế hoạch triển khai và checklist

## Mục tiêu

Xây dựng website chúc mừng tốt nghiệp bằng Angular 20.3.x, thiên về trải nghiệm kể chuyện, ảnh kỷ niệm và gallery 3D. Chỉ thay đổi repository `HappyGradSweetie`; không sửa WomenDayCeleration, không ghi đè ảnh gốc, favicon hoặc `note.txt`, không commit/push/deploy tự động.

## Quyết định kỹ thuật

- Angular 20.3.x, standalone components, TypeScript strict và không dùng Angular Router: đây là trang cuộn một trang.
- CSS sở hữu bố cục, responsive, hover và CSS 3D; GSAP chỉ chạy reveal, chuyển nhóm ảnh và animation lightbox có thể hủy an toàn.
- Curved 3D carousel là gallery chính: desktop hiển thị 7 ảnh/lượt theo 5 nhóm `1–7`, `8–14`, `15–21`, `22–28`, `29–34`.
- Tạo thumbnail 640px tại `public/Image/thumb/`; giữ nguyên 34 ảnh gốc và dùng chúng cho lightbox.
- Không có nhạc nền ở phiên bản đầu.
- GitHub Pages dùng base href `/HappyGradSweetie/`; chỉ chuẩn bị workflow, không tự triển khai.

## Cấu trúc dự kiến

```text
src/
  app/
    components/{graduation-hero,graduation-message,interactive-photo-gallery,photo-lightbox,graduation-letter,closing-section}/
    data/celebration-content.ts
    models/celebration.models.ts
    utils/gallery-layout.ts
    app.ts | app.html | app.css | app.config.ts
  main.ts | index.html | styles.css
public/Image/                  # ảnh gốc, chỉ đọc
public/Image/thumb/            # ảnh sinh mới
scripts/{generate-thumbnails,prepare-github-pages}.mjs
.github/workflows/deploy-pages.yml
```

`celebration-content.ts` là nguồn dữ liệu duy nhất cho người nhận, thông tin tốt nghiệp, thông điệp, thư, lời kết và metadata ảnh. Khi chưa có dữ liệu thật, dùng placeholder dạng `[Tên người nhận]`.

## Thiết kế và tương tác

- Palette: midnight navy `#10182A`, navy elevated `#1E2A44`, champagne gold `#D4B06A`, warm ivory `#F8F2E8`, blush accent `#E7B9C2`.
- Hành trình: Graduation Hero → Graduation Message → Our Beautiful Memories → Personal Graduation Letter → Closing.
- Gallery có `perspective`, `transform-style: preserve-3d`, ảnh trung tâm gần hơn và ảnh hai bên lùi dần theo Z. Hover/focus nâng card, xoay về hướng dễ xem, tăng z-index và làm các card khác dịu đi.
- Parallax con trỏ cập nhật CSS variables qua một `requestAnimationFrame`, chạy ngoài Angular change detection. Mobile dùng tap chọn/tap mở, swipe ngang có `touch-action: pan-y`.
- Lightbox hỗ trợ click backdrop, Escape, mũi tên trái/phải, focus trap, khóa scroll và khôi phục focus về ảnh kích hoạt.
- Reduced motion bỏ tween/parallax nhưng giữ đủ điều hướng, lightbox và nội dung.

## Hợp đồng dữ liệu và state

- `Photo`: `id`, `src`, `thumbnailSrc`, `alt`, `title`, `caption`, `order`.
- `CelebrationContent`: Hero, message, letter, closing và `readonly photos`.
- Gallery state: `before-enter → entering → idle ↔ focused → lightbox-open`; `navigating` khóa thao tác chuyển nhóm cho tới khi tween kết thúc.
- Khi destroy: hủy GSAP context/timeline, cancel RAF, disconnect observer, bỏ listener và phục hồi scroll body.

## Phases và tiêu chí hoàn thành

### 0. Lưu kế hoạch

- File này được tạo trước bất kỳ source code nào và là chuẩn để review tiến độ.
- Mỗi phase dưới đây sẽ được đánh dấu/đối chiếu sau khi thực hiện.

### 1. Foundation

- Tạo Angular workspace trực tiếp ở repository root bằng các file mới; không chạy `ng new` trên folder có asset.
- Thêm scripts build/test/thumbnail/GitHub Pages và cấu hình TypeScript strict.
- Hoàn thành khi `npm install`, build và test chạy được, không sinh nested project.

### 2. UI foundation

- Thêm models, data config, global tokens, Hero và Message.
- Hoàn thành khi CTA cuộn đúng section, copy chỉ đọc từ data file, không horizontal overflow ở desktop/mobile.

### 3. Gallery foundation

- Tạo thumbnail từ ảnh gốc, 34 bản ghi `Photo`, layout curved carousel, controls và lazy loading.
- Hoàn thành khi xem được đủ 34 ảnh theo đúng thứ tự, nhóm cuối có 6 ảnh và ảnh lỗi có fallback UI.

### 4. Animation và interaction

- Thêm reveal, CSS 3D hover/focus, parallax, keyboard, touch/swipe và cleanup.
- Hoàn thành khi hover liên tiếp không kẹt state, reduced-motion vẫn đầy đủ chức năng và không render Angular liên tục theo pointer.

### 5. Lightbox

- Thêm modal truy cập được với focus trap, navigation, image error state và scroll lock.
- Hoàn thành khi mở/đóng liên tục không mất vị trí gallery và focus quay về đúng card.

### 6. Letter và Closing

- Hoàn thiện bức thư, lời kết và animation trang trí tối giản.
- Hoàn thành khi toàn bộ hành trình liền mạch, không thêm nội dung 20/10 hay thông tin cá nhân hard-code.

### 7. Quality assurance

- Kiểm tra build, tests, 1440px/768px/390px, keyboard, touch, resize, image errors, 34 ảnh, reduced motion và cleanup.
- Hoàn thành khi không có TypeScript/runtime error nghiêm trọng, broken asset path hay overflow không chủ đích.

### 8. GitHub Pages preparation

- Thêm `github-pages` configuration với base href đúng, 404 redirect, `.nojekyll`, script copy artifact và workflow Pages cho `master`.
- Hoàn thành khi artifact ở `dist/happy-grad-sweetie/browser` và không còn đường dẫn WomenDay.

## Dependencies

- Giữ Angular 20.3.x, RxJS, Zone.js, TypeScript 5.9.x và tooling Angular tương thích.
- Thêm `gsap` 3.x, `@angular/cdk` cùng major Angular (focus trap), `sharp` ở devDependencies (thumbnail).
- Không thêm Three.js/WebGL, Tailwind, carousel/state-management library, React/Framer Motion hay ảnh ngoài.

## Rủi ro và kiểm soát

| Rủi ro | Kiểm soát |
| --- | --- |
| 3D stacking/clipping | `preserve-3d`, z-index rõ, scene không clip, focus shift có giới hạn. |
| Tải/memory của 34 ảnh | Thumbnail, lazy load, preload nhóm kế tiếp; ảnh gốc chỉ ở lightbox. |
| CSS/GSAP conflict | GSAP animate opacity/CSS variables, CSS sở hữu transform. |
| Listener/tween tồn đọng | Cleanup đủ observer, RAF, GSAP và scroll lock trong `ngOnDestroy`. |
| Touch/responsive | Tap chọn/tap mở, swipe có ngưỡng, layout riêng desktop/tablet/mobile. |
| Base path GitHub Pages | Một base href `/HappyGradSweetie/`, asset relative và kiểm tra artifact. |
| Mất asset hiện hữu | Không sửa/xóa `public/Image/*.jpg`, favicon hoặc `note.txt`. |

## Checklist phát hành

- [x] Build production và unit tests thành công.
- [x] 34 ảnh gốc còn nguyên, 34 thumbnail có mặt.
- [ ] Gallery 3D/hover desktop không clipping — cần visual QA trên browser ở desktop.
- [ ] Mobile xem và mở đủ 34 ảnh không cần hover — cần visual QA trên thiết bị hoặc browser mobile emulation.
- [ ] Lightbox đạt keyboard, focus, close và image-error behavior — đã có implementation, cần thao tác QA thủ công.
- [ ] Reduced motion vẫn có đủ nội dung và điều hướng — đã có CSS/logic, cần thao tác QA thủ công.
- [x] Không còn nội dung/đường dẫn của WomenDay trong source/configuration mới.
- [x] GitHub Pages artifact đúng subpath; chưa deploy nếu chưa được yêu cầu.

## Nhật ký implementation

| Phase | Trạng thái | Bằng chứng |
| --- | --- | --- |
| 0. Lưu kế hoạch | Hoàn thành | File `plan.md` này được tạo trước source code. |
| 1. Foundation | Hoàn thành | Angular 20.3.x, strict TypeScript, standalone bootstrap; production build pass. |
| 2. UI foundation | Hoàn thành | Hero, Message, design tokens và data source tập trung đã có. |
| 3. Gallery foundation | Hoàn thành | 34 metadata records, 34 thumbnail, phân trang 7 ảnh desktop/3 ảnh mobile. |
| 4. Animation & interaction | Hoàn thành code | CSS 3D, GSAP reveal/navigation, parallax RAF, keyboard/tap state và cleanup đã có; còn visual QA. |
| 5. Lightbox | Hoàn thành code | Modal, focus trap, keyboard, image-error state, scroll lock và restore focus đã có; còn thao tác QA. |
| 6. Letter & Closing | Hoàn thành | Hai section dùng dữ liệu từ configuration đã có. |
| 7. Quality assurance | Hoàn thành tự động | 4 Jasmine tests pass qua Edge headless; build production và Pages artifact pass. |
| 8. GitHub Pages | Đã chuẩn bị | Workflow, `404.html`, `.nojekyll`, base href và local artifact đã kiểm tra; không deploy. |
