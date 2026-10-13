# Phase 3 — Cinematic Hero · Chờ bạn duyệt

> Cập nhật checkpoint 14/10: bạn đã duyệt Hero và Scroll trong các lượt sau. Báo cáo bên dưới giữ nguyên số liệu/trạng thái tại 11/10, không phải trạng thái hiện tại. Xem [README QA](README.md) để biết evidence nào được track; raw frames và bản thử chỉ giữ local.

11/10/2026 · **A Love Letter in Motion** · Chưa bắt đầu Phase 4.

Portrait được bạn duyệt bằng câu “Duyệt bản này, dùng làm Hero”. Đã dùng đúng PNG master `c4024b5c9fbc8b797793e1914027dcd212e3c77cd7681b9845a2b3f319250011`, không sửa mặt/mask, không sinh lại ảnh. Đây là approval bản bạn cung cấp, không phải chứng nhận RGB đồng nhất với `1.jpg`.

## Bản Hero để review

| Profile Chromium mô phỏng | Screenshot sau thay đổi |
|---|---|
| Desktop 1366 × 768 | [Hero](hero-2026-10-11-final/desktop-1366-hero.png) |
| Desktop 1440 × 900 | [Hero](hero-2026-10-11-final/desktop-1440-hero.png) |
| Desktop 1920 × 1080 | [Hero](hero-2026-10-11-final/desktop-1920-hero.png) |
| iPhone 16 portrait 393 × 852 | [Trong viewport](hero-2026-10-11-final/iphone-portrait-hero.png) · [Toàn bộ Hero natural-height](hero-2026-10-11-final/iphone-portrait-hero-full.png) |
| iPhone landscape 852 × 393 | [Toàn bộ Hero](hero-2026-10-11-final/iphone-landscape-hero-full.png) |
| iPad Gen 10 portrait 820 × 1180 | [Hero](hero-2026-10-11-final/ipad-portrait-hero.png) |
| iPad Gen 10 landscape 1180 × 820 | [Hero](hero-2026-10-11-final/ipad-landscape-hero.png) |

- **Trước:** [Hero desktop cũ](baseline-2026-10-11/desktop-1440-home.png), [iPad portrait cũ](baseline-2026-10-11/ipad-portrait-home.png). Không có video Hero cũ; không dựng lại rồi gọi là baseline đã quay trước sửa.
- **Entrance:** [Video WebM](hero-2026-10-11-final/desktop-entrance.webm), [70 frame thực với timestamp](hero-2026-10-11-final/desktop-entrance-frames/frames.json).
- **Reduced motion:** [Video WebM](hero-2026-10-11-final/reduced-motion.webm). Portrait/text hiển thị ngay, không fade/translate entrance.
- **Báo cáo runtime/DOM/network:** [hero.json](hero-2026-10-11-final/hero.json).
- **Fallback thực bằng chặn request ảnh:** [PNG](hero-2026-10-11-final/fallback-png.png) → [ảnh nguồn editorial](hero-2026-10-11-final/fallback-original.png) → [ảnh không tải được](hero-2026-10-11-final/fallback-unavailable.png).

Video được thu từ CDP screencast của website thật trên localhost, sau đó mã hóa chuỗi frame theo timestamp bằng MediaRecorder trong target trống riêng. Không dựng lại UI, không thay ảnh; có thêm khoảng giữ frame cuối 500 ms để dễ xem. Đây không phải screen recording Safari hoặc bằng chứng FPS production. Browser được mute output; video không có audio.

## Thay đổi đã thực hiện

- Desktop: chữ trái/portrait phải, max-width 1280 px; halo champagne, chữ “Mai Khuê” phía sau ảnh, hai sparkle tĩnh. Không animation trang trí chạy vô hạn.
- Phone: heading → portrait → lời chúc/CTA → scroll hint, chiều cao tự nhiên. Không ép lời chúc/ảnh vừa 852 px bằng cách cắt nội dung. Landscape thấp vẫn cuộn để đọc được toàn bộ.
- iPad portrait: heading phía trên, lời chúc trái và portrait phía dưới bên phải; landscape hai cột. Tất cả dùng cùng cutout, scale đồng đều và `object-fit: contain`.
- `GraduationPortraitComponent`: một `<img>` trong `<picture>`, WebP responsive 480/768/1024 px; PNG → ảnh nguồn → trạng thái lỗi. Có width/height, alt, eager/decode async, ưu tiên tải Hero. Không tải 34 original.
- `OpeningStoryDirective`: entrance ~950 ms ngoài Angular, chỉ sau Intro hoặc khi Hero vào vùng nhìn. Wrapper entrance và scroll tách biệt; **chưa có sticky/ScrollTrigger/scrub**.
- Một GSAP context/timeline riêng; cleanup khi destroy, pause khi tab hidden/modal/Intro, hoàn tất khi scroll/focus keyboard, reduced motion thay đổi runtime vẫn giữ nội dung. Không global-kill GSAP.
- App nối CTA Hero qua coordinator hiện có, giữ modified-click của anchor; thêm replay token. Replay về home bằng `instant` trước khi khóa Intro, tránh kế thừa CSS smooth rồi khóa sai offset. Không reset audio.
- Copy chỉ đổi Hero theo mục X `note4.txt` và subheading mục V đã chốt. Các chỉnh sửa local Intro/Message được giữ nguyên; không làm trước Content phase.

## Verification

| Kiểm tra | Bằng chứng/kết quả |
|---|---|
| Unit/component tests | **29/29 PASS**, `npm test`, Edge 155 qua `CHROME_BIN`. Bao gồm source fallback, h1/ARIA/CTA, waiting/replay, suspension, offscreen/deep link, runtime reduced motion, keyboard focus, visibility và destroy |
| Production build | **PASS**, `npm run build`; initial 406,33 kB raw / 111,95 kB estimated transfer; nằm dưới budget 500 kB |
| Pages build | **PASS**, `npm run build:github-pages`; `<base href="/HappyGradSweetie/">`, đủ 4 hero assets trong artifact; không deploy |
| Runtime bình thường | Không exception/browser/network error ở 7 profile Hero. Các ảnh Hero đều complete và naturalWidth > 0 |
| Hero bounds | Sau chỉnh halo phone, không descendant Hero vượt biên ngang của chính section ở 7 profile. Ảnh không che copy/CTA; mask/master không bị crop |
| Entrance | DOM samples ghi portrait opacity 0 → 1, state running → complete, transform cuối trả CSS; không chạy sau Intro khi chưa mở |
| Reduced motion | 16 samples đều complete/opacity 1, clip riêng; không nội dung bị giữ ẩn |
| Asset errors | Chặn request thật bằng CDP: PNG và original tải được, cuối chuỗi không còn img lỗi và vẫn giữ nội dung/CTA. 8 network failures trong profile fault injection là **cố ý**, không báo chúng là asset lỗi production |
| Replay | Hành động UI Closing → Intro → mở quà trả scrollY=0, Hero complete. Unit test xác nhận mỗi replay có lượt entrance mới |
| Asset integrity | **68/68** original/thumbnail giữ nguyên SHA-256; PNG master và `note4.txt` giữ hash. WebP public khớp variants QA được duyệt |
| CLS quan sát | 0–0,03834 trong lượt dev-server này; có font tải từ xa, không kết luận LCP/CLS production/throttled đã được nghiệm thu |

Lần chạy browser/test trong sandbox có lỗi GPU process không khởi động được. Chạy lại Edge headless với profile tạm riêng ngoài sandbox thành công; không đổi dependency hoặc cấu hình ứng dụng để che lỗi môi trường.

## Phân biệt những gì chưa đạt

**Phase 3 sẵn sàng review bố cục/entrance, không phải toàn bộ website đã hoàn tất.**

- Browser thực dùng Edge/Chromium headless, DPR=1 và touch emulation. Chưa có Safari, iPhone/iPad thật, thanh địa chỉ động, safe area phần cứng hoặc zoom/large text thực tế. Cần nghiệm thu các điểm đó sau.
- Scene Gallery cũ vẫn width=0; global overflow và viewport metrics trên touch còn bất thường (`innerWidth` khác `documentElement.clientWidth`). Đây đã là vấn đề baseline. **Không sửa Gallery trước gate Hero/Scroll**. Không dùng cờ `overflow=false` dựa trên innerWidth để chứng minh toàn trang không tràn ngang.
- CTA desktop đến Invitation đúng top=0; phone portrait đạt trong lượt cuối. Test landscape phone chưa xác nhận click/navigation thành công; tablet dừng lệch 434/71 px trong chuỗi thử hiện tại. **Scroll/CTA touch chưa Passed**: phải kiểm tra settle, input coordinates và visual viewport ở Phase 4, không quy mọi lỗi cho animation Hero.
- Kiểm tra `#memories` trong chuỗi thử chưa đến đúng section; entrance không chạy ngoài màn hình nhưng deep-link restoration **chưa Passed**, thuộc Phase 4.
- Audio có paused=false/readyState=4 sau click nhưng browser mute; chưa kiểm chứng âm thanh nghe thực tế. Không có thay đổi source audio ở Phase 3.
- 10-cycle memory/performance profiling toàn hành trình, gallery loop/hover/swipe và Final Creative Review vẫn ở phase sau. Test xanh không thay thế review trực quan.

## Cách xem và quyết định tiếp theo

Preview riêng đang chạy ở `http://127.0.0.1:4201/`. Mở cửa sổ riêng để xem Intro lần đầu, nhấn mở quà; hoặc dùng “Mở lại món quà” ở Closing để xem entrance lần nữa. Nếu preview đã dừng:

```powershell
Set-Location 'E:\MinhQuun\PastLife\HappyGradSweetie'
npm start -- --host 127.0.0.1 --port 4201
```

Tái thu bộ evidence vào **thư mục mới**, không ghi đè bản review:

```powershell
node scripts/qa/capture-hero.mjs http://127.0.0.1:4201 qa/plan1/hero-review-next
```

Xin bạn duyệt **tỷ lệ chân dung, typography layering, bố cục phone/iPad và nhịp entrance**. Nếu chưa vừa ý, chỉnh trong Phase 3. Nếu bạn duyệt Hero, mới chuyển **Phase 4 Scroll Storytelling** để làm sticky/scrub/auto-alignment và sửa những lỗi navigation ghi trên.

Không commit, push, deploy, thay nhạc hoặc thay ảnh cá nhân.
