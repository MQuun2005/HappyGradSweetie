# Phase 6 — Content Review

> **Content Approved — 14/10/2026:** bạn trả lời “Duyệt Content, tiếp tục Phase 7”. Các dòng chờ duyệt dưới đây giữ làm hồ sơ tại thời điểm bàn giao; gate hiện tại chuyển sang Phase 7 / Final QA.

> **14/10/2026 · Đã triển khai, chờ bạn duyệt Content.** Quyền bắt đầu: “Duyệt Gallery, tiếp tục Phase 6”. Chưa bắt đầu Phase 7 hoặc Final Creative Review; chưa commit, push hay deploy thay đổi này.
>
> **Điểm duyệt:** lời chúc, nhịp đọc và typography — không phải yêu cầu duyệt lại hình học Gallery đã chốt.

## 1. Kết quả và phạm vi

Đã tích hợp copy ở **mục X của [note4.txt](../../Notes/note4.txt)** vào dữ liệu tập trung. Có **32 thay đổi text/caption** so với checkpoint `1251d20`, liệt kê nguyên văn bên dưới. Không tự biên tập câu khác brief; không thay “em” thành “vợ iu” hàng loạt.

- Intro, Invitation, Message, Gallery lead/instruction, bốn đoạn thư, chữ ký hai dòng và Closing dùng đúng bản đã chọn.
- Gallery thêm lời hướng dẫn xem ảnh, vẫn giữ lời nhắc kéo ngang và hướng dẫn keyboard.
- Closing có highlight tĩnh: **“Anh thương vợ iu. Nhiều lắm.”** Không thêm animation.
- Caption chỉ có ở tám ID cũ: **1, 5, 9, 14, 18, 23, 29, 34**. Caption 14 không đổi; 26 ảnh còn lại vẫn không có caption.
- Giữ **Nguyễn Võ Mai Khuê · Cử nhân Luật · Đại học Tôn Đức Thắng · 17/10/2026**, người gửi **Quân iu**. Chỉ cách viết ngày đổi từ dấu phẩy sang “năm”.
- Giữ copy Hero đã duyệt; giữ portrait/ảnh cá nhân, palette/font chính, Gallery rail/motion/hover/loop, Scroll coordinator, Lightbox và audio path/config.
- Không thêm dependency; không đổi Angular config hoặc workflow Pages.

Đọc toàn hành trình cho thấy copy chủ yếu dùng “vợ iu”, có “mình” và “tình yêu của anh” ở chỗ phù hợp; không nêu địa điểm, sự kiện hẹn hò hay kỷ niệm cụ thể chưa được cung cấp. Mật độ “vợ iu” trong thư khá cao vì giữ nguyên brief. Đây là điểm bạn nên nghe/đọc lại khi duyệt; **chưa tự giảm lặp hoặc đổi lời chúc**.

## 2. Bảng copy trước → sau → lý do

Mốc “trước” lấy từ Git `1251d20`; “sau” là source local được chụp QA. Số đoạn thư trong bảng là **1–4 để đọc**, không phải index TypeScript.

| Vị trí | Trước | Sau | Lý do |
|---|---|---|---|
| intro.eyebrow | Một món quà nhỏ | Một món quà nhỏ dành riêng cho vợ iu | Đúng copy đã chốt ở mục X. |
| intro.title | Anh có một món quà nhỏ dành cho vợ iu. | Anh có một điều muốn dành cho vợ iu… | Đúng copy đã chốt ở mục X. |
| intro.body | Dành cho vợ iu, để giữ lại thật dịu dàng dấu mốc đẹp này. | Không phải điều gì quá lớn lao đâu. Chỉ là anh muốn dành một góc thật xinh để cất lại niềm vui của vợ iu trong ngày đặc biệt này. | Đúng copy đã chốt ở mục X. |
| intro.actionLabel | Mở món quà của anh | Vợ iu mở quà nhé ♡ | Đúng copy đã chốt ở mục X. |
| invitation.eyebrow | Graduation celebration | Một ngày thật đặc biệt | Đúng copy đã chốt ở mục X. |
| invitation.title | Một ngày thật đặc biệt của cô gái anh thương | Ngày của vợ iu | Đúng copy đã chốt ở mục X. |
| invitation.dateLabel | 17 tháng 10, 2026 | 17 tháng 10 năm 2026 | Đúng copy đã chốt ở mục X. |
| invitation.note | Một dấu mốc thật đáng tự hào, được giữ lại bằng tất cả yêu thương. | Một ngày thật đẹp để đánh dấu những cố gắng của vợ iu. Và cũng là một ngày mà anh muốn cất giữ thật lâu trong tim. | Đúng copy đã chốt ở mục X. |
| message.eyebrow | Dành cho vợ iu của anh | Từ anh, gửi vợ iu | Đúng copy đã chốt ở mục X. |
| message.title | Cô gái anh luôn tự hào | Anh tự hào về vợ iu nhiều lắm | Đúng copy đã chốt ở mục X. |
| message.body | Từng ngày kiên trì đã góp lại thành thành quả thật đẹp hôm nay. Anh mong em sẽ luôn tự tin, vui vẻ và hạnh phúc trên mọi chặng đường phía trước. | Có những thành quả không chỉ được đo bằng một tấm bằng, mà còn bằng cả một hành trình cố gắng phía sau. Anh vui vì vợ iu đã đi đến một cột mốc thật đẹp. Mong vợ iu sẽ luôn tự tin, luôn mỉm cười và luôn nhớ rằng bản thân xứng đáng với rất nhiều điều tốt đẹp. | Đúng copy đã chốt ở mục X. |
| gallery.eyebrow | Kỷ niệm tốt nghiệp | Những khoảnh khắc thật xinh | Đúng copy đã chốt ở mục X. |
| gallery.title | Những khoảnh khắc anh muốn ngắm mãi | 34 khoảnh khắc anh muốn ngắm mãi | Đúng copy đã chốt ở mục X. |
| gallery.lead | Chạm vào từng tấm ảnh để cùng anh giữ lại những lát cắt rạng rỡ của em. | Mỗi bức ảnh là một chút rạng rỡ rất riêng của vợ iu. Anh muốn giữ lại tất cả ở đây, để bất cứ khi nào ghé xem, vợ iu cũng có thể mỉm cười vì những ngày tháng thật đẹp của mình. | Đúng copy đã chốt ở mục X. |
| gallery.instruction | Chưa có | Chạm vào một bức ảnh để ngắm vợ iu rõ hơn nhé. | Đúng copy đã chốt ở mục X. |
| letter.paragraphs[1] | Mai Khuê à, vậy là em đã đi đến một cột mốc thật đẹp rồi. Chúc mừng em tốt nghiệp — một thành quả mà anh biết là được góp nhặt từ rất nhiều sự kiên trì và cố gắng. | Vợ iu à, vậy là một cột mốc thật đẹp đã được đánh dấu rồi. Anh biết phía sau ngày hôm nay là cả một hành trình mà vợ iu đã dành rất nhiều sự kiên trì và cố gắng. Anh chỉ muốn ôm vợ iu một cái thật lâu và nói rằng: vợ iu của anh giỏi lắm. | Dùng nguyên văn mục X, không thêm kỷ niệm. |
| letter.paragraphs[2] | Anh tự hào về cô gái dịu dàng nhưng luôn bền bỉ này. Nhìn em chạm tới dấu mốc hôm nay, anh chỉ muốn nói rằng em đã thật sự rất giỏi. | Anh thích nhìn vợ iu vui, thích những lúc vợ iu cười và càng thích hơn khi thấy vợ iu tự hào về chính mình. Ngày tốt nghiệp này không chỉ là một lời chúc mừng, mà còn là dịp để anh nhắc vợ iu nhớ rằng những điều mình đã cố gắng đều thật đáng trân trọng. | Dùng nguyên văn mục X, không thêm kỷ niệm. |
| letter.paragraphs[3] | Anh mong những chặng đường phía trước sẽ luôn dịu dàng với em, để em được làm điều mình yêu, được tự tin theo đuổi điều mình chọn và nhận về thật nhiều niềm vui. | Anh không biết những chặng đường tiếp theo sẽ mang đến bao nhiêu điều mới mẻ, nhưng anh mong vợ iu sẽ luôn giữ được sự dịu dàng, niềm tin và những ước mơ của riêng mình. Có những ngày thật vui, cũng có thể sẽ có những ngày hơi mệt một chút. Dù thế nào, anh vẫn mong vợ iu luôn biết rằng mình không phải đối diện với mọi thứ một mình. | Dùng nguyên văn mục X, không thêm kỷ niệm. |
| letter.paragraphs[4] | Cứ rạng rỡ theo cách riêng của em nhé, vợ iu. Anh sẽ luôn ở đây, yêu thương và đồng hành cùng em. | Anh sẽ luôn muốn được ở bên, được lắng nghe những câu chuyện nhỏ mỗi ngày và cùng vợ iu giữ lại thêm thật nhiều kỷ niệm đẹp. Cảm ơn vợ iu vì đã là một người đặc biệt trong cuộc sống của anh. Chúc mừng tốt nghiệp nhé, tình yêu của anh. | Dùng nguyên văn mục X, không thêm kỷ niệm. |
| letter.signature | Quân iu | Thương vợ iu rất nhiều,<br>Quân iu | Đúng copy đã chốt ở mục X. |
| closing.title | Và đây mới chỉ là khởi đầu | Vợ iu ơi, hành trình đẹp nhất vẫn còn ở phía trước | Đúng copy đã chốt ở mục X. |
| closing.body | Chúc vợ iu luôn vững vàng, rạng rỡ và tìm thấy thật nhiều điều xứng đáng trên chặng đường mới. | Chúc vợ iu luôn được làm những điều mình yêu, gặp những người thật tốt và có thật nhiều ngày bình yên, hạnh phúc. Còn anh, anh mong mình sẽ được cùng vợ iu đi qua thêm thật nhiều cột mốc đáng nhớ nữa. | Đúng copy đã chốt ở mục X. |
| closing.finalHighlight | Chưa có | Anh thương vợ iu. Nhiều lắm. | Đúng copy đã chốt ở mục X. |
| closing.actionLabel | Xem lại những khoảnh khắc | Ngắm lại những khoảnh khắc của vợ iu | Đúng copy đã chốt ở mục X. |
| closing.replayLabel | Mở lại món quà | Mở lại món quà của anh | Đúng copy đã chốt ở mục X. |
| Caption ảnh 1 | Một chiếc ảnh xinh của vợ iu. | Chiếc ảnh xinh của vợ iu. | Mẫu chung trong brief; giữ ID, không suy diễn sự kiện. |
| Caption ảnh 5 | Cô gái mà anh luôn tự hào. | Cô gái mà anh luôn muốn ngắm mãi. | Mẫu chung trong brief; giữ ID, không suy diễn sự kiện. |
| Caption ảnh 9 | Rạng rỡ theo cách riêng của em. | Rạng rỡ theo cách của riêng vợ iu. | Mẫu chung trong brief; giữ ID, không suy diễn sự kiện. |
| Caption ảnh 18 | Nụ cười anh thương nhất. | Anh thích nụ cười này lắm. | Mẫu chung trong brief; giữ ID, không suy diễn sự kiện. |
| Caption ảnh 23 | Cứ luôn vui vẻ và hạnh phúc như thế này nhé. | Vợ iu cứ luôn tự tin như thế nhé. | Mẫu chung trong brief; giữ ID, không suy diễn sự kiện. |
| Caption ảnh 29 | Một điều dịu dàng anh muốn giữ mãi. | Một chút dịu dàng anh muốn giữ lại. | Mẫu chung trong brief; giữ ID, không suy diễn sự kiện. |
| Caption ảnh 34 | Chúc mừng dấu mốc thật đẹp của em. | Thêm một kỷ niệm thật đẹp của vợ iu. | Mẫu chung trong brief; giữ ID, không suy diễn sự kiện. |

Hero, tiêu đề/eyebrow Letter và những trường không có trong bảng không đổi. Các câu có sẵn trong brief không phải lời tự sáng tác mới của agent.

## 3. Typography và các lỗi thật phát hiện trong QA

| Vấn đề quan sát được | Sửa trong phạm vi cần thiết | Bằng chứng cuối |
|---|---|---|
| Intro dài bị mất dòng đầu trên viewport thấp; focus CTA tự kéo dialog xuống | Dialog native-scroll, flex với margin auto để không căn giữa tràn âm; focus với `preventScroll`, ornament không tạo scroll extent | Intro landscape có thể đọc từ đầu và cuộn tới CTA; không cuộn nền |
| Chữ ký bị gộp một dòng | `white-space: pre-line`, line-height thoáng | “Thương vợ iu rất nhiều,” và “Quân iu” đúng hai dòng |
| Thư khi phóng chữ quá cao không đạt IntersectionObserver threshold 25%, toàn bộ đoạn văn bị ẩn | Reveal khi sheet bắt đầu giao viewport (`threshold: 0`), disconnect sau reveal | Đủ bốn đoạn hiển thị cả ở text 200%; đọc giữa thư không bị kéo về đầu |
| Root font 200% làm `body min-width: 20rem` thành 640 px trên phone 393 px | Giới hạn min-width theo 100%; sheet minmax(0,1fr), wrap và padding mobile hợp lý | Layout viewport và scroll width không vượt chiều rộng yêu cầu |
| Tên trang trí Hero “Khuê” mở rộng layout tới 469 px ở text 200% | Chỉ giới hạn font lớp trang trí mobile theo vw; không đổi chữ chính, portrait hay motion | Header/Letter ở 393 px không bị scale-down vì layout viewport rộng hơn |
| Một frame fade audio nhận timestamp nhỏ hơn lúc lên lịch, gán volume âm và ném IndexSizeError | Clamp progress trong [0,1]; thêm regression test | Không lỗi runtime ở chín profile; giữ file, loop, volume 0.35, activation và thời lượng fade cũ |

Letter/Closing tăng line-height heading để dấu tiếng Việt không chen nhau. Letter trên phone có vùng đọc rộng hơn; Closing CTA giữ vùng nhấn tối thiểu 44 px. Bỏ icon tim dư trong Intro vì label mới đã chứa ♡.

**Ngoại lệ scope được giải thích:** sửa Hero CSS một thuộc tính trang trí, body min-width và audio clamp vì lỗi đã xuất hiện trong Content QA. Không dùng Phase 6 để thiết kế lại các section đã duyệt.

## 4. Screenshot trước / sau

Tất cả là **Edge/Chromium headless emulation**, không phải Safari hay thiết bị thật. Ảnh `*-full.png` chụp toàn section để đọc nội dung dài, **không có nghĩa section bị ép vừa một viewport**.

| Nội dung | Trước Phase 6 | Sau Phase 6 |
|---|---|---|
| Intro iPhone | [Trước](../../../qa/plan1/content-before-2026-10-14-ready/iphone-portrait-00-intro.png) | [Sau](../../../qa/plan1/content-2026-10-14-final/iphone-intro-top.png) |
| Invitation iPhone | [Trước](../../../qa/plan1/content-before-2026-10-14-ready/iphone-portrait-invitation.png) | [Sau — đầy đủ](../../../qa/plan1/content-2026-10-14-final/iphone-invitation-full.png) |
| Message desktop 1440 | [Trước](../../../qa/plan1/content-before-2026-10-14-ready/desktop-1440-message.png) | [Sau](../../../qa/plan1/content-2026-10-14-final/desktop-message-full.png) |
| Letter iPhone | [Trước](../../../qa/plan1/content-before-2026-10-14-ready/iphone-portrait-letter.png) | [Sau — toàn thư](../../../qa/plan1/content-2026-10-14-final/iphone-letter-full.png) |
| Closing iPhone | [Trước](../../../qa/plan1/content-before-2026-10-14-ready/iphone-portrait-closing.png) | [Sau](../../../qa/plan1/content-2026-10-14-final/iphone-closing-full.png) |
| Letter iPad portrait | [Trước](../../../qa/plan1/content-before-2026-10-14-ready/ipad-portrait-letter.png) | [Sau](../../../qa/plan1/content-2026-10-14-final/ipad-p-letter-full.png) |
| Closing iPad landscape | [Trước](../../../qa/plan1/content-before-2026-10-14-ready/ipad-landscape-closing.png) | [Sau](../../../qa/plan1/content-2026-10-14-final/ipad-l-closing-full.png) |

Các ca bổ sung:

- Intro phone ngang: [đầu dialog](../../../qa/plan1/content-2026-10-14-final/iphone-landscape-intro-top.png) → [cuộn tới nút](../../../qa/plan1/content-2026-10-14-final/iphone-landscape-intro.png). Với màn hình thấp, chủ động cho cuộn để đọc đầy đủ thay vì thu chữ quá nhỏ.
- Text 200%: [Letter viewport](../../../qa/plan1/content-2026-10-14-final/iphone-text200-letter.png), [toàn thư](../../../qa/plan1/content-2026-10-14-final/iphone-text200-letter-full.png), [Closing](../../../qa/plan1/content-2026-10-14-final/iphone-text200-closing-full.png).
- Reduced motion phone ngang: [Letter](../../../qa/plan1/content-2026-10-14-final/iphone-landscape-reduced-letter-full.png).
- Gallery mới chỉ đổi copy: [desktop](../../../qa/plan1/content-2026-10-14-final/desktop-memories.png), [iPhone](../../../qa/plan1/content-2026-10-14-final/iphone-memories.png). Video rail/hover đã duyệt ở [Phase 5](PHASE5-GALLERY-REVIEW.md); **không tuyên bố đã quay lại full-loop hoặc motion recording trong Phase 6**.

Đã xem trực tiếp các screenshot Intro, Letter/Closing iPhone, Message desktop, Letter iPad portrait, Closing iPad landscape và Letter text 200%. Các profile còn lại được chụp và kiểm chứng DOM/runtime; chất lượng cảm xúc vẫn cần bạn review.

## 5. Kết quả kiểm thử

| Kiểm tra | Kết quả / phạm vi |
|---|---|
| Jasmine/Karma | **103/103 PASS**, launcher EdgeHeadlessQA, process exit 0 |
| Production build | **PASS**, initial 476.23 kB raw / 133.86 kB estimated transfer |
| GitHub Pages build | **PASS**, base path `/HappyGradSweetie/`; không deploy |
| Content verifier | **508/508 PASS**, [manifest](../../../qa/plan1/PHASE6-CONTENT-VERIFICATION.json) |
| Browser final | **9 profile, 108 screenshot, 0 lỗi collector/runtime/network được ghi nhận**, [capture report + source hashes](../../../qa/plan1/content-2026-10-14-final/content.json) |
| Asset integrity | 34 originals + 34 thumbnails, PNG master và note4 giữ SHA-256; Hero data/music config/photo metadata ngoài caption không đổi |
| Nội dung | Toàn bộ copy mới có trong mục X; đủ 4 đoạn thư, chữ ký hai dòng, instruction/highlight trong DOM |
| Long content | Không inline clipping/horizontal overflow ở các profile; section dài cuộn tự nhiên, kiểm tra đứng giữa Letter không bị auto-settle |
| Audio | Một element duy nhất, thời gian phát không reset qua chapter trong ca phát thành công; không chứng minh âm thanh nghe được |

Chín profile: **1366×768, 1440×900, 1920×1080, 393×852, 852×393, 820×1180, 1180×820**, cộng **393×852 root font 200%** và **852×393 reduced motion**.

Tests mới kiểm tra data contract, thông tin tốt nghiệp, caption ID set, render Intro/Invitation/Message/Letter/Closing, event mở quà/replay, reveal thư rất cao và audio fade timestamp sớm.

### Tái kiểm tra

Từ root repository, với browser Edge đã cài:

```powershell
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test -- --karma-config scripts/qa/karma-edge.cjs --browsers EdgeHeadlessQA
npm run build
npm run build:github-pages
node scripts/qa/verify-content.mjs qa/plan1/content-2026-10-14-final/content.json
```

Launcher QA riêng chỉ bổ sung flag tránh Edge compat-layer tự relaunch làm Karma mất lifecycle; không đổi scripts mặc định, dependency hoặc Angular config. Lượt launcher mặc định có 103 tests xanh nhưng tiến trình treo, nên kết quả chính thức dùng lệnh trên có exit 0.

Muốn chụp lại: chạy dev server rồi dùng `node scripts/qa/capture-content.mjs http://127.0.0.1:4204/ qa/plan1/content-<ten-moi>`. Thư mục output phải mới; collector không ghi đè evidence. Đây là dev preview, không phải benchmark production.

## 6. Audit trail và giới hạn

- Baseline dùng [content-before-2026-10-14-ready](../../../qa/plan1/content-before-2026-10-14-ready/baseline.json), chụp trước sửa source. Các lần thử kết nối sandbox thất bại không được tính là baseline.
- Pass 1 gặp overlay HMR khi đang cập nhật nhiều file; không dùng làm nghiệm thu.
- Pass 2 ghi nhận lỗi Intro, thư ẩn/text zoom và audio volume âm; giữ nguyên để truy vết.
- Pass 3/4 không có profile hoàn chỉnh vì Edge relaunch/CDP endpoint; không quy thành lỗi ứng dụng.
- Pass 5 không còn runtime error nhưng verifier phát hiện viewport text 200% bị nở; diagnostic xác định lớp tên trang trí Hero là nguyên nhân. Chỉ **final** mới đạt 508/508.
- Lượt build Pages trong sandbox bị `ENOTFOUND fonts.googleapis.com` khi Angular inline font; chạy lại với quyền mạng đạt, artifact có base `/HappyGradSweetie/`, `404.html` và `.nojekyll`. Không đổi font hoặc tắt font optimization để che lỗi môi trường.
- Không sửa JSON lịch sử, không xóa bản thử; bộ capture mới vẫn **local-only, ignored**, chưa upload GitHub. Review Markdown và verifier mới cũng chưa commit.
- Chưa kiểm thử Safari/iOS/iPadOS thật, toolbar động/safe-area phần cứng, physical pinch zoom, trackpad và chất lượng âm thanh thực tế.
- Root font 200% là kiểm tra phóng chữ mô phỏng, không đồng nghĩa browser zoom hay Dynamic Type trên thiết bị.
- Phase 6 không thay thế Phase 7 E2E/performance/memory/keyboard toàn hành trình hoặc Final Creative Review. Test/build không thay thế phê duyệt của bạn.

## 7. Content Review — dừng chờ bạn

- [x] Áp dụng bộ copy mục X; có bảng trước/sau/lý do cho mọi thay đổi.
- [x] Giữ thông tin tốt nghiệp, Quân iu, ảnh cá nhân và Hero copy đã duyệt.
- [x] Đủ bốn đoạn thư, chữ ký hai dòng, Closing highlight.
- [x] Có screenshot desktop/iPhone/iPad, text lớn và reduced motion.
- [x] Test/build và kiểm chứng evidence không còn lỗi đã phát hiện.
- [x] Bạn duyệt Content/giọng văn và nhịp đọc ngày 14/10.
- [x] Typography/thư dài/Closing và Intro thuộc bản Content đã được duyệt.
- [x] Bạn cho phép chuyển sang Phase 7 — E2E Visual QA.
- [x] Final Creative Review Chromium đã duyệt ngày 16/10; phần thiết bị thật được miễn riêng, không coi là Passed.

**Gate đã đóng:** “Duyệt Content, tiếp tục Phase 7”. Trạng thái phát hành cuối nằm trong [hồ sơ ngày 16/10](RELEASE-2026-10-16.md); không yêu cầu bạn duyệt lại bản không thay đổi.
