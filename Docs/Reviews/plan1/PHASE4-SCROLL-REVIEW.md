# Phase 4 — Scroll Storytelling Review

> Cập nhật checkpoint 14/10: bạn đã duyệt Scroll bằng “Duyệt Scroll, tiếp tục Gallery”. Nội dung bên dưới là báo cáo lịch sử tại 12/10. Xem [README QA](README.md) về bộ evidence được track; raw frames/bản thử vẫn giữ local.

Ngày kiểm tra: **12/10/2026**. Phạm vi: chuyển cảnh Hero → Invitation và điều phối cuộn sáu chương theo `Docs/PLAN1.md`.

**Chờ bạn duyệt Scroll Review trước Phase 5 Gallery.** Đây không phải nghiệm thu toàn website. Hero và master portrait đã được bạn duyệt trước đó; không thay nội dung, ảnh nguồn, nhạc hoặc palette trong phase này.

## 1. Xem trước khi duyệt

Preview đang dùng: `http://127.0.0.1:4202/`. Nếu preview đã tắt, chạy từ thư mục HappyGradSweetie:

```powershell
npm start -- --host 127.0.0.1 --port 4202
```

| Evidence | Nội dung |
|---|---|
| [Desktop — video hai chiều](../../../qa/plan1/scroll-2026-10-12-verified/desktop-1440-scroll-both-directions.webm) | Chuyển cảnh bằng wheel mô phỏng, portrait sticky và quay lại Hero |
| [iPad portrait — video hai chiều](../../../qa/plan1/scroll-2026-10-12-verified/ipad-portrait-scroll-both-directions.webm) | Normal-flow/parallax nhẹ. Đoạn này đặt vị trí cuộn bằng script, **không phải bằng chứng vuốt ngón tay** |
| [iPhone — touch video](../../../qa/plan1/scroll-interactions-2026-10-12-lock-verified/iphone-native-touch.webm) | Phát chuỗi touchStart/Move/End thật qua Chromium CDP, không gọi hàm scroll của ứng dụng |
| [Desktop tại 50%](../../../qa/plan1/scroll-2026-10-12-verified/desktop-1440-story-50.png) / [75%](../../../qa/plan1/scroll-2026-10-12-verified/desktop-1440-story-75.png) | Portrait còn hiện, Invitation đi phía trước; cần bạn đánh giá mức overlap và nhịp fade |
| [iPhone portrait](../../../qa/plan1/scroll-2026-10-12-verified/iphone-portrait-home.png) / [landscape](../../../qa/plan1/scroll-2026-10-12-verified/iphone-landscape-home.png) | Nội dung cao được cuộn tự nhiên, không ép vừa một viewport |
| [iPad portrait](../../../qa/plan1/scroll-2026-10-12-verified/ipad-portrait-home.png) / [landscape](../../../qa/plan1/scroll-2026-10-12-verified/ipad-landscape-home.png) | Không dùng sticky desktop trên touch |
| [Lightbox iPhone](../../../qa/plan1/scroll-interactions-2026-10-12-lock-verified/iphone-lightbox.png) | Ảnh original, nút đóng/điều hướng trong vùng nhìn |
| [Reduced motion](../../../qa/plan1/scroll-2026-10-12-verified/reduced-motion.png) | Portrait static, giữ nội dung; không auto-settle |
| [Baseline trước Phase 3/4](BASELINE.md) / [Hero đã duyệt](PHASE3-HERO-REVIEW.md) | So sánh với bằng chứng đã thu trước, không dựng lại một bản cũ để giả làm baseline |

Video là các frame screenshot thực từ CDP, có manifest timestamp đi kèm, được mã hóa thành WebM; không âm thanh. Chúng phục vụ review bố cục/nhịp chuyển cảnh, **không phải phép đo FPS hay benchmark production**.

## 2. Thay đổi đã triển khai

- CSS sticky chỉ bật trên desktop đủ rộng/cao và nội dung vừa. Một portrait DOM nằm trên track chung Hero–Invitation; không reparent, không pin-spacer, không thêm spacer làm dài trang.
- GSAP ScrollTrigger chỉ đọc tiến trình để scrub; không pin và không snap. Entrance và scroll có hai wrapper sở hữu transform riêng.
- Touch, viewport thấp, nội dung dài, reduced motion và portrait fallback không dùng sticky. iPhone portrait hiện dùng static vì toàn bộ Hero cao hơn viewport; iPad dùng parallax nhẹ trong normal flow.
- `SectionScrollController` là nơi duy nhất điều phối navigation, restoration và alignment. Khi controller hoạt động, root CSS snap tắt; không intercept wheel/touchmove để cưỡng bức chuyển chương.
- Căn cặp chapter liền kề cùng ngắn: desktop xuống 35%, lên 65%; touch chọn gần nhất, hòa ở midpoint theo hướng (dung sai làm tròn 1px). Không bỏ qua chapter dài, không settle trong opening story, khi giữ pointer/phím, pinch hoặc Gallery drag.
- `scrollend` + kiểm tra vị trí ổn định; fallback quiet 180/240ms và bốn frame. Không kết luận navigation hoàn tất chỉ vì vài frame đứng yên nếu chưa tới target. Timeout an toàn không được coi là một ca đạt.
- Click đứng yên không kích hoạt alignment. Input mới hủy lệnh đang chạy; một đợt cuộn có tối đa một correction.
- Active chapter dùng narrative line 42% và hysteresis 64px; giữ target trong navigation, không chọn chỉ từ một callback observer.
- Hash/deep link/back/forward dùng cùng coordinator; passive scroll không thêm history entry. Replay thay entry về `#home`; giữ cơ chế audio hiện có.
- Intro/Lightbox khóa body và suspend coordinator. Khi đóng Lightbox, trả scroll trước, focus với `preventScroll`, rồi resume; bỏ CDK auto-capture/return trùng lặp nhưng **giữ CDK focus trap**.

### Sửa liên quan trực tiếp đến scroll ở Gallery

Baseline có `.gallery__scene` rộng 0; sau khi cấp `inline-size: 100%`, các buffer card 3D còn làm layout viewport touch nở ngang. Ví dụ iPad portrait có inner width 926 thay vì 820, khiến chiều cao vùng nhìn và đích Closing sai hơn 150px.

Phase 4 chỉ cấp width cho scene và chặn phần chiếu ngang ra ngoài ở **section Gallery** (`overflow-x: clip; overflow-y: visible`). Không sửa rail math, tốc độ, hover, dữ liệu hay controller Gallery. Đo lại layout viewport cho iPhone/iPad khớp màn hình; Closing sai số dưới 1px. Thiết kế touch, hover bounds và chất lượng 3D vẫn thuộc Phase 5, **chưa nghiệm thu**.

## 3. Kết quả kỹ thuật và runtime

Môi trường: **Microsoft Edge headless/Chromium trên Windows**, dev-server với viewport/touch emulation. Không phải Safari hoặc iPhone/iPad thật. HEAD nền `f2dfc34`; có các thay đổi local Phase 3/4 chưa commit. Report chứa tracked diff; kiểm tra tổng hợp có fingerprint cả source mới chưa tracked.

| Kiểm tra | Kết quả |
|---|---|
| Unit tests | **68/68 PASS** — gồm profile/story bounds, chính sách alignment, history, cancellation, held key, modal deferral, click không scroll và scrollend đến sớm |
| Production build | PASS; initial 465,13 kB raw, estimated transfer 131,16 kB |
| GitHub Pages build | PASS; `<base href="/HappyGradSweetie/">`; không deploy |
| Desktop | 1366×768, 1440×900, 1920×1080; sticky, một portrait, không pin-spacer |
| iPhone mô phỏng | 393×852 và 852×393; static/normal flow, nội dung vẫn truy cập bằng cuộn |
| iPad mô phỏng | 820×1180 và 1180×820; touch profile |
| Bảng alignment 25/50/75%, hai chiều | **96/96 ca đạt**, sai số lớn nhất **0,5px**. Desktop 1366 và iPhone landscape không có cặp chapter đủ ngắn nên không ép snap; đây là ngoại lệ đúng chính sách, không phải bỏ qua lỗi |
| Deep link + refresh `#memories` | Tới y=2700 tại desktop 1440×900; active Memories; Intro giữ pending target |
| Navigator/back/forward | Invitation y=900 → back Memories y=2700 → forward Invitation y=900; không tạo entry phụ khi back/forward |
| Reduced motion runtime | Profile static, không scroll transform, không correction sau wheel; giữ vị trí đọc |
| Lightbox scroll return | iPhone 2671→2671; iPad portrait 3540→3540; landscape 2465→2465; desktop 2375→2375 |
| Focus trap/return | 8 lần Tab mỗi profile đều trong Lightbox; Escape trả focus về photo-card mà không kéo trang |
| Gallery swipe và page scroll | Swipe ngang giữ y, không mở modal; swipe dọc đi tiếp được: iPhone 2671→3235, iPad portrait 3540→4720, landscape 2465→3285 |
| Đọc Letter dài | Ba vị trí 25/50/75% phần dư trên iPhone và desktop thấp được giữ trong sai số làm tròn dưới 1px |
| Replay | Bốn profile đều khóa Intro, sau mở quà về y=0 |
| Orientation mô phỏng | iPad portrait→landscape giữ đầu Letter trong sai số dưới 1px |
| Fallback không có `document.scrollend` | Căn Invitation–Message về y=1800; input mới chuyển từ alignment sang native-input |
| Asset integrity | Kiểm tra SHA-256 với baseline: 34 original + 34 thumbnail; không sửa PNG Hero master hoặc `Docs/Notes/note4.txt` |

Chi tiết máy đọc được:

- [Story/alignment/history/reduced motion](../../../qa/plan1/scroll-2026-10-12-verified/scroll.json).
- [Touch/modal/keyboard/replay/orientation/fallback](../../../qa/plan1/scroll-interactions-2026-10-12-lock-verified/scroll.json).
- [Chẩn đoán layout viewport sau sửa](../../../qa/plan1/scroll-viewport-2026-10-12-pass2/scroll.json).
- [Kết quả kiểm tra tổng hợp và SHA-256 của 59 source files](../../../qa/plan1/PHASE4-VERIFICATION.json): không có assertion thất bại; 68 ảnh giữ nguyên hash. Bao gồm cả source mới chưa tracked, không chỉ `git diff`.
- Script: `scripts/qa/capture-scroll.mjs`, `capture-scroll-interactions.mjs`, `diagnose-scroll-viewport.mjs`, `verify-scroll-evidence.mjs`. Chỉ mở localhost trong profile browser tạm riêng; không upload ảnh.

Các folder `pass*`, `final` hoặc `verified` cũ giữ nguyên lịch sử kiểm thử, không xóa bằng chứng lỗi. Lượt trước phát hiện focus restoration thừa làm lệch desktop 55px và một ca iPad alignment chưa tới đích; các phát hiện đó dẫn tới sửa source, không bị ghi thành Passed.

## 4. Chưa được xác minh / không thuộc nghiệm thu Phase 4

- Safari thật, thanh địa chỉ thu/phóng, safe areas phần cứng, pinch zoom thật và trackpad momentum thật: **Pending**.
- Hiệu năng production/long-task/memory qua 10 chu kỳ: **Pending Phase 7**. Build xanh và video dev-server không thay thế profiling.
- Gallery hover, full loop 34 ảnh, projected bounds, responsive touch riêng và hiệu năng RAF: **Pending Phase 5**.
- Audio không đổi trong Phase 4; recording bị mute. Không dùng các video này để khẳng định audio đã phát trên iOS.
- Native CSS snap chỉ là fallback nhẹ; không được coi là đạt auto-alignment khi controller không hoạt động.
- Invitation có nền hơi trong: portrait đi phía sau card ở giữa chuyển cảnh. Chữ vẫn đọc được trong screenshot, nhưng mức overlap/nhịp fade cần **bạn duyệt về thẩm mỹ**.

## 5. Checklist bạn review

1. Mở quà, cuộn Hero xuống Invitation rồi ngược lại. Portrait có giữ nhịp dịu, không che lời/CTA và không kéo dài trang vô ích không?
2. Ở 1440×900, thử dừng khoảng 1/4, 1/2 và 3/4 giữa Invitation–Message; thử cuộn ngược. Khi đang tự căn, cuộn hướng khác để kiểm tra có giành lại điều khiển được không.
3. Trên iPhone/iPad, vuốt dọc tự nhiên, đọc hết thư, vuốt ngang Gallery rồi vuốt dọc ra khỏi Gallery. Không kỳ vọng mọi cú vuốt nhỏ đều nhảy một chương: touch chọn anchor gần nhất, chapter dài giữ native scroll.
4. Mở/đóng ảnh, kiểm tra trang không trôi; nhấn Back/Forward, refresh `#memories`, “xem lại từ đầu”.
5. Nếu có thiết bị thật, gửi video 20–40 giây kèm model, browser, hướng màn hình, vị trí xảy ra lỗi. Đặc biệt quay toolbar Safari hiện/ẩn và xoay iPad khi đang đọc thư.

**Điểm dừng:** chờ bạn trả lời **“Duyệt Scroll, tiếp tục Phase 5 Gallery”**, hoặc nêu phần chuyển cảnh/căn trang cần chỉnh. Không tự chuyển phase, commit, push hoặc deploy.
