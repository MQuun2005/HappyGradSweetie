# Phase 7 — E2E Visual QA & Final Creative Review

> **QA thực hiện 15/10/2026 · approval cập nhật 16/10/2026 · Asia/Saigon · local, chưa commit/push/deploy.**
>
> **Final Creative Review — Chromium Approved:** bạn trả lời **“Duyệt bản Chromium, giữ Safari Pending”**, ghi nhận ngày 16/10. Approval áp dụng cho bản Chromium trong hồ sơ này; không phải nghiệm thu Safari thật hoặc mọi điều kiện thiết bị. Content đã được duyệt ngày 14/10, contrast navy ngày 15/10.
>
> **Cập nhật yêu cầu tiếp theo ngày 16/10:** bạn miễn kiểm chứng thiết bị thật và yêu cầu hoàn thành/commit/push từng phase. Safari/iPhone/iPad thật chuyển từ Pending sang **Waived by user — chưa kiểm thử**, không phải Passed. Xem [hồ sơ phát hành](RELEASE-2026-10-16.md); giữ bản Chromium đã duyệt, không làm lại creative direction/nội dung/Gallery.

## 1. Kết quả và bản source được kiểm tra

- Working tree trên `1251d209ff84453026889bc1e59266d8522af8db`; bao gồm Docs relocation + Phase 6 đã duyệt + Phase 7 fixes. Không phải source đang chạy trên GitHub Pages công khai.
- **105/105 Jasmine tests**, `npm run build`, `npm run build:github-pages` đạt ngày 15/10. Unit test dùng Edge qua launcher local `scripts/qa/karma-edge.cjs`; không đổi launcher CI/package dependencies.
- Artifact cuối: **`main-OUJE5TSM.js`**, initial JS/CSS **476,93 kB raw / 134,11 kB estimated transfer**, base **`/HappyGradSweetie/`**. Không đổi workflow hoặc tự deploy.
- **342/342 checks hành trình**, **232/232 checks scroll**, **30/30 checks contrast** trên source/artifact cuối. Đây là các bộ kiểm tra khác nhau, không phải số lượng unit tests.
- [Manifest kiểm chứng v2](../../../qa/plan1/PHASE7-VERIFICATION-v2.json) chứa hash report/video, source/artifact provenance, bảo toàn ảnh/copy/audio. V2 bổ sung soak 30 chu kỳ và video; [manifest đầu](../../../qa/plan1/PHASE7-VERIFICATION.json) được giữ nguyên. Không sửa report cũ để khớp source mới.
- Bổ sung điều tra heap: [Memory diagnostic](PHASE7-MEMORY-DIAGNOSTIC.md) và [manifest v3 — 129/129 checks](../../../qa/plan1/PHASE7-VERIFICATION-v3.json). V3 kiểm tra thêm source/artifact của lượt diagnostic và hash hai snapshot; không thay thế unit tests hoặc nghiệm thu sáng tạo.
- **Đối chiếu approval ngày 16/10:** 536 hash source/artifact/evidence vẫn khớp v3. Không chạy lại tests/build/video chỉ vì cập nhật trạng thái; các kết quả ngày 15/10 giữ đúng ngày/phạm vi. JSON lịch sử ghi “chờ review” là trạng thái tại lúc thu, không sửa chúng để gắn approval hồi tố.
- [Manifest kiểm chứng ngày 16/10](../../../qa/plan1/PHASE7-VERIFICATION-2026-10-16.json) đạt **129/129 checks**, ghi scope approval Chromium và các phần Pending riêng. Đây là lần kiểm chứng integrity mới, không phải một lượt browser capture mới.

### Phân biệt hai artifact

| Artifact | Phạm vi bằng chứng |
|---|---|
| `main-AGEQQE6W.js` | Đã có navy, sửa Lightbox/audio; đo full loop, performance 60 giây, lifecycle và fault injection |
| `main-OUJE5TSM.js` | Chỉ thêm khoảng đầu card Invitation để ribbon không đè chữ; chạy lại toàn hành trình, scroll và contrast |

Các capture trước ribbon có **đúng một source difference**: `graduation-invitation.css`. Gallery controller, geometry, audio, Lightbox và nội dung không đổi giữa hai bản. Không tuyên bố đã quay lại toàn vòng 7,5 phút trên artifact cuối. Full-loop trước ribbon vẫn là bằng chứng đúng source Gallery, kèm phạm vi rõ ràng.

## 2. Những lỗi đã sửa trong Phase 7

| Vấn đề có bằng chứng | Sửa trong phạm vi | Kiểm tra sau sửa |
|---|---|---|
| Chữ rose nhỏ trên pastel chỉ khoảng 2,88–3,54:1; chữ trắng/nút rose 3,70:1 | Eyebrow, degree, Hero subheading/CTA hover, tooltip number và portrait fallback dùng navy/navy-raised sẵn có; nút mở quà nền navy; Gallery focus outline navy. Giữ nền pastel, rose trang trí và typography | Computed styles trên desktop/iPhone/iPad; nút trắng/navy 12,77:1, navy ≥7,36:1 và navy-raised ≥5,26:1 trong bộ nền thử |
| Lightbox ảnh dọc bị cắt khi viewport ngang thấp | Panel có chiều cao xác định theo `dvh`; media grid co giãn, ảnh `object-fit: contain` trong phần diện tích thực còn lại | 852×393: image box nằm trong media, không mất đầu/chân, close/next/previous còn nhấn được |
| Footer Lightbox làm nút next tràn khi text 200% | Footer grid `minmax(0,1fr)`, mobile xếp nav xuống dòng, buttons không bị flex-shrink, panel có native internal scroll khi cần | Bounding box + hit-test tâm từng nút; focus trap/scroll restoration vẫn đạt |
| Audio retry bị phím modifier tiêu thụ | Chỉ gỡ listeners khi có gesture hợp lệ; bỏ `{once:true}` trên listener cần lọc Ctrl/Alt/Meta/Shift | Regression test và fault injection: autoplay một lần, modifier không tiêu thụ retry, Enter thử đúng một lần |
| Promise `audio.play()` hoàn thành sau destroy vẫn tạo fade RAF | Guard `destroyed` + generation, hủy fade/listeners, pause khi destroy | Regression test trước sửa thất bại, sau sửa đạt; không thêm audio element/file mới |
| Ribbon thiệp chạm chữ eyebrow trên tablet/phone | Dành tối thiểu `4.75rem` phía trên nội dung, bao gồm đuôi ribbon `4.25rem` + khoảng thở. Không đổi ribbon/copy | Cả 9 profile có khoảng cách ít nhất **8,61 px** (text 200% khoảng 16,20 px); screenshot đã kiểm tra |

Mốc chữ nhỏ là 4,5:1 theo [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Collector lấy **màu chữ computed** và so với các nền đặc trong palette; đây là kiểm chứng giới hạn cho các thành phần được sửa, không phải audit toàn bộ WCAG hoặc đo mọi pixel gradient/ảnh/caption. Không kết luận đạt chuẩn chỉ vì ratio được làm tròn.

## 3. Bộ kiểm thử và provenance

Môi trường: **Edge 155.0.4283.45, Chromium headless, Windows 10.0.26100, i5-13400F / 16 logical CPUs**. Production preview chỉ ở `127.0.0.1:4205/HappyGradSweetie/`, không throttle mạng/CPU. Profile browser riêng cho từng collector; không thao tác browser cá nhân.

| Bộ kiểm thử | Kết quả | Evidence |
|---|---|---|
| Hành trình cuối | **342/342**, 9 profile, 75 screenshot, 0 unexpected runtime/network errors | [Journey JSON](../../../qa/plan1/final-journey-2026-10-15-handoff/final.json) |
| Scroll cuối | **232/232**; 84 ca cặp section ngắn tại 25/50/75%, hai chiều; sai số lớn nhất **0,03125 px**; 15 vị trí đọc Letter dài | [Scroll JSON](../../../qa/plan1/final-scroll-2026-10-15-handoff/final.json) |
| Contrast cuối | **30/30**, 3 profile, 18 screenshot | [Contrast JSON](../../../qa/plan1/final-contrast-2026-10-15-handoff/final.json) |
| Full loop thật | **8/8**, đủ 34 active IDs, seam 34→1, 452,898 giây; không original trước Lightbox, tối đa 11 card | [Loop JSON](../../../qa/plan1/final-loop-2026-10-15-pass1/final.json) |
| Lifecycle | **31/31**, 10 chu kỳ sau warm-up; reduced motion runtime, tab hidden/offscreen, focus/position restoration, history/orientation | [Lifecycle JSON](../../../qa/plan1/final-lifecycle-2026-10-15-final/final.json) |
| Soak mở rộng, source cuối | **51/51**, 30 chu kỳ sau warm-up; ghi cả heap tăng, không tự chứng nhận leak-free | [Soak JSON](../../../qa/plan1/final-lifecycle-2026-10-15-soak/final.json) |
| Heap diagnostic, source cuối | **51/51**, lượt riêng 30 chu kỳ; snapshot chu kỳ 10/30 và retainer analysis | [Memory diagnostic](PHASE7-MEMORY-DIAGNOSTIC.md) |
| Fault injection | **13/13**, 6 tình huống | [Resilience JSON](../../../qa/plan1/final-resilience-2026-10-15-final/final.json) |

Các profile hành trình: **1366×768, 1440×900, 1920×1080, 393×852, 852×393, 820×1180, 1180×820**, thêm **393×852 root text 200%** và **reduced motion**. Text 200% là tăng font gốc để kiểm tra reflow, không phải bằng chứng Safari pinch/browser zoom thật.

Các thao tác dùng CDP input thật trong browser mô phỏng: click/touch/key/wheel; không gọi private Angular setters để ép gallery position hoặc sửa kết quả. Thiết lập vị trí bắt đầu cho từng ca có `scrollTo`/`scrollIntoView` instant. Các ca alignment dùng wheel có hướng trên profile fine/coarse; touch swipe thật trong emulation được kiểm tra riêng ở journey. Điều này không mô phỏng đầy đủ momentum của trackpad thật.

### Hành vi đã được kiểm tra

- Intro khóa nền, main inert; click mở quà gọi audio với user activation. Một audio, không reset khi replay; playback state thành công trong browser QA đã mute output.
- Hero CTA, sáu chapter, navigator đúng capability; passive scroll không thêm hash/history, explicit navigation tạo đúng một entry.
- Root snap tắt khi coordinator hoạt động; không pin-spacer. Sticky không tự snap giữa đoạn Hero → Invitation; short-pair alignment có fallback khi không có `scrollend`, input mới hủy correction.
- Section dài đọc tự nhiên; không bị kéo về đầu Letter. Deep links/reload `#invitation`, `#memories`, back/forward, replay hoạt động.
- Gallery load thật, virtual window bounded; hover trái/giữa/phải nằm trong viewport; horizontal drag không mở modal nhầm hoặc cuộn page; vertical touch swipe thoát Gallery.
- Lightbox đúng original, contain, next/swipe, focus trap, Escape, trả scroll và card focus; lock nền qua wheel. Caption/error UI không làm mất controls.
- Runtime reduced motion, offscreen/tab hidden pause, resume không cộng dồn delta; xoay iPad mô phỏng giữ ảnh active.
- Fault injection riêng: autoplay rejected, audio blocked, portrait WebP/PNG blocked → original fallback, tất cả portrait blocked → readable fallback, original images blocked → next/close vẫn dùng được, sessionStorage bị từ chối → mở quà/replay vẫn hoạt động.

Lỗi network trong **fault injection** là chủ đích và được lưu nguyên trong report, không gọi chúng là “0 lỗi console”. “0 unexpected errors” chỉ áp dụng bộ hành trình thông thường. Hai lỗi audio có regression test thất bại trước sửa; evidence lỗi Lightbox và các lượt collector chưa hoàn thiện vẫn giữ ở `final-journey-2026-10-15-pass1`.

## 4. Hiệu năng và cleanup — kết quả có giới hạn

- **Probe 60 giây không quay video:** 7.266 RAF intervals, p50 8,30 ms, p95 8,50 ms, p99 8,60 ms; 99,97% dưới 18 ms; không có Long Task >50 ms được observer ghi nhận. DOM sample mỗi giây. Đây là nhịp callback của headless trên máy này, **không phải FPS màn hình thiết bị thật hoặc chứng nhận 120 FPS**.
- Sau probe mới quay Gallery khoảng 45 giây; các collector khác có chạy đồng thời ở phần sau full-loop. Không dùng phần chạy đồng thời để suy benchmark độc lập.
- Giữ 34 IDs ở tốc độ thật; chưa tải original trước modal. Ảnh được kiểm tra bằng `naturalWidth > 0`, không chỉ HTTP 200.
- Sau warm-up và 10 replay/modal/resize: window/document/scene listeners lần lượt **9/17/9**, DOM event listeners **124**, nodes **489** trong các mẫu đã thu; pending RAF không tích lũy. Counter RAF có thể chứa callback framework/GSAP, không dùng tổng số này để nói toàn trang không còn RAF khi Gallery pause.
- Post-GC heap trong 10 chu kỳ tăng từ **4.269.344 lên 4.642.760 bytes (~8,7%)**. Đã mở rộng thành **30 chu kỳ trên artifact cuối**: từ 4.258.724 lên 4.870.004 bytes (~14,4%), riêng 10 chu kỳ cuối tăng khoảng 2,1%; listener vẫn 124, nodes 489–491, RAF không tích lũy. Tốc độ tăng giảm nhưng **chưa chứng minh heap đạt plateau hoặc không có mọi loại leak**. Các assertions ngưỡng 25% đạt chỉ chứng minh ngân sách kịch bản này; quan sát dài hạn/retainer analysis khi có dấu hiệu tăng tiếp vẫn là giới hạn còn lại.
- **Điều tra bổ sung đã hoàn thành:** snapshot chu kỳ 10→30 của lượt mới tăng 317.773 B tổng shallow, trong đó code +215.120 B và native +102.729 B; closure không tăng, object chỉ +5/+88 B, detached DOM giữ cùng bốn ID. Native retainer mẫu dẫn đến Performance buffers và DevTools Network. [Báo cáo đầy đủ](PHASE7-MEMORY-DIAGNOSTIC.md) chưa tìm thấy bằng chứng ứng dụng tích lũy component/listener qua replay; không sửa source theo phỏng đoán. Đây không phải phép tính retained size/dominator hoặc bảo đảm leak-free dài hạn.
- Journey có CLS/LCP trên **lần reload `#memories` cuối**, không phải cold-load field metrics: CLS 0–0,0193; LCP 84–488 ms local. Có long tasks đơn lẻ lúc load ở vài profile; không che giấu bằng câu “website không có long task”. Không dùng những số local/warm-cache này để cam kết Core Web Vitals trên GitHub Pages.
- Bản source Gallery/Scroll đã duyệt không bị rewrite trong Phase 7. Không thêm animation hay dependency để tăng điểm đo.

## 5. Ảnh/video để review

### So sánh lỗi → bản sửa

| Vấn đề | Trước | Sau |
|---|---|---|
| Intro chữ/nút thiếu contrast | [Desktop trước navy](../../../qa/plan1/final-journey-2026-10-15-pass2/desktop-intro.png) | [Desktop navy](../../../qa/plan1/final-journey-2026-10-15-handoff/desktop-intro.png) |
| Ribbon chạm eyebrow trên iPad | [Trước spacing](../../../qa/plan1/final-contrast-2026-10-15-pass1/ipad-invitation-navy.png) | [Sau spacing](../../../qa/plan1/final-journey-2026-10-15-handoff/ipad-p-invitation.png) |
| Lightbox ngang cắt ảnh | [Trước](../../../qa/plan1/final-journey-2026-10-15-pass1/iphone-landscape-lightbox.png) | [Sau](../../../qa/plan1/final-journey-2026-10-15-handoff/iphone-landscape-lightbox.png) |
| Text 200% cắt controls | [Trước](../../../qa/plan1/final-journey-2026-10-15-pass1/iphone-text200-lightbox.png) | [Sau](../../../qa/plan1/final-journey-2026-10-15-handoff/iphone-text200-lightbox.png) |

### Review hiện tại

- [Desktop journey video](../../../qa/plan1/final-journey-2026-10-15-handoff/desktop-journey.webm), [iPhone journey video](../../../qa/plan1/final-journey-2026-10-15-handoff/iphone-journey.webm), [iPad portrait journey video](../../../qa/plan1/final-journey-2026-10-15-handoff/ipad-p-journey.webm).
- [Gallery video ~45 giây](../../../qa/plan1/final-loop-2026-10-15-pass1/gallery-45s.webm), [5s](../../../qa/plan1/final-loop-2026-10-15-pass1/gallery-5s.png), [15s](../../../qa/plan1/final-loop-2026-10-15-pass1/gallery-15s.png), [30s](../../../qa/plan1/final-loop-2026-10-15-pass1/gallery-30s.png), [45s](../../../qa/plan1/final-loop-2026-10-15-pass1/gallery-45s.png). Các mốc tính từ lúc bắt đầu recording sau 60 giây probe, không phải từ lúc mở quà.
- [Hero desktop](../../../qa/plan1/final-journey-2026-10-15-handoff/desktop-hero.png), [Hero iPhone](../../../qa/plan1/final-journey-2026-10-15-handoff/iphone-hero.png), [Hero iPad](../../../qa/plan1/final-journey-2026-10-15-handoff/ipad-p-hero.png).
- [Gallery hover desktop](../../../qa/plan1/final-journey-2026-10-15-handoff/desktop-hover.png), [Gallery iPhone](../../../qa/plan1/final-journey-2026-10-15-handoff/iphone-memories.png), [Gallery iPad ngang](../../../qa/plan1/final-journey-2026-10-15-handoff/ipad-l-memories.png).
- [Letter iPhone](../../../qa/plan1/final-journey-2026-10-15-handoff/iphone-letter.png), [Closing iPhone](../../../qa/plan1/final-journey-2026-10-15-handoff/iphone-closing.png). Ảnh chụp viewport không phải toàn bộ thư; [Phase 6 có ảnh thư đầy đủ](PHASE6-CONTENT-REVIEW.md).

Video là timestamped **CDP frames thực**, encode bằng Edge MediaRecorder, không dựng UI lại; không có audio. Journey khoảng 20 giây là chuỗi QA tua nhanh thao tác, không dùng để quyết định nhịp đọc thư. Gallery video dành riêng chuyển động tốc độ thật. Frame thô/JSON được giữ nguyên; lần encoder đầu lỗi decode đã thử lại thành công, không sửa frame nguồn.

Đã xem các screenshot before/after, các layout cuối và frame Gallery mẫu. Bạn đã duyệt bản Chromium qua câu trả lời review được ghi nhận ngày 16/10. Không suy việc duyệt video/emulation thành thử nghiệm Safari/iPhone/iPad thật hoặc xác nhận audio nghe được.

## 6. Bảo toàn project

- 34 original + 34 thumbnail đối chiếu SHA-256 với baseline Hero; master portrait PNG và note4 đúng hash đã duyệt.
- `celebration-content.ts` khớp byte với capture Content được bạn duyệt; không biên tập thêm lời chúc, caption, ngày/ngành/trường/tên/người gửi.
- File audio khớp byte với Git checkpoint; không thay bài nhạc hoặc config để ép autoplay.
- Không chỉnh `.github` workflow, `angular.json`, dependencies, các project bên cạnh hoặc Git history. Không commit/push/deploy.
- Evidence mới nằm local/ignored theo quy tắc có sẵn; chưa có trên GitHub. Không xóa bản thử hoặc ghi đè ảnh/video/JSON cũ.

## 7. Pending và review gate

| Mục | Trạng thái / cần làm |
|---|---|
| Chromium QA trong phạm vi đã mô tả | Đạt các bộ checks nêu trên; không đồng nghĩa chứng nhận mọi điều kiện thiết bị |
| Safari thật: iPhone 16/iPad Gen 10 | **Waived by user ngày 16/10**; chưa có video/Inspector evidence, không ghi Passed |
| Safe area, Safari toolbar, pinch/zoom, trackpad thật | **Waived by user** trong phần thiết bị thật; emulation không chứng minh phần cứng |
| Nghe nhạc thực tế và policy iOS | **Waived by user** trong phần thiết bị thật; đã kiểm tra activation/state/rejection, không cam kết iPhone tự phát khi tải trang |
| Memory dài hạn | Đã so snapshot/retainer chu kỳ 10→30; mức tăng chủ yếu code V8/native Performance/Inspector, chưa xác nhận leak ứng dụng. Heap plateau/leak-free dài hạn **chưa được chứng minh**; xem [diagnostic](PHASE7-MEMORY-DIAGNOSTIC.md) |
| Final QA / Final Creative Review | **Chromium Approved**; gate thiết bị thật được miễn trong yêu cầu mới ngày 16/10 |
| Publish | Đã được yêu cầu commit/push từng phase; xem hồ sơ phát hành cho kết quả. Giữ file nhạc hiện có, không xác nhận thay chủ project về bản quyền |

Khi có thiết bị: mở session mới → mở quà/nghe nhạc → cuộn xuống/lên → Gallery swipe ngang/vuốt dọc → mở/đóng ảnh → đọc hết thư → xoay iPad → refresh `#memories` → replay. Gửi video kèm thiết bị, phiên bản iOS/iPadOS/Safari và ghi chú lỗi; nếu được, thêm Safari Inspector Console/Network. Không cần gửi ảnh cá nhân lên dịch vụ khác.

Hướng dẫn theo từng ca và mẫu ghi kết quả: [Safari/device checklist](PHASE7-SAFARI-CHECKLIST.md). Không dùng bản Pages checkpoint cũ để nghiệm thu source local chưa phát hành.

### Final Creative Review — phạm vi đã duyệt và phần còn mở

- [x] Hero portrait/layering và navy trong bản Chromium được duyệt.
- [x] Chuyển cảnh, nội dung dài và nhịp kể chuyện trong bản Chromium được duyệt.
- [x] Invitation, Message/Letter/Closing và typography trong bản Chromium được duyệt.
- [x] Gallery gần–xa/hover/tốc độ và bố cục touch emulation trong bản Chromium được duyệt; thao tác thiết bị thật kiểm tra riêng.
- [x] Copy Phase 6 được giữ nguyên trong bản Chromium duyệt cuối.
- [ ] Nghe audio trên thiết bị phù hợp, không quá lớn hoặc tranh sự chú ý với thư.
- [x] Approval giới hạn rõ: “Duyệt bản Chromium, giữ Safari Pending”; không gộp các mục Safari Pending thành Passed.
- [ ] Nghiệm thu phần thiết bị thật theo evidence; chưa có dữ liệu để đánh dấu đạt.

Hai ô nghe nhạc/thiết bị thật để trống có chủ đích: **được miễn ngày 16/10**, không còn là gate bắt buộc nhưng vẫn chưa được kiểm chứng. Không cần xin lại approval Chromium; yêu cầu hoàn thành và push mới được ghi tại hồ sơ phát hành.

Nếu có hiệu ứng cạnh tranh, ưu tiên giảm trong phần được chỉ ra; không tự mở thêm creative redesign. Sau bất kỳ thay đổi nào, chạy lại QA vùng bị ảnh hưởng và cập nhật provenance.

## 8. Chạy lại local

Từ gốc repo, build xong trước khi mở collector; không thay `dist` khi capture đang chạy:

```powershell
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test -- --karma-config=scripts/qa/karma-edge.cjs --browsers=EdgeHeadlessQA
npm run build
npm run build:github-pages
node scripts/qa/serve-production.mjs 4205 /HappyGradSweetie/
```

Terminal khác, chọn tên thư mục **mới** (collector từ chối ghi đè):

```powershell
node scripts/qa/capture-final-journey.mjs http://127.0.0.1:4205/HappyGradSweetie/ qa/plan1/my-new-journey
node scripts/qa/capture-final-scroll.mjs http://127.0.0.1:4205/HappyGradSweetie/ qa/plan1/my-new-scroll
node scripts/qa/capture-final-contrast.mjs http://127.0.0.1:4205/HappyGradSweetie/ qa/plan1/my-new-contrast
node scripts/qa/capture-final-resilience.mjs http://127.0.0.1:4205/HappyGradSweetie/ qa/plan1/my-new-resilience
node scripts/qa/capture-final-lifecycle.mjs http://127.0.0.1:4205/HappyGradSweetie/ qa/plan1/my-new-lifecycle
node scripts/qa/capture-final-loop.mjs http://127.0.0.1:4205/HappyGradSweetie/ qa/plan1/my-new-loop
```

Loop mất hơn 7,5 phút; để 60 giây đầu không có build/capture nặng khác. Manifest `verify-final.mjs` cố định các capture bàn giao phía trên để audit lịch sử; chọn output JSON mới khi kiểm tra lại, không sửa JSON cũ.
