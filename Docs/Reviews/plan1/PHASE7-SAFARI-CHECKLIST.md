# Phase 7 — Checklist Safari / iPhone / iPad thật

> **16/10/2026 · Chưa chạy trên thiết bị thật — được miễn theo yêu cầu mới của bạn (Waived, không phải Passed).** Checklist giữ để tham khảo nếu sau này muốn kiểm tra, không còn là điều kiện chặn phát hành.
>
> Ban đầu bạn chọn giữ Safari Pending; sau đó yêu cầu bỏ qua phần kiểm chứng thiết bị thật và commit/push theo phase. [Hồ sơ phát hành](RELEASE-2026-10-16.md) ghi quyết định mới. Các ca/chỉ dẫn dưới đây được giữ như kế hoạch kiểm thử tùy chọn, không là bằng chứng đã thực hiện. Không mở LAN/tunnel hoặc thay đổi firewall trong lượt này.

## 1. Phải kiểm tra đúng phiên bản

- Bản Chromium được duyệt: local working tree trên `1251d20` **cộng thay đổi Docs + Phase 6 + Phase 7**, artifact `main-OUJE5TSM.js`, Pages base `/HappyGradSweetie/`.
- Website GitHub Pages checkpoint cũ không tự có thay đổi local. Không dùng kết quả của bản cũ để kết luận các lỗi Lightbox/contrast/audio mới đã được sửa trên Safari.
- Preview QA hiện chỉ bind `127.0.0.1`; `localhost` trên iPhone là chính iPhone, không phải máy Windows. Nếu chưa có URL truy cập được từ thiết bị cho **đúng bản này**, ghi **Blocked — chưa có đúng bản thử**, không tính là lỗi Safari.
- Khi bạn yêu cầu thử thiết bị, chọn cách phục vụ bản thử trong mạng riêng hoặc phát hành checkpoint đã được phép. Xác nhận URL/source trước; không mặc định mở port ra Internet, bật firewall rule, dùng tunnel hoặc deploy production.
- Ghi tên bundle/version thực tế. Nếu rebuild đổi hash, đối chiếu source trước khi gọi là cùng bản đã duyệt. Inspector có thể giúp xác nhận bundle; nếu không có, người phục vụ bản thử cần cung cấp thông tin này.

## 2. Chuẩn bị và bằng chứng

Thiết bị mục tiêu: **iPhone 16**, **iPad Gen 10**, mỗi máy cả portrait/landscape. Viewport tham chiếu 393×852, 820×1180 và 1180×820 chỉ phục vụ đối chiếu; thanh công cụ, zoom hoặc cài đặt chữ có thể làm viewport thật khác các số này.

Ghi trước khi chạy:

- Model máy, iOS/iPadOS, phiên bản Safari nếu xác định được; ngày/giờ.
- URL, commit + trạng thái working tree hoặc bundle đã xác nhận.
- Hướng màn hình; mức chữ/zoom mặc định hay đã tăng; Reduce Motion bật/tắt.
- Điều kiện mạng và nguồn audio (loa/tai nghe); chế độ tiết kiệm pin nếu bật.
- Video màn hình và ghi chú giây xảy ra lỗi. Video không thu được audio thì ghi nhận nghe nhạc bằng quan sát riêng, không coi video im lặng là autoplay thất bại.

Không cần quay thông báo riêng tư hoặc tải ảnh lên dịch vụ ngoài. Có thể gửi video/screenshot trực tiếp trong chat; Inspector Console/Network là bằng chứng bổ sung nếu có máy hỗ trợ, không bắt buộc để bắt đầu review thị giác.

## 3. Các ca bắt buộc

Mỗi ca đánh dấu riêng **Pass / Fail / Pending / Blocked**, kèm tên file và timecode. Không đánh dấu đạt nếu chưa thực hiện; một video chỉ chứng minh các tình huống xuất hiện trong đó.

| ID | Thao tác trên thiết bị | Kết quả cần quan sát |
|---|---|---|
| S01 | Mở phiên mới và chạm “Mở món quà của anh” | Intro không cắt chữ/CTA; nền không cuộn khi Intro mở; Hero xuất hiện sau mở quà; không trang trắng |
| S02 | Nghe audio sau chạm mở quà; cuộn qua các chương | Không có nút nhạc, không phát trùng/reset khi đổi chương. Ghi rõ có nghe hay không; browser từ chối phải không làm hỏng trang. Không bắt buộc tự có tiếng trước tương tác |
| S03 | Reload trong phiên đã xem Intro, rồi chạm CTA | Intro có thể được bỏ qua; autoplay bị chặn vẫn dùng trang bình thường, không popup/lỗi lặp. Ghi nhận tiếng sau tương tác, không suy từ Chromium |
| S04 | Cuộn chậm rồi nhanh xuống/up giữa Hero → Invitation → Message | Không portrait chồng chữ, khoảng trắng bất thường hoặc giật về section cũ. Touch dùng normal flow, không yêu cầu giữ portrait sticky như desktop |
| S05 | Dừng ở khoảng giữa hai section ngắn rồi cuộn ngược | Chỉ căn khi cặp section đủ điều kiện theo PLAN1; không tranh chấp momentum hoặc bật ngược. Nếu section cao do chữ/viewport thì native scrolling là đúng, không ép “mỗi vuốt một chương” |
| S06 | Đọc giữa và cuối Letter, dừng vài giây rồi cuộn tiếp | Đủ bốn đoạn + chữ ký; không bị kéo về đầu hoặc bỏ qua nội dung dài; pinch/zoom không bị chặn |
| S07 | Ở Gallery ít nhất 60 giây | Ảnh thật, chiều sâu gần–xa, không khung trống/flicker/clipping/giật lặp. Đoạn này chỉ kiểm tra motion ngắn, không tự chứng minh vòng đủ 34 ảnh |
| S08 | Kéo ngang chậm/nhanh, đổi hướng, sau đó vuốt dọc từ ảnh | Kéo ngang không mở ảnh nhầm; vuốt dọc cuộn trang; không kẹt pointer khi đổi hướng/bị gián đoạn |
| S09 | Chạm một ảnh chính khi không vừa kéo | Mở đúng ảnh trong Lightbox bằng một tap; không cần hover hoặc tap thứ hai. Buffer phía sâu không bắt buộc nhận tap |
| S10 | Trong Lightbox: ảnh dọc, ảnh ngang; swipe và nút trước/sau; đóng | Ảnh contain không mất mặt/mũ; close/nav nằm trong vùng nhấn; không cuộn nền; đóng trả về vị trí Gallery cũ, không reset ảnh đầu |
| S11 | Lightbox đi qua 34→1 và 1→34 bằng các nút | Counter/ảnh đúng, không blank; chỉ là kiểm tra Lightbox loop, không thay thế Gallery loop |
| S12 | Cuộn để thanh địa chỉ Safari hiện/ẩn; thử gần đầu/cuối section và modal | Không nhảy section, cắt nút dưới hoặc dư khoảng trắng lớn; nút đóng không bị Dynamic Island/safe area che |
| S13 | Xoay iPad tại Gallery đang chạy, rồi khi Lightbox mở; cả hai chiều | Gallery giữ ảnh/position hợp lý, bố cục đổi theo hướng, không quay về ảnh 1; ảnh/modal vẫn fit, không che nav hoặc chữ |
| S14 | Vào `#memories`, refresh; dùng CTA rồi Back/Forward | Đến đúng chương sau Intro nếu Intro hiện; history không có bước dư; không nhảy về Home ngoài ý muốn |
| S15 | Đến Closing → “Mở lại món quà” → mở quà, lặp 3 lần | Intro/scroll lock hoạt động, Hero phát lại một lượt; không nhạc chồng hoặc reset đang phát; không Gallery trắng |
| S16 | Chuyển tab/app một lúc rồi trở lại Gallery | Không nhảy nhiều ảnh do thời gian tích lũy; không có animation đôi hoặc bị kẹt pause |
| S17 | Bật Reduce Motion trong cài đặt thiết bị rồi quay lại/reload; vẫn swipe/tap/nav | Autoplay/inertia/reveal mạnh dừng hoặc giảm theo thiết kế; nội dung, điều hướng và Lightbox vẫn truy cập được |
| S18 | Tăng chữ/zoom, thử portrait và landscape thấp | Không mất lời chúc, không overflow ngang; nội dung dài được cuộn tự nhiên, controls không bị cắt |

**Bổ sung khi có điều kiện:** keyboard/trackpad thật trên thiết bị hỗ trợ (focus, Arrow/Enter/Escape, Ctrl/Command + zoom không bị chặn); quay Gallery autoplay đủ một vòng **~7 phút 33 giây desktop hoặc ~11 phút 20 giây touch**, không hover/focus/drag làm pause. Các thời lượng này tính từ cấu hình 0,075/0,05 ảnh mỗi giây, không phải kết quả đã đo trên Safari. Ghi riêng đoạn pause; không tuyên bố đủ 34 ảnh chỉ từ video 60 giây.

## 4. Mẫu gửi kết quả

Sao chép mẫu sau cho từng thiết bị:

```text
Thiết bị / hệ điều hành / Safari:
URL / source hoặc bundle:
Ngày giờ / mạng / pin / loa hoặc tai nghe:
Hướng / text size / zoom / Reduce Motion:
Video hoặc screenshot:

S01: Pending — evidence/timecode:
S02: Pending — có nghe nhạc không, loa/tai nghe:
S03–S18: ghi riêng từng ca đã thực hiện, không gộp những ca chưa chạy.
Lỗi: bước tái hiện → mong đợi → thực tế → timecode.
Ca chưa thực hiện và lý do:
```

Nếu phát hiện lỗi P0 như trắng trang, mất ảnh, không đóng được modal hoặc scroll trap: gửi ngay ca tái hiện và dừng nghiệm thu phần đó. Không cần cố hoàn tất mọi video trước khi báo.

## 5. Điều kiện đóng phần Pending

1. Evidence phải đúng source/bundle và đúng thiết bị/browser được nêu.
2. Các ca bắt buộc có kết quả rõ; lỗi nghiêm trọng đã sửa và quay lại đúng ca trên thiết bị thật.
3. Phần chưa kiểm tra vẫn Pending, không suy từ một thiết bị hoặc Chromium emulation sang thiết bị còn lại.
4. Sau sửa source, QA lại vùng bị ảnh hưởng và cập nhật [Final QA](PHASE7-FINAL-QA.md), [PROGRESS](../../PROGRESS.md); xin review lại phần thị giác thay đổi nếu có.
5. Bạn chấp thuận nghiệm thu phần thiết bị. Không tự đánh dấu toàn bộ PLAN1 hoàn tất chỉ vì đã có video hoặc build xanh.

**Trạng thái hiện tại:** chưa có evidence thiết bị thật; phần này được bạn miễn, không phải đã Passed. Không có lỗi Safari mới được xác nhận để sửa; giữ bản Chromium đã duyệt, không sửa dự phòng bằng phỏng đoán.
