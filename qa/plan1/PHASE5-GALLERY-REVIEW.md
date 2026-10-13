# Phase 5 — Gallery Review

## Cập nhật 14/10 — bản sửa hover để review lại

Bạn chưa duyệt Gallery và đã yêu cầu sửa ca ảnh trái che ảnh kề. Bản mới bỏ hit plane vô hình, giữ khoảng trống có thể trỏ tới trên ảnh kề bằng camera-space geometry, dùng hover intent 80 ms và chỉ phản hồi chuyển động pointer thật. Giữ nguyên rail idle, tốc độ và ảnh.

- [Video mới — hover trực tiếp qua ảnh kề theo hai hướng](gallery-handoff-continuous-2026-10-13-attempt2/sequence.webm).
- [Hover trái sau sửa](gallery-handoff-continuous-2026-10-13-attempt2/hover-left.png), [hover phải](gallery-handoff-continuous-2026-10-13-attempt2/hover-right.png), [idle](gallery-handoff-continuous-2026-10-13-attempt2/idle.png).
- [1366×768](gallery-handoff-small-2026-10-13-final/hover-left.png), [1920×1080](gallery-handoff-large-2026-10-13-final/hover-left.png), [iPhone](gallery-handoff-visual-2026-10-13-final/iphone-idle.png), [iPad dọc](gallery-handoff-visual-2026-10-13-final/ipad-p-idle.png), [iPad ngang](gallery-handoff-visual-2026-10-13-final/ipad-l-idle.png).
- **92/92 tests**, production + Pages build PASS; [312/312 evidence checks](PHASE5-HOVER-VERIFICATION.json). Mỗi desktop sequence khoảng 45 giây, 15 đích hover và 12 lần chuyển trực tiếp giữa hai ảnh kề; không dùng workaround rời scene rồi quay lại.
- Full-loop 34 ảnh tốc độ thật bên dưới là evidence trước bản sửa hover. Bản mới kiểm tra lại seam 34↔1, không tuyên bố quay lại toàn vòng ở tốc độ thật. Chỉ Chromium emulation, Safari thật vẫn Pending.

**Bạn đã yêu cầu commit/push các phần làm được. Đây là checkpoint kỹ thuật 5.1/5.2, không phải Gallery đã được phê duyệt. Chưa sang Phase 6 Content.** Phạm vi evidence được đưa lên Git ở [README QA](README.md); các link của báo cáo lịch sử dưới đây có thể chỉ tồn tại local.

---

## Báo cáo lịch sử 13/10 — trước bản sửa hover

Ngày: **13/10/2026**. Phạm vi: Gallery trong `PLAN1.md`, sau khi bạn duyệt Scroll. **Chưa sang Phase 6 Content; chưa commit, push hoặc deploy.**

Trạng thái: **đã triển khai, chờ bạn duyệt Gallery**. `PHASE5-VERIFICATION-FINAL.json` đạt **267/267 kiểm chứng**, không có failure. Chất lượng thị giác vẫn cần bạn duyệt; Safari/thiết bị thật chưa được xác minh.

## 1. Xem bản mới

- Preview local: [Gallery](http://127.0.0.1:4202/#memories). Nếu mở session mới, bấm mở món quà trước.
- [Desktop idle](gallery-2026-10-13-review/desktop-idle.png), [hover giữa](gallery-2026-10-13-review/desktop-hover-0.png), [hover trái](gallery-2026-10-13-review/desktop-hover--3.png), [hover phải](gallery-2026-10-13-review/desktop-hover-3.png).
- [iPhone 16](gallery-2026-10-13-review/iphone-idle.png), [iPhone ngang sau khi cuộn đến rail](gallery-visibility-2026-10-13/iphone-landscape-rail.png).
- [iPad dọc](gallery-2026-10-13-review/ipad-p-idle.png), [iPad ngang](gallery-2026-10-13-review/ipad-l-idle.png).
- [Desktop 1366×768](gallery-2026-10-13-review/desktop-small-idle.png), [desktop 1920×1080](gallery-2026-10-13-review/desktop-large-idle.png).

### Video thật, không phải mockup dựng lại

- **[Chuỗi tương tác production 45 giây](gallery-sequence-2026-10-13-final/sequence.webm)**: autoplay → hover 7 card, chuyển trái/giữa/phải → rời hover/resume → drag → keyboard 34↔1 → Lightbox → resume. [Log 22 mốc](gallery-sequence-2026-10-13-final/sequence.json), không lỗi runtime/network. Xem clip này trước để review tổng thể.
- [Autoplay production khoảng 46 giây](gallery-production-2026-10-13-review/production-45s.webm): 1.396 frame CDP thực của source cuối, giữ timestamp (46,015 giây frame nguồn), không audio.
- [Hover trái](gallery-2026-10-13-review/desktop-hover--3.webm), [giữa](gallery-2026-10-13-review/desktop-hover-0.webm), [phải](gallery-2026-10-13-review/desktop-hover-3.webm).
- [Swipe iPhone](gallery-interactions-2026-10-13-review/iphone-drag.webm), [iPad portrait](gallery-interactions-2026-10-13-review/ipad-p-drag.webm), [iPad landscape](gallery-interactions-2026-10-13-review/ipad-l-drag.webm).
- [Baseline before](gallery-before-2026-10-13/desktop-before-30s.webm). **Tên file ghi 30s nhưng manifest thực chỉ có 13,724 giây frame hữu dụng**; không coi đây là video before 30 giây đầy đủ.

Các clip hover ngắn dùng để kiểm tra xuất phát/chuyển pose; clip chuỗi tương tác ghi cả handoff và trở về rail. Video không kiểm chứng âm thanh.

**Điểm cần bạn quyết định bằng visual review:** khi ảnh trái `logical -3` đang nâng lên, nó có thể che toàn bộ ảnh kề `-2`. Trong clip chuỗi, khoảng giây 6, con trỏ rời rail rồi quay lại để chọn ảnh đó; log ghi rõ `occluded-neighbor--2`, không dispatch xuyên ảnh đang che. Những handoff còn lại trong ca đo thực hiện trực tiếp. Đây là giới hạn overlap hiện tại, chưa coi là đã đạt tuyệt đối tiêu chí chuyển hover giữa mọi cặp liền kề; bạn có thể yêu cầu giảm độ phóng/đổi cách nhường chỗ trước khi duyệt Gallery.

## 2. Những gì đã thay đổi

### Rendering và chiều sâu

- Giữ rail elip/camera desktop đã có, không làm lại Hero hay phong cách pastel.
- Chia lớp rõ: scene perspective → camera → rail → mặt ảnh. Một RAF là bên duy nhất ghi chuyển động; không còn CSS transform transition chạy cạnh tranh.
- `motionPosition` là số thực riêng; Angular chỉ cập nhật ở ranh giới virtual window/ảnh active. Không ghi Signal và `detectChanges()` mỗi frame.
- Tối đa 11 card DOM; ảnh gốc chỉ qua Lightbox. Mỗi card dùng một `<img>` thumbnail thật, `contain` để không cắt mặt/mũ. Ảnh ngang có khoảng ivory bên trên/dưới là letterbox có chủ đích, không phải ảnh tải lỗi.
- Không dùng z-index giả chiều sâu. Màu dim chỉ áp dụng lên mặt ảnh, không làm phẳng stage 3D.

### Hover đúng không gian camera

- Tính pose gần chính diện trong camera space; chuyển về local bằng nghịch đảo **toàn bộ** camera + rail.
- Nội suy quaternion/translation/uniform scale, không lerp từng phần tử ma trận gây méo ảnh.
- Giảm tốc khoảng 210ms; chuyển pose khoảng 380ms, lift tối đa 160px, scale tối đa 1,12; giảm lift/scale khi viewport không đủ.
- Fit bốn góc ảnh vào phần giao scene/visual viewport, chừa ít nhất 16px. Nếu quá thấp thì giữ highlight/click, không tự cuộn trang.
- Neighbor nhường 24/12px có clamp và lùi nhẹ; trả lại quỹ đạo cũ khi hover kết thúc.
- Vùng bắt chuột gốc và ảnh nâng lên tách riêng. **Lỗi phát hiện bằng browser:** camera stage vô hình chặn con trỏ ở ảnh có Z âm. Đã bỏ hit-testing của camera plane; ảnh sâu bên phải hover/click được.

### Drag, touch và lifecycle

- Chỉ capture trên scene sau khi kéo ngang vượt 8px; chuyển động dọc vẫn do trình duyệt xử lý.
- **Lỗi phát hiện bằng swipe thật qua CDP:** touch bắt đầu với implicit capture ở button; chuyển capture sang scene phát `lostpointercapture` từ button. Trước sửa, gesture bị hủy sau một sample. Nay chỉ xử lý mất capture thật, không hủy khi scene đang giữ capture.
- Kéo chậm/giữ trước khi thả vẫn chặn click nhầm; mẫu velocity cũ hết hạn, inertia giới hạn trong cùng RAF.
- Focus phát sinh do mouse drag không khóa autoplay vô hạn. Focus keyboard có trước gesture vẫn được giữ.
- Phone: 3 card chính; iPad dọc: 5; iPad ngang: 7. Touch có hướng mặt ảnh riêng để ảnh chính dễ đọc, không cần hover/tap hai lần; chạm card front mở original.
- Hard-stop khi offscreen, tab hidden, Intro/Lightbox mở; reduced motion không autoplay/inertia. Timestamp được reset lúc resume, không cộng dồn thời gian ẩn tab.
- Arrow trái/phải đổi ảnh; Enter/Space trên button chỉ mở một lần. Không thêm lại hàng nút điều khiển đã bỏ theo yêu cầu trước.

## 3. Bằng chứng và giới hạn

| Hạng mục | Evidence | Kết quả |
|---|---|---|
| 7 viewport; idle + hover trái/giữa/phải ở 3 desktop | [Visual report](gallery-2026-10-13-review/scroll.json) | Không collector/runtime/network error; main card tải ảnh thật, DOM bounded |
| Mouse drag, touch swipe, tap, Lightbox, orientation, reduced motion, offscreen | [Interaction report](gallery-interactions-2026-10-13-review/scroll.json) | Swipe không mở modal nhầm/không cuộn ngang trang; modal khôi phục đúng position/scroll/focus |
| Vuốt dọc iPad | [Diagnostic](gallery-vertical-2026-10-13/scroll.json), interaction report cuối | Vuốt ngắn có native scroll rồi căn về chapter gần nhất; vuốt qua midpoint chuyển tiếp. Không sửa coordinator Scroll đã duyệt |
| 10 chu kỳ modal/keyboard | [Lifecycle report cuối](gallery-lifecycle-2026-10-13-final/scroll.json) | Sau warm-up: 494 DOM nodes, 128 JS listeners; window/document/scene 10/17/10 ổn định; focus trap và restoration đúng, console/network không lỗi |
| Đổi tab production | [Visibility report](gallery-visibility-2026-10-13/scroll.json) | Tab hidden giữ nguyên transform; trở lại visible tiếp tục chuyển động, không reset ảnh |
| Chuỗi tương tác 45 giây production | [Video/log](gallery-sequence-2026-10-13-final/sequence.json) | 7 card được hover; 34→1→34→1 đúng; drag không mở modal; đóng modal trở lại scrollY=2700; autoplay tiếp tục. Ghi rõ một ca neighbor bị che, cần rời/vào lại |
| Autoplay đủ 34 ảnh, qua logical boundary 34 | [Full-loop production cuối](gallery-production-2026-10-13-review/scroll.json) | **453,276 giây ở tốc độ thật**; đủ 34 ID, virtual window vượt mốc 34, không chỉ counter làm tròn về 1 |
| Kiểm chứng ma trận hover, bounds, dữ liệu, assets và scope | [Verification cuối](PHASE5-VERIFICATION-FINAL.json) | **267/267 đạt**; 9 pose hover có net yaw/pitch gần 0°, đều fit safe rect; ảnh/nguồn ngoài Gallery nguyên vẹn |

**Không đánh đồng các phép đo:** 10 chu kỳ có bộ đếm ổn định là bằng chứng không tích lũy DOM/listener trong ca đo, không phải bảo đảm tuyệt đối mọi loại memory leak. FPS/frame interval trong Edge headless có overhead capture, không đại diện Safari hoặc thiết bị thật.

Mẫu production ~45 giây: 5.612 frame intervals, p50 8,3ms / p95 8,4ms, 0 interval >50ms, 0 long task, 6 child-list mutations. Đây là phép đo trong môi trường headless, không phải benchmark thiết bị người dùng.

Thử forced `Page.setWebLifecycleState(frozen/active)` trên dev server gây lỗi đóng WebSocket HMR và document reload, nên **không dùng ca đó để kết luận console sạch hoặc resume**. Bản verifier đầu ghi đúng failure; giữ nguyên để truy vết. Lifecycle đã chạy lại không forced-freeze, dùng đổi tab bình thường, không lỗi. Bằng chứng production visibility độc lập không có HMR.

Một buffer lazy mới chèn có thể chưa decode trong sample tức thời; main card trong screenshot được kiểm tra riêng. Không tuyên bố tất cả buffer đã tải từ lúc mở trang.

## 4. Kiểm thử kỹ thuật và bảo toàn project

- `npm test`: **88/88 SUCCESS**, Edge headless.
- `npm run build`: **PASS**, initial 471,69 kB raw / khoảng 133,04 kB transfer estimate.
- `npm run build:github-pages`: **PASS**, chuẩn bị artifact local; đã đọc `<base href="/HappyGradSweetie/">`, `.nojekyll` và `404.html`. Không deploy.
- Không thêm dependency, không đổi branch/remote/workflow.
- So với source hashes tại Phase 4, chỉ sáu file gallery/layout hiện có thay đổi; thêm utility presentation và test của nó.
- 34 originals + 34 thumbnails, PNG master đã duyệt và `note4.txt` đối chiếu SHA-256 trong verifier. Hero/Scroll/Letter/Closing/audio/content giữ nguyên source so với Phase 4.
- Scripts và raw frames trong `scripts/qa` / `qa` là evidence local, không public assets. Không tự đưa các frame lớn lên GitHub.

## 5. Điểm bạn cần review

1. Desktop: cảm giác near/mid/far của rail và tốc độ lãng mạn.
2. Hover: ảnh có rời rail rõ, gần chính diện, vừa màn hình; neighbor nhường đủ nhẹ hay cần giảm. Đặc biệt xem ca ảnh trái che ảnh kề ở giây ~6 trong clip 45 giây.
3. iPhone/iPad: mặt ảnh chính dễ xem, swipe/tap và cuộn dọc thoải mái.
4. Thumbnail ngang giữ đầy đủ nội dung trong khung portrait (`contain`), không crop thêm để lấp khung.

**Chưa được xác minh:** Safari/iPhone/iPad thật, Dynamic Island/safe-area vật lý, toolbar Safari, trackpad thật, pinch/browser zoom và thermal/performance lâu dài trên thiết bị. Emulation không được gắn nhãn thiết bị thật.

Nếu thử trên thiết bị, gửi video khoảng 30–60 giây: vào Gallery → vuốt ngang → vuốt dọc ra/vào → mở/đóng ảnh → xoay iPad. Kèm browser/OS và orientation; nếu lỗi có thể gửi Console/Safari Web Inspector. Không cần gửi tài khoản hay dữ liệu cá nhân ngoài scope.

**Gate:** chờ bạn duyệt Gallery trước khi làm Phase 6 Content. Sự thành công của test/build không thay thế phê duyệt thị giác.
