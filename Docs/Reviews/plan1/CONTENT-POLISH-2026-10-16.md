# Content polish — 16/10/2026

## Yêu cầu và phạm vi

Sau bản content tại `8e5b696`, bạn yêu cầu lời nhắn mượt, dịu dàng và giống lời người yêu nói với nhau hơn. Sau khi đọc nhận xét và lá thư đề xuất, bạn yêu cầu “giúp tôi hoàn thành đi”. Lượt này triển khai phần biên tập đó, không mở lại thiết kế/motion của PLAN1.

- Source: [celebration-content.ts](../../../src/app/data/celebration-content.ts).
- Regression: [celebration-content.spec.ts](../../../src/app/data/celebration-content.spec.ts).
- Không sửa ảnh, nhạc, CSS, component interaction, dependencies hoặc workflow.
- Không tự commit/push bản copy mới này. Approval Chromium và các manifest cũ thuộc revision trước, không tự áp dụng cho bản chữ mới.

## Quyết định biên tập

Giữ cách gọi “vợ iu”, giọng nói có chút trêu yêu và những câu ngắn quen thuộc. Giảm lời khuyên, những câu tự giải thích tình cảm và các đoạn dẫn quá dài. Không thêm kỷ niệm, chuyến đi hoặc khó khăn cụ thể chưa được cung cấp.

| Phần | Thay đổi |
|---|---|
| Intro | “Vợ iu ơi, anh có quà nè ♡”; lời dẫn ngắn, không lặp cách gọi hai lần trong cùng tiêu đề |
| Hero | Giữ lời chúc tốt nghiệp; lead nói thẳng sự tự hào và niềm vui được khoe người yêu, CTA ngắn hơn |
| Invitation | Giữ tên/ngành/trường/ngày; note trở thành lời chúc nhỏ dành cho ngày tốt nghiệp |
| Message | Bỏ giả định về những ngày khó khăn và lời khuyên khi nghi ngờ bản thân; giữ niềm vui, công sức và một cái ôm |
| Gallery | Lời dẫn như đang cùng lựa ảnh; giữ tiêu đề 34 ảnh và chỉ dẫn tương tác |
| Letter | Từ năm đoạn xuống bốn: chúc mừng → niềm vui tốt nghiệp → muốn lắng nghe → món quà đã chăm chút. Bỏ “hai chữ Cử nhân Luật”, lời thanh minh và câu “tình cảm … là thật” |
| Closing | Rút gọn lời mong được ở bên; giữ “Anh thương vợ iu. Nhiều lắm. ♡” |
| Caption | Chỉ chỉnh ID 9, 16, 21, 30, 33; vẫn đủ caption cho 34 ảnh, giữ các câu trêu đã tự nhiên |

Thông tin Nguyễn Võ Mai Khuê, Cử nhân Luật, Đại học Tôn Đức Thắng, 17/10/2026 và chữ ký hai dòng “Thương vợ iu nhiều lắm, / Quân iu” không đổi. Cấu hình portrait, audio và mọi metadata ảnh ngoài năm caption được so sánh với HEAD và giữ nguyên.

## Kiểm chứng bản mới

- **105/105 unit/component tests PASS**, gồm mount/render đầy đủ các đoạn thư và chữ ký; chạy Edge headless bằng launcher QA có sẵn.
- **Production build PASS** và **GitHub Pages build PASS**; `/HappyGradSweetie/`, artifact `main-K32N3LBK.js`, initial 478,16 kB raw / 134,54 kB transfer dự kiến.
- Build sandbox ban đầu không tải được Google Fonts; test sandbox không khởi động được Edge. Đã chạy lại với quyền phù hợp, không thay cấu hình app để che lỗi.
- Chạy collector có sẵn trên production preview localhost, **Chromium emulation**, không phải thiết bị thật. Ba profile, 36 PNG mới; sáu chapter/profile. Không exception, console error, request lỗi, tràn ngang hoặc text clipping được ghi nhận; đủ bốn đoạn thư; vị trí đọc thư không dịch chuyển trong probe.
- Đã xem trực tiếp screenshot Letter desktop/iPhone, Closing iPhone, Intro desktop và Message iPad. Không thay CSS để tránh mở rộng phạm vi biên tập.
- Lần capture đầu bị timeout do browser không truy cập được server sandbox; giữ báo cáo lỗi riêng. Chạy lại trên server localhost có quyền phù hợp, không ghi đè evidence.

| Profile | Evidence mới |
|---|---|
| Desktop 1440×900 | [JSON](../../../qa/plan1/content-polish-2026-10-16-desktop-verified/content.json), [Letter](../../../qa/plan1/content-polish-2026-10-16-desktop-verified/desktop-letter-full.png), [Intro](../../../qa/plan1/content-polish-2026-10-16-desktop-verified/desktop-intro.png) |
| iPhone 393×852 | [JSON](../../../qa/plan1/content-polish-2026-10-16-iphone-verified/content.json), [Letter](../../../qa/plan1/content-polish-2026-10-16-iphone-verified/iphone-letter-full.png), [Closing](../../../qa/plan1/content-polish-2026-10-16-iphone-verified/iphone-closing-full.png) |
| iPad portrait 820×1180 | [JSON](../../../qa/plan1/content-polish-2026-10-16-ipad-p-verified/content.json), [Message](../../../qa/plan1/content-polish-2026-10-16-ipad-p-verified/ipad-p-message-full.png) |

Các thư mục capture mới đang local/ignored theo quy tắc QA hiện có. Không tuyên bố đã chạy lại full-loop Gallery, benchmark hiệu năng, toàn bộ orientation hoặc thiết bị thật cho lượt chỉ đổi copy này. Miễn kiểm thử thiết bị thật trước đó vẫn có hiệu lực. Tests xác minh nội dung/rendering và dữ liệu, không thể chứng minh mức độ chân thành; giọng văn cuối cùng vẫn do bạn cảm nhận.
