# PLAN1 — Checkpoint và bằng chứng review

Ngày chốt checkpoint: **14/10/2026**. Yêu cầu: commit/push từng phần đã làm được, không đợi hoàn tất toàn bộ PLAN1.

> **Cập nhật 16/10:** bạn đã duyệt [Final Creative Review Chromium](PHASE7-FINAL-QA.md), sau đó **miễn kiểm thử thiết bị thật và yêu cầu commit/push theo phase**. Xem [hồ sơ phát hành mới](RELEASE-2026-10-16.md) và [tiến trình](../../PROGRESS.md). Các bảng checkpoint/local-only bên dưới là lịch sử các lượt trước; evidence chọn lọc mới được bổ sung trong Phase 7.3, raw captures vẫn local.

## Trạng thái và cách chia commit

| Checkpoint | Phạm vi | Trạng thái |
|---|---|---|
| Phase 2 | PNG portrait đã duyệt, WebP responsive, giữ bản thử ngoài Git | Đã duyệt asset |
| Phase 3.1 | Hero data contract, copy đã chốt, portrait component/fallback và tests | Nền tảng Hero |
| Phase 4.1 | Opening story directive, section alignment/controller, unit tests | Nền tảng Scroll |
| Phase 4.2 | Kết nối Hero/portrait track vào App, sticky/scrub, Lightbox scroll/focus restoration | Hero + Scroll đã được duyệt; tích hợp chung để không thiếu dependency |
| Phase 5.1 | Camera-space presentation, quaternion orientation, viewport/neighbor clearance, tests | Checkpoint kỹ thuật |
| Phase 5.2 | Gallery renderer, pointer/hover handoff, lifecycle, responsive rail và tests | Đã sửa hover; bạn duyệt Gallery ngày 14/10 |
| Phase 5.3 | Scripts QA, kế hoạch, review dossiers, bằng chứng chọn lọc | Đã push; approval Gallery được ghi riêng |
| Phase 6.1 — `b5229b6` | Copy mục X, typography/long content, regression fixes | 103 tests + Pages riêng staged tree; bạn duyệt Content ngày 14/10 |
| Phase 7.1 — `50beaa5` | Audio retry và async cleanup | 105 tests + Pages riêng staged tree |
| Phase 7.2 — `c5ec9f7` | Contrast và responsive Lightbox/Invitation | 105 tests + Pages riêng staged tree |
| Phase 7.3 | Docs, scripts và evidence E2E chọn lọc | 129 release checks; hardware waiver được ghi riêng |
| Final Creative Review | Nghiệm thu tổng thể theo browser | **Chromium Approved**, thiết bị thật **Waived by user** ngày 16/10 |

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

- Hero: [desktop](../../../qa/plan1/hero-2026-10-11-final/desktop-1440-hero.png), [iPhone](../../../qa/plan1/hero-2026-10-11-final/iphone-portrait-hero-full.png), [iPad](../../../qa/plan1/hero-2026-10-11-final/ipad-portrait-hero.png), [entrance](../../../qa/plan1/hero-2026-10-11-final/desktop-entrance.webm), [runtime report](../../../qa/plan1/hero-2026-10-11-final/hero.json).
- Scroll: [desktop hai chiều](../../../qa/plan1/scroll-2026-10-12-verified/desktop-1440-scroll-both-directions.webm), [iPad hai chiều](../../../qa/plan1/scroll-2026-10-12-verified/ipad-portrait-scroll-both-directions.webm), [iPhone touch](../../../qa/plan1/scroll-interactions-2026-10-12-lock-verified/iphone-native-touch.webm), [verification](../../../qa/plan1/PHASE4-VERIFICATION.json).
- Gallery: [review bản sửa mới](PHASE5-GALLERY-REVIEW.md), [video handoff khoảng 45 giây](../../../qa/plan1/gallery-handoff-continuous-2026-10-13-attempt2/sequence.webm), [hover trái](../../../qa/plan1/gallery-handoff-continuous-2026-10-13-attempt2/hover-left.png), [hover phải](../../../qa/plan1/gallery-handoff-continuous-2026-10-13-attempt2/hover-right.png), [Lightbox](../../../qa/plan1/gallery-handoff-continuous-2026-10-13-attempt2/lightbox.png).
- Responsive mới: [iPhone](../../../qa/plan1/gallery-handoff-visual-2026-10-13-final/iphone-idle.png), [iPad dọc](../../../qa/plan1/gallery-handoff-visual-2026-10-13-final/ipad-p-idle.png), [iPad ngang](../../../qa/plan1/gallery-handoff-visual-2026-10-13-final/ipad-l-idle.png).
- [Manifest hover 312 checks](../../../qa/plan1/PHASE5-HOVER-VERIFICATION.json) và [manifest Phase 5 trước 267 checks](../../../qa/plan1/PHASE5-VERIFICATION-FINAL.json) có SHA-256 của source. Không sửa dữ liệu bằng chứng để biến test thất bại thành đạt.

Các review dossiers giữ link đến ảnh/frame/thử nghiệm lịch sử **local-only** để không làm mất audit trail; không phải mọi link trong dossier đều được upload. Không đưa khoảng 3 GB raw frame và bản thử lên repository. File thử `public/Image/original/canva.png` vẫn ở máy, không thuộc asset được duyệt; 34 JPG gốc/34 thumbnails không đổi.

## Content Review — đã được duyệt, đưa vào checkpoint 6.1 / 7.3

- [Bảng 32 thay đổi copy, scope, screenshot trước/sau và điểm duyệt](PHASE6-CONTENT-REVIEW.md).
- [Letter iPhone](../../../qa/plan1/content-2026-10-14-final/iphone-letter-full.png), [Closing iPhone](../../../qa/plan1/content-2026-10-14-final/iphone-closing-full.png), [Letter iPad](../../../qa/plan1/content-2026-10-14-final/ipad-p-letter-full.png).
- [Manifest 508 checks](../../../qa/plan1/PHASE6-CONTENT-VERIFICATION.json), [capture/source hashes — 9 profile](../../../qa/plan1/content-2026-10-14-final/content.json).
- 103/103 tests, production + Pages build PASS; không thay rail/hover, asset, Hero copy hoặc audio config. Screenshot và JSON cuối được chọn vào checkpoint 7.3; raw frames và các bản thử vẫn local-only.

## Kết quả và giới hạn checkpoint Gallery đã push

- Bản source checkpoint Gallery `1251d20`: **92/92 unit/component tests**, production build và Pages build PASS. Pages base `/HappyGradSweetie/`; không thay dependency hoặc workflow. Kết quả Content mới là 103 tests, ghi riêng phía trên.
- Bản hover mới: **312/312 checks**, ba desktop sequence ~45 giây, mỗi sequence có 12 adjacent handoffs cả hai chiều, bảy viewport visual và bốn profile interaction. Full-loop 34 ảnh tốc độ thật thuộc evidence Phase 5 trước; bản hover-only không quay lại toàn vòng đó.
- Chỉ **Edge/Chromium headless emulation**, không phải Safari/iPhone/iPad thật. Video capture mute output, không chứng minh nghe nhạc trên thiết bị. Unit/build không thay thế duyệt thị giác.
- **Gallery/Content đã được bạn duyệt ngày 14/10; Final Creative Review Chromium đã duyệt ngày 16/10.** Sau đó bạn miễn kiểm chứng thiết bị thật; gate này đã được đóng bằng waiver, không phải bằng một kết quả test thành công.

## Chạy lại QA

Scripts trong `scripts/qa/` dùng Node, `ws`/Sharp đã có trong lockfile và browser cài sẵn; không có upload tự động. `HAPPYGRAD_QA_BROWSER` có thể trỏ đến executable Chromium khác. Collector chỉ mở preview localhost và yêu cầu thư mục output mới, không ghi đè evidence.

```powershell
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test
npm run build:github-pages
```

Các verifier evidence đọc những đường dẫn capture ghi trong script. Một số capture lịch sử chỉ nằm local; trên clone mới cần chạy collector tương ứng trước, không xem thiếu capture là lỗi ứng dụng. Handoff verifier tạo manifest với `flag: 'wx'` để bảo toàn kết quả cũ; chọn tên output mới khi muốn lưu lần kiểm chứng tiếp theo.
