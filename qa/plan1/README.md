# PLAN1 — Checkpoint và bằng chứng review

Ngày chốt checkpoint: **14/10/2026**. Yêu cầu: commit/push từng phần đã làm được, không đợi hoàn tất toàn bộ PLAN1.

## Trạng thái và cách chia commit

| Checkpoint | Phạm vi | Trạng thái |
|---|---|---|
| Phase 2 | PNG portrait đã duyệt, WebP responsive, giữ bản thử ngoài Git | Đã duyệt asset |
| Phase 3.1 | Hero data contract, copy đã chốt, portrait component/fallback và tests | Nền tảng Hero |
| Phase 4.1 | Opening story directive, section alignment/controller, unit tests | Nền tảng Scroll |
| Phase 4.2 | Kết nối Hero/portrait track vào App, sticky/scrub, Lightbox scroll/focus restoration | Hero + Scroll đã được duyệt; tích hợp chung để không thiếu dependency |
| Phase 5.1 | Camera-space presentation, quaternion orientation, viewport/neighbor clearance, tests | Checkpoint kỹ thuật |
| Phase 5.2 | Gallery renderer, pointer/hover handoff, lifecycle, responsive rail và tests | Đã sửa ca hover che ảnh kề; chờ bạn review lại |
| Phase 5.3 | Scripts QA, kế hoạch, review dossiers, bằng chứng chọn lọc | Không phải approval Gallery |
| Phase 6, 7, Final Creative Review | Content và nghiệm thu tổng thể | Chưa bắt đầu |

Các checkpoint source được test/build trên **bản xuất từ Git index**, không chỉ working tree đang chứa tất cả thay đổi. Snapshot tạm nằm ở `.angular/phase-checkpoints/` (ignored); không stash/reset/ghi đè source của bạn. `scripts/qa/verify-staged-checkpoint.mjs` có thể lặp lại bước này với `CHROME_BIN` trỏ đến Edge/Chromium đã cài.

| Commit source | Kiểm chứng trước commit |
|---|---|
| `adff4d0` — Phase 2 | PNG master khớp SHA-256 đã duyệt, thêm đúng ba WebP responsive |
| `2a75803` — Phase 3.1 | 19/19 tests + Pages build PASS |
| `b9aea9e` — Phase 4.1 | 66/66 tests + Pages build PASS |
| `605d828` — Phase 4.2 | 68/68 tests + Pages build PASS |
| `6251242` — Phase 5.1 | 76/76 tests + Pages build PASS |
| `44d8238` — Phase 5.2 | 92/92 tests + Pages build PASS |

Push `master` kích hoạt workflow Pages hiện có. Không đổi workflow, không thêm dependency và không tự xác nhận deploy thành công chỉ từ lệnh push.

## Bộ review chọn lọc được lưu trên Git

- Hero: [desktop](hero-2026-10-11-final/desktop-1440-hero.png), [iPhone](hero-2026-10-11-final/iphone-portrait-hero-full.png), [iPad](hero-2026-10-11-final/ipad-portrait-hero.png), [entrance](hero-2026-10-11-final/desktop-entrance.webm), [runtime report](hero-2026-10-11-final/hero.json).
- Scroll: [desktop hai chiều](scroll-2026-10-12-verified/desktop-1440-scroll-both-directions.webm), [iPad hai chiều](scroll-2026-10-12-verified/ipad-portrait-scroll-both-directions.webm), [iPhone touch](scroll-interactions-2026-10-12-lock-verified/iphone-native-touch.webm), [verification](PHASE4-VERIFICATION.json).
- Gallery: [review bản sửa mới](PHASE5-GALLERY-REVIEW.md), [video handoff khoảng 45 giây](gallery-handoff-continuous-2026-10-13-attempt2/sequence.webm), [hover trái](gallery-handoff-continuous-2026-10-13-attempt2/hover-left.png), [hover phải](gallery-handoff-continuous-2026-10-13-attempt2/hover-right.png), [Lightbox](gallery-handoff-continuous-2026-10-13-attempt2/lightbox.png).
- Responsive mới: [iPhone](gallery-handoff-visual-2026-10-13-final/iphone-idle.png), [iPad dọc](gallery-handoff-visual-2026-10-13-final/ipad-p-idle.png), [iPad ngang](gallery-handoff-visual-2026-10-13-final/ipad-l-idle.png).
- [Manifest hover 312 checks](PHASE5-HOVER-VERIFICATION.json) và [manifest Phase 5 trước 267 checks](PHASE5-VERIFICATION-FINAL.json) có SHA-256 của source. Không sửa dữ liệu bằng chứng để biến test thất bại thành đạt.

Các review dossiers giữ link đến ảnh/frame/thử nghiệm lịch sử **local-only** để không làm mất audit trail; không phải mọi link trong dossier đều được upload. Không đưa khoảng 3 GB raw frame và bản thử lên repository. File thử `public/Image/original/canva.png` vẫn ở máy, không thuộc asset được duyệt; 34 JPG gốc/34 thumbnails không đổi.

## Kết quả và giới hạn

- Bản source cuối: **92/92 unit/component tests**, production build và Pages build PASS. Pages base `/HappyGradSweetie/`; không thay dependency hoặc workflow.
- Bản hover mới: **312/312 checks**, ba desktop sequence ~45 giây, mỗi sequence có 12 adjacent handoffs cả hai chiều, bảy viewport visual và bốn profile interaction. Full-loop 34 ảnh tốc độ thật thuộc evidence Phase 5 trước; bản hover-only không quay lại toàn vòng đó.
- Chỉ **Edge/Chromium headless emulation**, không phải Safari/iPhone/iPad thật. Video capture mute output, không chứng minh nghe nhạc trên thiết bị. Unit/build không thay thế duyệt thị giác.
- **Gate Gallery còn mở**. Chỉ sang Content sau khi bạn duyệt hover/rail/nhịp chuyển động/touch; không suy approval từ yêu cầu push checkpoint.

## Chạy lại QA

Scripts trong `scripts/qa/` dùng Node, `ws`/Sharp đã có trong lockfile và browser cài sẵn; không có upload tự động. `HAPPYGRAD_QA_BROWSER` có thể trỏ đến executable Chromium khác. Collector chỉ mở preview localhost và yêu cầu thư mục output mới, không ghi đè evidence.

```powershell
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test
npm run build:github-pages
```

Các verifier evidence đọc những đường dẫn capture ghi trong script. Một số capture lịch sử chỉ nằm local; trên clone mới cần chạy collector tương ứng trước, không xem thiếu capture là lỗi ứng dụng. Handoff verifier tạo manifest với `flag: 'wx'` để bảo toàn kết quả cũ; chọn tên output mới khi muốn lưu lần kiểm chứng tiếp theo.
