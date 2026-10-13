# PLAN1 — Phase 1 baseline

Ngày: 11/10/2026. Source: `f2dfc34` + ba thay đổi nội dung local có sẵn trong `celebration-content.ts` (lưu diff trong report). Chưa sửa source ứng dụng.

## Evidence

- [Report máy đọc được, network, DOM, SHA-256 của 68 ảnh](baseline-2026-10-11/baseline.json).
- [Hero desktop 1440×900](baseline-2026-10-11/desktop-1440-home.png).
- [Gallery desktop 1440×900](baseline-2026-10-11/desktop-1440-memories.png).
- [Gallery iPhone portrait](baseline-2026-10-11/iphone-portrait-memories.png).
- [Hero iPad portrait](baseline-2026-10-11/ipad-portrait-home.png).
- Chuỗi ảnh gallery tại [0 giây](baseline-2026-10-11/desktop-1440-motion-0s.png), [5 giây](baseline-2026-10-11/desktop-1440-motion-5s.png), [15 giây](baseline-2026-10-11/desktop-1440-motion-15s.png), [30 giây](baseline-2026-10-11/desktop-1440-motion-30s.png).
- Script tái hiện: `node scripts/qa/capture-baseline.mjs http://127.0.0.1:4201/ qa/plan1/<thu-muc-moi>`; cần dev server chạy riêng. Không ghi đè evidence cũ.

## Phạm vi đã đo

Edge headless **155.0.4283.45**, Windows. Desktop 1366×768, 1440×900, 1920×1080; touch emulation 393×852, 852×393, 820×1180, 1180×820. 56 screenshot chapter/Intro/Lightbox và 4 screenshot motion. Media queries touch đã xác nhận coarse=true, hover=false trong các profile touch.

Đây là **Chromium emulation**, không phải Safari/iPhone/iPad thật. Chạy trên dev server, không dùng làm production performance benchmark. Chuỗi ảnh có timestamp **không phải video liên tục**; continuous recording và profiling vẫn Pending. Screenshot section có thể chứa trạng thái hover do vị trí pointer; không dùng ảnh đó để kết luận idle geometry. Metrics được ghi sau screenshot nên có thể ở thời điểm scroll đang thay đổi: đây cũng là lý do cần review coordinator riêng trong Phase 4.

## Kết quả kỹ thuật

- `npm test`: **16/16 PASS** bằng Edge. Lần đầu trong sandbox lỗi GPU browser launch; chạy lại ngoài sandbox thành công. Không phải lỗi test ứng dụng.
- `npm run build:github-pages`: **PASS**, 324,84 kB raw / 84,93 kB estimated transfer.
- 34 original + 34 thumbnail đã lưu hash; ảnh nguồn `1.jpg`: SHA-256 `ad5025acd8aebf4820e8aedfe2969093c1b77741732c1157e03b9c1e7f332cf9`.
- Không ghi nhận exception runtime, browser error hoặc HTTP ≥400 ở cả 7 profile trong hành trình đã chụp.
- 11 thumbnail đang render đều `complete` và có `naturalWidth > 0`; Lightbox mở và tải original ở cả 7 profile.
- Audio sau click mở quà có `paused=false`, `readyState=4`; browser chạy với mute-output để không gây tiếng trên máy. **Chưa xác minh nghe thực tế**; một snapshot iPhone volume=0 cần kiểm tra lại lifecycle fade trong QA, không kết luận âm thanh đạt chỉ từ trạng thái play.

## Những vấn đề quan sát được — chưa sửa trong baseline

| Mức độ | Bằng chứng | Phase xử lý |
|---|---|---|
| P1 | `.gallery__scene` có width=0 tại cả 7 profile. Ảnh vẫn xuất hiện do children absolute overflow, nhưng scene không cung cấp kích thước profile đúng | Phase 5: explicit inline-size + scene/viewport separation |
| P1 | Touch vẫn render 11 card thay vì profile phone/tablet; screenshot iPhone thấy ảnh hai bên bị cắt đáng kể | Phase 5: responsive rail và touch |
| P1 | DOM báo scrollWidth vượt viewport ở 1366/1440; cần phân biệt visual overflow của transforms và vùng scroll thực | Phase 5: bounds + overflow measurement |
| P1 | Gallery hover vẫn nghiêng theo stage, shadow/dim mạnh, mặt ảnh bên cạnh chồng nhiều | Phase 5: camera-space hover và neighbor presentation |
| P1 | Reading/scroll position có thể còn thay đổi sau lệnh jump; source có proximity + JS settle và fixed timeout cùng điều phối | Phase 4: sole coordinator và completion |
| Theo kế hoạch | Hero chưa có portrait; iPad portrait nhiều khoảng trống và thấy section kế tiếp trong cùng viewport | Phase 3/4 sau khi portrait được duyệt |

Không có asset/runtime P0 được phát hiện trong phạm vi đã đo; đây là baseline của giao diện cũ, **không phải nghiệm thu thiết kế đích**. Giữ các lỗi P1 trong phase có trách nhiệm, không tự sửa gallery trước gate Portrait/Hero/Scroll.

## Còn Pending

- Safari thật, toolbar/safe-area hardware, trackpad thật và orientation lifecycle.
- Video liên tục, profiling/LCP/CLS/long tasks, reduced motion, back/forward và toàn bộ ma trận interaction.
- Full-loop 34 ảnh, hover từng card, pointercancel/slow drag, audio nghe thực tế.
- User review các gate implementation; baseline không cho phép bỏ qua gate Portrait.
