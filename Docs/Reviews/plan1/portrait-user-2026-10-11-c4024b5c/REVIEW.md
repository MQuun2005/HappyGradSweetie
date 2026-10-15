# Portrait — bản PNG người dùng cung cấp

Ngày 11/10/2026 · **Portrait được người dùng duyệt: “Duyệt bản này, dùng làm Hero”.**

## File đã nhận và bảo toàn

- Master do bạn cung cấp: `public/Image/hero/mai-khue-cutout.png`.
- Kích thước thực: **1024×1536**, PNG RGBA, **2.072.267 bytes**.
- SHA-256: `c4024b5c9fbc8b797793e1914027dcd212e3c77cd7681b9845a2b3f319250011`.
- File được giữ nguyên byte; không ghi đè alpha/RGB, không sinh ảnh lại, không upload ra dịch vụ.
- 68 ảnh original/thumbnail trong baseline giữ nguyên hash; `Docs/Notes/note4.txt` và các chỉnh sửa content local của bạn không thay đổi.

Không còn coi thiếu PNG là blocker. Không yêu cầu upscale lên 1706×2560: độ phân giải thực của master mới là giới hạn xuất variants. Cần chọn kích thước hiển thị theo mật độ pixel khi làm Hero.

## Visual review

Đã trực tiếp xem file, PNG/WebP ghép trên bốn nền, framing phone và chi tiết tua/tóc/tay 200%.

- [PNG bốn nền](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/four-backgrounds.png) và [WebP bốn nền](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/webp-four-backgrounds.png): ivory → blush → lavender → navy từ trái sang phải.
- [Nguồn `1.jpg` bên trái, bản mới bên phải](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/source-and-supplied.png). Đây là so bố cục tại cùng khung hiển thị, **không phải ảnh đã đăng ký hình học hoặc phép so RGB pixel-to-pixel**.
- [Tua và biên tóc 200%](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/tassel-edge-200-percent.png), [tay và biên dưới 200%](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/hand-lower-edge-200-percent.png).
- [Framing desktop](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/framing-desktop.png), [phone](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/framing-iphone.png), [iPad portrait](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/framing-ipad-portrait.png), [iPad landscape](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/framing-ipad-landscape.png).

Kết quả quan sát: mặt bàn đã bỏ; mũ, tua vàng, tóc và hai tay hiện diện; alpha thật, không nền caro giả. Trên các preview ghép nền không thấy dải nền bàn hoặc halo lớn như các candidate trước. Phần áo kết thúc bằng đường biên cắt đã có trong file; không thêm thân phía sau bàn và không dùng fade để che lỗi.

Bản mới có framing/tỷ lệ chủ thể và chi tiết khác so với `1.jpg`; chưa chứng minh đây là phép tách nền bảo toàn RGB nguồn. Không suy đoán công cụ đã tạo file. Không tự ghép mask lên `1.jpg` vì chưa có alignment đúng, và không co kéo chủ thể để cố làm khớp. **Bạn đã chốt dùng chính bản mới làm master** sau khi được thông báo khác biệt; không tự đánh dấu yêu cầu source-pixel đã Passed.

Các framing ở thư mục này là ảnh compositing bằng Sharp phục vụ duyệt asset, không phải screenshot website/browser hoặc kiểm thử Safari/iPhone/iPad thật. Evidence Hero sau phê duyệt nằm riêng trong [Phase 3 Hero Review](../PHASE3-HERO-REVIEW.md).

## Các WebP đã được duyệt để đưa vào Hero

Ban đầu xuất trong thư mục QA này để review. Sau khi bạn duyệt master, cả ba WebP đã được copy sang `public/Image/hero/` với hash không đổi và nối vào Phase 3 Hero; PNG master được giữ nguyên.

| File | Kích thước | Dung lượng |
|---|---|---:|
| [mai-khue-cutout.webp](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/mai-khue-cutout.webp) | 1024×1536 | 215.196 bytes (~215 KB) |
| [mai-khue-cutout-768.webp](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/mai-khue-cutout-768.webp) | 768×1152 | 146.222 bytes (~146 KB) |
| [mai-khue-cutout-480.webp](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/mai-khue-cutout-480.webp) | 480×720 | 69.472 bytes (~69 KB) |

Sharp quality 92, alphaQuality 100; không upscale. So decode alpha PNG và WebP full-size: **0 pixel alpha khác nhau**. WebP dùng nén RGB có mất mát nên không tuyên bố RGB WebP bit-identical. PNG master có max alpha 254 (không có pixel 255); giữ nguyên đặc tính này, không tự “sửa” file của bạn.

## Gate và bước tiếp theo

- Kỹ thuật asset: có PNG thật, preview và variants sẵn để duyệt.
- Source-pixel fidelity với `1.jpg`: chưa xác minh; không tự đánh dấu Passed.
- User Portrait approval: **Approved**, câu trả lời “Duyệt bản này, dùng làm Hero”, sau khi đã thông báo khác biệt bố cục/chi tiết so với `1.jpg`.
- Chốt đúng master/hash ở trên, không coi đây là chứng nhận RGB đồng nhất với nguồn. Bảo toàn PNG; đưa các WebP đã kiểm tra vào hero assets để thực hiện Phase 3.
- Vẫn dừng tại Hero Review trước Scroll Storytelling; approval asset không đồng nghĩa approval bố cục/animation website.

[Inspection](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/inspection.json) · [Encoding checks](../../../../qa/plan1/portrait-user-2026-10-11-c4024b5c/webp-review.json) · Script: `node scripts/qa/inspect-user-portrait.mjs`.

Không commit, push hoặc deploy. Không chạy build lại chỉ để chứng minh chất lượng cutout; kiểm thử visual asset không thể thay bằng build.
