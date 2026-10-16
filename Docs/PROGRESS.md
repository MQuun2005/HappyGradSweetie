# HappyGradSweetie — Tiến trình triển khai

> **Cập nhật: 16/10/2026 · Asia/Saigon.** Tài liệu theo dõi công việc thực tế của [PLAN1 — A Love Letter in Motion](PLAN1.md), không thay thế kế hoạch hoặc các điểm duyệt.
>
> **PLAN1 hoàn thiện trong phạm vi được chấp thuận ngày 16/10.** Sau khi duyệt Chromium, bạn yêu cầu **miễn kiểm chứng thiết bị thật và commit/push theo phase**. Safari là **Waived — chưa kiểm thử**, không phải Passed; không còn chặn hoàn thành. [Hồ sơ phát hành](Reviews/plan1/RELEASE-2026-10-16.md) ghi các checkpoint mới và giới hạn còn được công bố.

> **Bổ sung content ngày 16/10, sau `8e5b696`:** đã triển khai yêu cầu biên tập lời nhắn tự nhiên/tình cảm hơn; thư bốn đoạn, rút gọn các phần dẫn, giữ thông tin cá nhân và asset. **105 tests + production/Pages build PASS**, kiểm tra mới ba viewport Chromium và 36 screenshot. Xem [Content polish](Reviews/plan1/CONTENT-POLISH-2026-10-16.md). Bản copy mới đang local, chưa commit/push; không dùng approval/evidence cũ để tự xác nhận bản mới.

## 1. Tóm tắt nhanh

| Hạng mục | Trạng thái hiện tại |
|---|---|
| Portrait / asset Hero | Đã được bạn duyệt, đã tích hợp |
| Cinematic Hero | Đã được bạn duyệt |
| Scroll Storytelling | Đã được bạn duyệt |
| 3D Gallery | Đã được bạn duyệt sau bản sửa hover ảnh kề |
| Content integration | Bản Phase 6/7 đã được duyệt; biên tập bổ sung ngày 16/10 sau `8e5b696` đã triển khai và kiểm tra, xem báo cáo Content polish |
| E2E QA toàn hành trình | Chromium đã được duyệt; source cuối chạy lại 105 tests/Pages build, production build và integrity đạt ngày 16/10; thiết bị thật được miễn |
| Final Creative Review | **Approved cho bản Chromium**; thiết bị thật **Waived by user**, không coi là Passed |
| GitHub | Bảy commit theo phase đã push lên `master`, đến `1251d20` |
| GitHub Pages | Build và deploy checkpoint `1251d20` thành công |
| Checkpoint mới | 6.1 Content/layout, 7.1 audio, 7.2 visual fixes đã commit; 7.3 Docs/QA đang đóng hồ sơ phát hành |

**Việc cần làm tiếp trong lượt phát hành:** đẩy các checkpoint đã kiểm tra lên `master`, xác nhận remote và theo dõi workflow có sẵn; không force-push hoặc đổi workflow. [Checklist Safari](Reviews/plan1/PHASE7-SAFARI-CHECKLIST.md) không còn là điều kiện chặn, chỉ dùng nếu sau này bạn muốn kiểm tra.

## 2. Đã làm được gì theo từng phase?

### Phase 1 — Audit & baseline

**Đã thực hiện baseline**, dùng để so sánh trước/sau:

- Đọc source và local diff, kiểm tra tài nguyên, ghi hash ảnh.
- Chạy baseline 16/16 tests và build Pages thành công ở thời điểm đó.
- Thu 60 screenshot trên bảy viewport cùng dữ liệu DOM/network.
- Ghi nhận vấn đề scene Gallery width bằng 0, overflow và hover/crop để xử lý trong đúng phase.

Bằng chứng: [Baseline report](Reviews/plan1/BASELINE.md). Đây là số liệu lịch sử trước nâng cấp, không phải kết quả hiện tại của Gallery.

### Phase 2 — Portrait asset

**Đã duyệt ngày 11/10/2026:** “Duyệt bản này, dùng làm Hero”.

- Các bản thử tách nền chưa đạt không được dùng làm asset production.
- Chốt chính PNG bạn cung cấp: `public/Image/hero/mai-khue-cutout.png`, 1024×1536.
- Giữ nguyên master; tạo WebP responsive 1024/768/480 px, kiểm tra alpha và preview trên nhiều nền.
- Không sinh lại mặt, tóc, mũ hoặc phần cơ thể bị che; không chỉnh sửa 34 ảnh gốc.
- Giữ fallback ảnh nguồn khi chân dung không tải được. Việc duyệt PNG không phải chứng nhận nó có RGB trùng tuyệt đối với `1.jpg`.

Bằng chứng: [Portrait review](Reviews/plan1/portrait-user-2026-10-11-c4024b5c/REVIEW.md).

### Phase 3 — Cinematic Hero

**Đã duyệt ngày 11/10/2026:** “Duyệt Hero, tiếp tục Phase 4”.

- Hero nhiều lớp: desktop chữ trái/portrait phải; mobile và iPad có bố cục riêng.
- Portrait component dùng `picture`, ảnh có kích thước, responsive WebP và chuỗi fallback PNG → ảnh nguồn → trạng thái lỗi.
- Copy Hero theo brief đã chốt; nội dung cá nhân hóa khác được giữ nguyên.
- Entrance bắt đầu sau thao tác mở quà; có replay, reduced motion, pause/lifecycle cleanup.
- CTA dẫn đến Invitation; animation entrance và scroll có transform owner riêng.

Bằng chứng: [Hero review](Reviews/plan1/PHASE3-HERO-REVIEW.md). Lượt nghiệm thu kỹ thuật riêng Hero khi đó đạt 29/29 tests; các checkpoint Git phía dưới có số test tích lũy khác.

### Phase 4 — Scroll Storytelling

**Đã duyệt ngày 12/10/2026:** “Duyệt Scroll, tiếp tục Gallery”.

- Desktop đủ điều kiện dùng CSS sticky cho portrait; GSAP ScrollTrigger chỉ scrub, không pin/snap hoặc thêm pin-spacer.
- Một scroll coordinator sở hữu auto-alignment, active chapter, navigation/history và restoration; không có hai cơ chế root snap cùng tranh chấp.
- Section dài được đọc tự nhiên. Touch, viewport thấp, nội dung không vừa và reduced motion có fallback phù hợp.
- Kiểm tra cuộn hai chiều, CTA, hash/deep link, back/forward, replay và modal suspension.
- Lightbox giữ focus trap; capture/return focus bằng `preventScroll`, trả đúng vị trí rồi mới resume coordinator.
- 96/96 ca alignment đã kiểm tra, sai số lớn nhất 0,5 px trong Chromium emulation.

Bằng chứng: [Scroll review](Reviews/plan1/PHASE4-SCROLL-REVIEW.md), [verification](../qa/plan1/PHASE4-VERIFICATION.json).

### Phase 5 — Gallery polish

**Đã được bạn duyệt ngày 14/10/2026:** “Duyệt Gallery, tiếp tục Phase 6”. Bản sửa hover ảnh trái che ảnh kề đã được chấp thuận; các giới hạn Safari/device vẫn giữ nguyên.

**5.1 — Presentation / hình học hover**

- Tách transform hierarchy camera → rail → mặt ảnh; tính hover trong camera space và bù toàn bộ transform cha.
- Nội suy quaternion để xoay gần chính diện, scale đồng đều, không làm méo ảnh.
- Chiếu các góc để giới hạn viewport; có fallback khi không đủ không gian và vùng ảnh kề được giữ có thể trỏ tới.
- Bỏ cách dùng `z-index` để giả lập chiều sâu; giữ rail desktop đã chốt.

**5.2 — Renderer, interaction và sửa hover ảnh kề**

- Một RAF ngoài Angular điều khiển motion; semantic state và virtual DOM chỉ đổi khi cần, tối đa 11 card desktop.
- Hard-stop khi offscreen, tab hidden, Intro/Lightbox mở; reduced motion giữ điều hướng và Lightbox.
- Giữ autoplay 0,075 ảnh/giây desktop và 0,05 touch; loop logic đủ 34 ảnh.
- Sửa pointer capture, phân biệt kéo ngang/vuốt dọc, ngưỡng drag 8 px, chặn click sau drag, keyboard và focus.
- Profile riêng cho touch: iPhone 3, iPad dọc 5, iPad ngang 7 card chính; không dùng hover làm điều kiện bắt buộc.
- Sau yêu cầu chỉnh thêm: bỏ hit plane vô hình chặn ảnh kề, hover intent 80 ms dùng RAF hiện có, bỏ phản hồi pointerout chỉ do layout dịch chuyển. Ảnh quay lại đúng rail khi rời hover.
- Ảnh thumbnail không crop mặt/mũ; Lightbox tiếp tục mở đúng original và giữ gallery/scroll position sau đóng.

**5.3 — QA và checkpoint**

- Đã lưu scripts, báo cáo, hash manifest, screenshot và video chọn lọc.
- Bản sửa hover đạt 312/312 checks; ba chuỗi desktop khoảng 45 giây tại 1366×768, 1440×900, 1920×1080.
- Mỗi chuỗi có 15 đích hover và 12 lần chuyển trực tiếp giữa hai ảnh kề theo cả hai hướng, không dùng cách rời scene rồi quay lại.
- Đã kiểm tra thêm bảy viewport visual và bốn profile interaction/touch; bản source cuối đạt 92/92 tests, production và Pages build PASS.
- Full-loop 34 ảnh ở tốc độ thật được ghi trước bản sửa hover trong 453,276 giây. Bản hover-only giữ rail/loop và đã kiểm tra lại seam 34↔1; **không tuyên bố quay lại toàn vòng hơn 7,5 phút cho bản sửa này**.

Bằng chứng chính: [Gallery review](Reviews/plan1/PHASE5-GALLERY-REVIEW.md), [video hover mới](../qa/plan1/gallery-handoff-continuous-2026-10-13-attempt2/sequence.webm), [312-check manifest](../qa/plan1/PHASE5-HOVER-VERIFICATION.json).

### Phase 6 — Content integration

**Đã triển khai và được bạn duyệt ngày 14/10/2026:** “Duyệt Content, tiếp tục Phase 7”.

**6.1 — Copy và template**

- Áp dụng đúng mục X của [note4.txt](Notes/note4.txt); bảng 32 thay đổi text/caption so với `1251d20`, không tự biên tập khác brief.
- Intro, Invitation, Message, Gallery instruction, đủ bốn đoạn thư, chữ ký hai dòng và Closing highlight. Caption vẫn chỉ ở tám ID cũ.
- Giữ Hero copy đã duyệt, thông tin Nguyễn Võ Mai Khuê/Quân iu, ngày/ngành/trường, ảnh và audio path/config.

**6.2 — Typography và regression có bằng chứng**

- Intro cuộn nội bộ trên màn hình thấp, không mất dòng đầu do căn giữa/focus CTA; bỏ tim dư.
- Letter đọc tự nhiên, heading đủ khoảng cho dấu tiếng Việt, chữ ký đúng hai dòng; Closing CTA tối thiểu 44 px và highlight tĩnh.
- Sửa reveal thư dài tại text 200% không đạt ngưỡng giao 25%; đổi sang reveal khi vào viewport.
- Sửa body min-width và riêng cỡ chữ tên trang trí Hero để không nở viewport mobile khi phóng chữ. Không thay portrait/chữ chính/motion Hero.
- Sửa clamp fade audio do một RAF timestamp sớm gây volume âm trong QA; không đổi file/config hoặc thiết kế audio.
- Gallery chỉ đổi copy/hint; rail/hover/loop, Scroll coordinator và Lightbox giữ nguyên.

**6.3 — Kiểm chứng và hồ sơ review**

- **103/103 tests**, production và Pages build PASS; initial 476.23 kB raw / 133.86 kB estimated transfer.
- **508/508 kiểm chứng** source/copy/asset/DOM/runtime; 9 profile, 108 screenshot cuối. Không có lỗi runtime/network được ghi nhận trong lượt cuối.
- Đủ bảy viewport desktop/phone/iPad, thêm root font 200% và reduced motion; long Letter không bị tự kéo về đầu. Chromium emulation, không phải Safari/thiết bị thật.
- 34 originals + 34 thumbnails, PNG master và note4 nguyên hash. Giữ bằng chứng các lần thất bại để truy vết; không sửa JSON lịch sử.
- Không quay lại full-loop Gallery hoặc benchmark performance ở Phase 6. E2E cuối và cảm giác audio trên thiết bị còn Phase 7/Final Creative Review.

Bằng chứng: [Content Review và bảng trước/sau](Reviews/plan1/PHASE6-CONTENT-REVIEW.md), [manifest 508 checks](../qa/plan1/PHASE6-CONTENT-VERIFICATION.json), [capture/source hashes](../qa/plan1/content-2026-10-14-final/content.json). Các số 6.1–6.3 ở phần mô tả là nhóm công việc; source được gom vào commit `b5229b6`, evidence vào checkpoint 7.3. Giữ JSON lịch sử, không sửa hash cũ cho khớp Phase 7.

### Phase 7 — E2E visual QA và Final Creative Review

**Chromium QA/Final Creative Review đã được bạn duyệt, ghi nhận ngày 16/10.** Các phép đo production thực hiện ngày 15/10; không gọi đây là chứng nhận Safari hay toàn bộ WCAG.

- Sửa lỗi Lightbox cắt ảnh trên màn hình ngang thấp và cắt nút điều hướng khi text 200%; dùng media grid co giãn và footer responsive.
- Sửa audio retry bị phím modifier tiêu thụ, cùng trường hợp Promise play trả về sau destroy còn tạo fade RAF. Thêm hai regression tests; tổng 105/105 đạt.
- Theo phê duyệt ngày 15/10, chữ nhỏ/nút dùng navy sẵn có; giữ pastel và rose trang trí. Đo nút trắng/navy 12,77:1; các chữ được chỉnh đạt trên 4,5:1 trong bộ nền thử.
- Screenshot cho thấy ribbon thiệp chạm eyebrow trên tablet/phone; dành tối thiểu 4,75rem ở đầu card, không đổi nội dung/ribbon.
- Đã quan sát autoplay đủ 34 ảnh trong **452,898 giây**, tối đa 11 card, không tải originals trước modal; 60 giây probe riêng không ghi long task. Lần đo này trước đúng một thay đổi padding ribbon; source Gallery không đổi. Không giả định đã quay lại full-loop sau padding.
- Kiểm tra hành trình 9 profile, scroll hai chiều/fallback, reduced motion/tab hidden, 10 chu kỳ replay/modal/resize, audio/assets bị chặn và storage bị từ chối. Số checks, phiên bản artifact, before/after và các ca chạy lại nằm trong [báo cáo Phase 7](Reviews/plan1/PHASE7-FINAL-QA.md).
- Bản cuối đạt 342 journey / 232 scroll / 30 contrast checks; mở rộng soak 30 chu kỳ đạt 51 checks. Listener/DOM/RAF bounded, heap tăng ~14,4%; không tuyên bố heap plateau hoặc leak-free dài hạn. Bốn video QA đã encode từ frame thật.
- Điều tra heap bổ sung hoàn thành ngày 15/10: snapshot chu kỳ 10/30 cho thấy tăng chủ yếu code V8 và native Performance/DevTools; closure không tăng, detached DOM giữ cùng bốn ID. Chưa xác nhận leak ứng dụng, không chỉnh source phỏng đoán. [Memory diagnostic](Reviews/plan1/PHASE7-MEMORY-DIAGNOSTIC.md); [manifest v3 129 checks](../qa/plan1/PHASE7-VERIFICATION-v3.json) đạt. Giữ giới hạn dài hạn/Safari; việc chờ review ở hồ sơ ngày 15/10 đã được giải quyết cho Chromium bằng approval mới.
- Tại lượt review trước, Safari thật/toolbar/safe area/pinch/trackpad/audio thiết bị là **Pending**. Yêu cầu mới ngày 16/10 đã miễn nhóm này: **Waived, không phải Passed**, không còn gate chặn.

**Final Creative Review: Chromium Approved.** Bạn duyệt trải nghiệm đang được trình bày trong báo cáo; không suy rằng bạn đã nghe nhạc trên iOS hoặc kiểm tra thiết bị thật. Ngày 16/10 đối chiếu lại 536 hash source/artifact/evidence không lệch; chỉ cập nhật tài liệu và checklist bàn giao, không sửa app. Phần nghiệm thu Safari, phần cứng và giới hạn hiệu năng dài hạn vẫn được ghi riêng.

Kiểm chứng integrity ở lượt ghi nhận approval: [129/129 checks](../qa/plan1/PHASE7-VERIFICATION-2026-10-16.json), không chạy lại capture hoặc ghi đè manifest ngày 15/10. **Lượt phát hành sau waiver** đã test/build từng staged checkpoint, chạy lại production/Pages và tạo [release verification 129 checks](../qa/plan1/PHASE7-RELEASE-VERIFICATION.json); không thay source/visual đã duyệt.

## 3. Commit và phát hành đã có

Các số **3.1, 4.1, 4.2, 5.1–5.3 là checkpoint Git nhỏ**, không phải thêm phase vào PLAN1. Hero và Scroll có phần tích hợp chung để tránh commit trung gian thiếu portrait track/CTA/directive.

| Commit | Checkpoint | Kiểm chứng trước commit |
|---|---|---|
| `adff4d0` | Phase 2 — asset Portrait | PNG master và ba WebP đúng bản được duyệt |
| `2a75803` | Phase 3.1 — Hero data và portrait fallback | 19/19 tests + Pages build |
| `b9aea9e` | Phase 4.1 — scroll foundation | 66/66 tests + Pages build |
| `605d828` | Phase 4.2 — tích hợp Hero–Scroll | 68/68 tests + Pages build |
| `6251242` | Phase 5.1 — presentation math | 76/76 tests + Pages build |
| `44d8238` | Phase 5.2 — Gallery renderer/hover | 92/92 tests + Pages build |
| `1251d20` | Phase 5.3 — tài liệu và QA | Scripts syntax, manifest/source hashes, curated evidence |

Các snapshot source được xuất từ Git index để test/build riêng trước commit, không chỉ test working tree chứa mọi thay đổi cùng lúc.

- **Đã push:** `master` ở `1251d209ff84453026889bc1e59266d8522af8db` sau xác nhận “Push cả code, asset Hero và ảnh/video QA”.
- **Đã deploy:** [GitHub Actions run #8](https://github.com/MQuun2005/HappyGradSweetie/actions/runs/38484936742), cả build và deploy thành công; kiểm tra lại trạng thái khi ghi tài liệu này.
- **Website:** [HappyGradSweetie](https://mquun2005.github.io/HappyGradSweetie/).
- Khoảng 3 GB frame thô/bản thử và file Canva chưa duyệt vẫn ở local, không bị xóa hoặc đưa vào bộ evidence đã push.
- **Checkpoint mới ngày 16/10:** `b5229b6` (6.1 Content/layout), `50beaa5` (7.1 audio), `c5ec9f7` (7.2 contrast/Lightbox); checkpoint 7.3 đóng Docs/QA/waiver. Trạng thái push cuối được cập nhật riêng sau khi xác minh remote; kết quả deploy #8 ở trên chỉ thuộc revision cũ.

## 4. Những gì chưa được chứng minh

| Nội dung | Giới hạn / việc còn thiếu |
|---|---|
| Gallery creative quality | Đã được bạn duyệt ngày 14/10; không thay thế kiểm thử thiết bị thật và E2E cuối |
| Safari/iOS/iPadOS thật | Hiện có Edge/Chromium headless emulation; chưa phải thử trên thiết bị thật |
| Safe areas, Safari toolbar, pinch/zoom, trackpad thật | Cần evidence trên browser/thiết bị tương ứng, không suy từ viewport mô phỏng |
| Audio nghe thực tế | Video QA mute output; playback state không chứng minh âm thanh nghe được trên thiết bị |
| Hiệu năng dài hạn | Có số liệu loop/lifecycle theo kịch bản, chưa bảo đảm mọi thiết bị hoặc mọi loại memory leak |
| Content và nghiệm thu toàn trang | Content/Final Creative Review Chromium đã duyệt; phần thiết bị thật được miễn ngày 16/10, không phải đã kiểm chứng |

Tests/build xanh, workflow thành công và manifest kỹ thuật **không thay thế visual approval**. Các tài liệu review lịch sử giữ nguyên số liệu/ngày của lần đo; khi khác nhau, đọc đúng revision/phạm vi thay vì cộng các kết quả thành một lần QA mới.

## 5. Checklist tiếp tục

- [x] Portrait được duyệt, master được bảo toàn.
- [x] Hero và Scroll được duyệt.
- [x] Sửa hover ảnh kề, lưu evidence mới.
- [x] Push các checkpoint 2 → 5.3; workflow Pages thành công.
- [x] Gom tài liệu vào `Docs`, tạo file tiến trình riêng; giữ README giới thiệu ở gốc.
- [x] Bạn duyệt Gallery sau bản sửa hover ngày 14/10.
- [x] Triển khai Phase 6 Content, lưu bảng copy/screenshot và kiểm chứng.
- [x] Bạn duyệt Content để chuyển Phase 7 ngày 14/10.
- [x] Thực hiện Phase 7 E2E QA trong phạm vi Chromium, xử lý các lỗi đã xác nhận và lưu evidence.
- [x] Bạn duyệt Final Creative Review cho bản Chromium; ghi nhận ngày 16/10.
- [x] Ghi nhận miễn kiểm chứng Safari/iPhone/iPad thật theo yêu cầu mới ngày 16/10; không đánh dấu các ca chưa chạy là Passed.
- [x] Chốt phạm vi PLAN1 đã được duyệt và các giới hạn QA trong hồ sơ phát hành.
- [ ] Hoàn tất push các checkpoint mới được yêu cầu ngày 16/10; xác nhận remote trước khi đánh dấu xong.

## 6. Cách cập nhật file này từ nay

1. Sau mỗi phần việc, cập nhật ngày, phase/checkpoint, những gì đã làm và việc còn lại.
2. Tách rõ **đã code**, **đã test**, **đã được bạn duyệt**, **đã commit**, **đã push**, **đã deploy**.
3. Ghi commit và đường dẫn evidence; kết quả cũ phải có ngày/phạm vi, không ghi như vừa chạy lại.
4. Chỉ đổi gate sang Approved khi bạn duyệt rõ ràng. Nếu thay đổi sau approval, ghi phần phải review lại.
5. Giữ kế hoạch ở [PLAN1.md](PLAN1.md), yêu cầu gốc ở [Notes](Notes/) và báo cáo chi tiết ở [Reviews/plan1](Reviews/plan1/README.md). Không sửa JSON/capture lịch sử để khớp một kết luận mới.

Điểm bắt đầu cho lần làm việc tiếp theo: **đọc hồ sơ phát hành và checkpoint Git mới; chỉ sửa lỗi được tái hiện hoặc yêu cầu mới. Kiểm thử thiết bị thật là tùy chọn sau waiver, không tự mở lại gate đã được miễn**.
