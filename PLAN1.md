# HappyGradSweetie — A Love Letter in Motion

> **Trạng thái 14/10/2026:** Đã chỉnh tiếp hover Gallery theo yêu cầu; bản sửa đạt kiểm tra kỹ thuật nhưng **vẫn chờ bạn duyệt Gallery** qua [screenshot, video và báo cáo](qa/plan1/PHASE5-GALLERY-REVIEW.md). Giữ Hero/Scroll đã duyệt; chưa sang Phase 6 Content. Safari/thiết bị thật còn Pending.
> **Checkpoint Git:** Bạn đã yêu cầu commit/push từng phase, kể cả phần hoàn thành của phase đang dở. Quyền này chỉ áp dụng đợt lưu checkpoint hiện tại; push `master` sẽ kích hoạt workflow Pages sẵn có. Không sửa workflow hoặc tự coi việc push là duyệt Gallery. Xem [bảng checkpoint và phạm vi QA được lưu trên Git](qa/plan1/README.md).
> **Cập nhật tiến độ:** 14/10/2026. Nhật ký thực thi ở mục 5.8–5.11; gate và tiêu chí của kế hoạch vẫn giữ nguyên, không tự đánh dấu duyệt thị giác thay bạn. Các ghi nhận “chưa commit/push/deploy” bên dưới là trạng thái lịch sử tại ngày ghi nhận.
> **Thứ tự review bắt buộc:** Portrait → Hero → Scroll Storytelling → Gallery → Content → Final QA → Final Creative Review.

### Những điều chỉnh sau review

- Thay phương án ScrollTrigger pin với `pinSpacing: false` bằng **CSS sticky cho portrait trên desktop đủ điều kiện**, ScrollTrigger chỉ điều khiển scrub, không pin hoặc snap.
- Chốt **một scroll coordinator** sở hữu auto-alignment, navigation và restoration; không bật/tắt root snap liên tục theo vùng Hero.
- Bổ sung Portrait Mask Quality Gate, phương án crop/mask desktop/mobile và fallback ảnh nguồn cần được duyệt.
- Nâng tiêu chí gallery từ thay đổi scale/depth sang camera-space hover, giới hạn viewport, card lân cận nhường chỗ và bằng chứng loop đủ 34 ảnh.
- Thêm Content Review và **Final Creative Review sau Phase 7**, cùng quy trình nhận screenshot/video khi không có browser automation.
- Giữ concept, palette, typography, thông tin cá nhân, ảnh nguồn, audio, framework và các quyết định hợp lý đã chốt. Không tự commit, push hoặc deploy.

## 1. Kết quả audit và hướng nâng cấp đã chốt

Phạm vi là toàn bộ `note4.txt`, với **ảnh `1.jpg` làm chân dung nguồn** và **Hero desktop bố trí ảnh bên phải, chữ bên trái**, theo lựa chọn của bạn.

### Hiện trạng đã xác minh trong đợt audit trước

- Đợt audit trước đã đối chiếu local/GitHub tại HEAD `f2dfc34`. Khi cập nhật tài liệu này, local vẫn ở commit đó; không coi đây là một lần xác minh mới trạng thái GitHub.
- Working tree hiện có thay đổi chưa commit trong `src/app/data/celebration-content.ts`, cùng `PLAN1.md` và `note4.txt` chưa được track. Phải đọc lại diff khi triển khai và bảo toàn các thay đổi này; không reset, checkout hoặc ghi đè bằng bản từ remote.
- Đủ **34 ảnh original và 34 thumbnail**.
- `1.jpg` có kích thước thực tế **1706 × 2560**, khoảng 439 KB. Ảnh có mũ, tóc, tua vàng, hai tay; phần thân dưới bị mặt bàn che.
- Chưa có thư mục asset Hero hoặc chân dung tách nền.
- Hero hiện là chữ căn giữa và mũ tốt nghiệp trang trí bằng CSS. Chưa có portrait, entrance timeline hoặc chuyển cảnh sang Invitation.
- GSAP và ScrollTrigger đã có trong dependency cài đặt; source ứng dụng chưa sử dụng ScrollTrigger.
- Gallery đã tách motion position khỏi Signals và dùng RAF cập nhật card. Đây là nền tảng để giữ lại.
- Audio đã phát theo hành động mở quà; Lightbox có ảnh gốc, điều hướng vòng, focus trap và scroll lock.
- Baseline của đợt audit trước: **16/16 tests đạt**, **build GitHub Pages đạt**, initial bundle khoảng **324,84 KB raw / 84,93 KB estimated transfer**. Đây không phải kết quả nghiệm thu cho các thay đổi chưa triển khai trong kế hoạch này.
- Chưa có bộ screenshot, recording hoặc profiling xác minh bản nâng cấp. **Visual QA: Pending / chưa được xác minh.** Test headless không thay thế visual QA; Chromium emulation không phải Safari hay thiết bị thật.

### Những điểm cần sửa cùng bản nâng cấp

| Khu vực | Phát hiện từ source | Hướng xử lý |
|---|---|---|
| Hero | Chưa có portrait và trạng thái bắt đầu animation sau Intro | Tạo bố cục nhiều lớp, entrance theo vòng mở quà |
| Scroll | Snap toàn trang và settlement có thể tranh chấp với đoạn portrait được giữ cố định | Dùng một cơ chế điều phối vùng chuyển cảnh |
| Gallery hover | Xoay card về góc local `0` vẫn giữ ảnh nghiêng theo camera stage | Bù cả góc camera khi đưa ảnh ra trước |
| Gallery motion | Frame có `delta = 0` gán hover trực tiếp tới trạng thái đích | Tách render tức thời khỏi tiến trình nội suy |
| Gallery lifecycle | Điều kiện inertia/hover có thể vượt qua một số điều kiện pause | Áp dụng hard-stop chung trước mọi nhánh RAF |
| Gallery drag | Chặn click sau drag chỉ được ghi nhận khi có inertia | Chặn click sau mọi drag đã vượt ngưỡng |
| Gallery responsive | Hàm cấu hình nhận chiều cao scene, chưa phải chiều cao viewport thực | Tách kích thước scene và thông tin thiết bị |
| Gallery CSS | Scene thiếu chiều rộng tường minh; `will-change` được bật thường trực | Đặt chiều rộng rõ ràng, chỉ bật compositing hint khi cần |
| Nội dung | Chưa có subheading, scroll hint, gallery instruction, closing highlight | Mở rộng data contract tập trung |
| Lightbox mobile | Media query ghi đè padding có safe area | Giữ safe-area padding ở cả breakpoint mobile |

Các nhận xét về clipping, độ che mặt, frame pacing và chiều sâu thực tế vẫn cần browser evidence để kết luận.

### Bài học từ repository tham khảo

Đã đọc sáu file bạn chỉ định trong `portfolio-dev`, tại HEAD `087cd84`.

Áp dụng cách dùng nhân vật làm trọng tâm, typography nhiều lớp và timeline thay đổi vị trí nhân vật theo từng vùng cuộn. Reference hiện sử dụng React, Three.js, camera thật và Lenis; HappyGradSweetie sẽ chuyển ý tưởng đó sang ảnh thật 2.5D trong Angular. [Source tham khảo](https://github.com/tuanasish/portfolio-dev/tree/087cd8402a79dde4d0bc7e05b4b0f26ca9281578/src/components)

Không sao chép vòng RAF WebGL chạy liên tục, timer hoặc cách đăng ký listener thiếu cleanup ổn định trong reference. Chọn **native scrolling + GSAP ScrollTrigger**, không thêm Lenis, ScrollSmoother, Three.js hoặc font mới.

---

## 2. Chân dung, visual direction và nội dung

### 2.1. Chuẩn bị ảnh tách nền

Ảnh nguồn tham chiếu ban đầu (giữ nguyên, cũng là fallback lúc chạy):

`public/Image/original/1.jpg`

Kết quả cần có:

- `public/Image/hero/mai-khue-cutout.png`: master có alpha.
- `public/Image/hero/mai-khue-cutout.webp`: bản production có alpha.
- Các biến thể WebP nhỏ hơn cho `srcset`, không upscale vượt độ phân giải master thực tế.

**Master được bạn duyệt ngày 11/10/2026:** `public/Image/hero/mai-khue-cutout.png`, 1024×1536, hash `c4024b5c9fbc8b797793e1914027dcd212e3c77cd7681b9845a2b3f319250011`. Câu trả lời: **“Duyệt bản này, dùng làm Hero”**, sau khi đã nêu khác biệt framing/chi tiết so với `1.jpg`. Phê duyệt này chốt chính bản bạn cung cấp làm master; **không phải bằng chứng RGB đồng nhất với ảnh nguồn**. Giữ nguyên file, không sinh lại, không sửa mặt hoặc mask. Dùng WebP 1024/768/480 px đã kiểm tra trong [review chi tiết](qa/plan1/portrait-user-2026-10-11-c4024b5c/REVIEW.md), không upscale. Quy trình tách nền dưới đây được giữ làm lịch sử/quality constraints; không chạy lại công cụ tách nền.

Quy trình sau khi được duyệt:

1. Ghi nhận hash và kích thước ảnh nguồn.
2. Dùng công cụ tách nền tạo alpha thật, không tái tạo chủ thể. Hai lần thử `imagegen` đã bị loại; ngày 11/10/2026 bạn cho phép tải đúng `1.jpg` lên Canva được kết nối để thử công cụ tách nền chuyên dụng. Quyền thử Canva không đồng nghĩa phê duyệt kết quả hoặc cho phép bỏ qua Portrait Quality Gate.
3. Loại bỏ cây xanh, cột và vùng mặt bàn bằng alpha; giữ tất cả phần người thực sự có trong ảnh. Tách nền không đồng nghĩa phục dựng những phần bị mặt bàn che.
4. Đối chiếu đường biên tóc, mũ, tua vàng, hai tay và cổ tay áo.
5. Để bảo toàn ảnh thật, ưu tiên lấy alpha/mask đã kiểm tra và ghép với RGB của ảnh nguồn bằng Sharp có sẵn. Chỉ dùng mask khi nó khớp hình học với ảnh gốc; không co kéo ảnh để khớp một tư thế do công cụ sinh lại. Pixel vùng chủ thể đặc của PNG master phải lấy từ ảnh nguồn, không từ gương mặt hoặc cơ thể được tái tạo.
6. Xuất PNG master và WebP production; preview trên nền ivory, blush, lavender và nền tối.
7. Chuẩn bị preview crop/mask desktop và mobile; dừng để bạn review asset trước khi đưa vào Hero.

Prompt xử lý ảnh sẽ chốt:

> Tách duy nhất người trong ảnh nguồn khỏi toàn bộ background và mặt bàn, xuất nền trong suốt. Giữ nguyên gương mặt, biểu cảm, tư thế, tỷ lệ, màu sắc, tóc, mũ tốt nghiệp, tua vàng, trang phục và hai tay nhìn thấy. Không làm đẹp mặt, không thay người, không sửa chữ/logo trên áo, không vẽ thêm phần cơ thể bị che hoặc nằm ngoài ảnh. Giữ chi tiết đường biên tự nhiên, không tạo halo hay shadow vào file master.

Phần dưới của chủ thể sẽ kết thúc đúng vùng ảnh có dữ liệu. Khi hiển thị trên web, dùng mask chuyển nhẹ ở **phần áo cuối ảnh**, phía dưới hai tay; không che đầu, tua mũ hoặc bàn tay để giấu lỗi cắt.

Công cụ sinh ảnh không được xem là bảo đảm giữ nguyên chủ thể. Nếu mask lệch hoặc làm mất chi tiết quan trọng, asset chưa đạt nghiệm thu và chưa chuyển sang Hero.

#### Portrait Mask Quality Gate — điều kiện bắt buộc trước Phase 3

- Không sinh thêm thân, tay, ngón tay, trang phục hoặc bất kỳ phần cơ thể nào bị bàn che hay nằm ngoài ảnh.
- Không biến đổi khuôn mặt, biểu cảm, tỷ lệ người; không làm đẹp hoặc thay texture da. Không sửa chữ/logo trên trang phục.
- Giữ trọn tóc nhìn thấy, mũ đen, dây tua vàng, các phần tay và cổ tay áo có dữ liệu thật. Kiểm tra từng chi tiết ở mức phóng đại 100–200%.
- PNG master có alpha thật, không nền caro giả; không viền trắng/xanh, halo tối hoặc mép cắt cứng nổi bật ở kích thước hiển thị thực tế.
- WebP production được đối chiếu riêng với PNG master: alpha không đứt tua/tóc; nén không tạo viền hoặc làm mất chi tiết quan trọng.
- Crop chỉ loại khoảng trống trong suốt hoặc kết thúc ở vùng occlusion có thật; không crop vào đầu, mũ, tua hay tay để làm asset có vẻ đạt.
- Mask mềm là lựa chọn **trình bày** có chủ đích, tách khỏi master. Chỉ áp dụng ở phần áo cuối ảnh dưới hai tay; không dùng fade để che lỗi segmentation.

| Profile | Cách hiển thị chân dung | Điều kiện đạt |
|---|---|---|
| Desktop | Trim khoảng alpha thừa; chân dung bên phải, giữ toàn bộ silhouette hợp lệ; lower-body fade rất nhẹ nếu cần | Mặt, mũ, tua, tay không bị typography hoặc mép viewport cắt; phần kết thúc dưới tự nhiên |
| iPhone | `contain` trong vùng có chiều cao tự nhiên, scale đồng đều; giảm diện tích trang trí trước khi giảm ảnh | Mũ/tua và tay còn đủ, không ép `cover` để lấp viewport; không phải dựng thêm cơ thể |
| iPad portrait/landscape | Dùng cùng master với kích thước/crop trình bày riêng theo chiều cao và bố cục | Không coi crop desktop là mặc định cho touch; không cắt chủ thể khi xoay màn hình |

**Bộ bằng chứng gửi duyệt:** ảnh nguồn cạnh cutout, PNG và WebP trên bốn nền ivory/blush/lavender/navy, crop chi tiết mặt/tóc/mũ/tua/tay/biên dưới, preview desktop/mobile, kích thước/dung lượng/alpha và hash nguồn trước–sau.

**Nếu không đạt:** dừng Phase 2, báo rõ chi tiết bị mất hoặc bị tái tạo. Đề xuất giữ ảnh nguồn trong khung editorial có nền gốc, `object-fit: contain`, không giả làm cutout. Chỉ chuyển sang Hero khi bạn duyệt asset tách nền **hoặc duyệt rõ phương án ảnh nguồn thay thế**. Không tự coi fallback là lý do bỏ qua review.

**Fallback lúc chạy:** WebP → PNG cùng cutout đã duyệt → ảnh nguồn trong khung editorial, bỏ hiệu ứng xuyên nền/sticky không còn phù hợp. Nếu cả ảnh nguồn lỗi, giữ nội dung/CTA truy cập được và hiển thị trạng thái lỗi ảnh nhẹ nhàng; không để Hero trống hoặc chặn hành trình.

### 2.2. Hero desktop

Concept: **Pastel Romantic Editorial × Portrait 2.5D**.

- Nội dung giới hạn khoảng 1280px, căn giữa màn hình.
- Cột chữ bên trái khoảng 44%; chân dung bên phải khoảng 56%.
- Portrait chiếm khoảng 72–82% chiều cao viewport khả dụng, giữ trọn mũ và tua vàng.
- Heading editorial lớn, line-height đủ cho dấu tiếng Việt.
- Lead giới hạn khoảng 36–40 ký tự mỗi dòng, CTA nằm trong vùng chữ.
- Chữ trang trí cỡ lớn phía sau chân dung dùng chính tên “Mai Khuê”; đánh dấu `aria-hidden`.
- H1, họ tên đầy đủ, lời chúc và CTA luôn đọc được.

Thứ tự layer trong vùng mở đầu:

| Lớp | Nội dung | Quy tắc |
|---|---|---|
| 0 | Ivory/blush gradient | Hai lớp nền để crossfade |
| 1 | Halo, ribbon, tối đa vài sparkle | Không nhận pointer |
| 2 | Typography trang trí phía sau | Có thể bị mũ/vai che một phần |
| 3 | Portrait | Ảnh thật, scale đồng đều, không xoay giả khuôn mặt 3D |
| 4 | Nội dung đọc được và Invitation card | Không bị chân dung che |
| Overlay | Navigator, Intro, Lightbox | Tách khỏi stacking context của portrait |

Giữ Cormorant Garamond và Plus Jakarta Sans. Italic serif làm điểm nhấn, không thêm script font.

### 2.3. Bộ nội dung nền và Content Review

**Mục X của `note4.txt` là bộ copy nền đã chọn.** Khi mục V và X khác nhau, lấy mục X; riêng subheading Hero giữ câu được ghi trong mục V. Đối chiếu với `celebration-content.ts` hiện tại để giữ các chỉnh sửa local có chủ đích; không thay toàn file bằng một bản mẫu.

| Thành phần | Nội dung chốt |
|---|---|
| Intro title | “Anh có một điều muốn dành cho vợ iu…” |
| Intro CTA | “Vợ iu mở quà nhé ♡” |
| Hero eyebrow | “17.10.2026 · Ngày đặc biệt của vợ iu” |
| Hero title | “Vợ iu tốt nghiệp rồi!” |
| Hero subheading | “Một cột mốc thật đẹp của Nguyễn Võ Mai Khuê.” |
| Hero CTA | “Cùng anh xem tiếp nha” |
| Hero scroll hint | “Kéo xuống một chút nữa nha, vợ iu.” |
| Invitation title | “Ngày của vợ iu” |
| Message title | “Anh tự hào về vợ iu nhiều lắm” |
| Gallery title | “34 khoảnh khắc anh muốn ngắm mãi” |
| Gallery instruction | “Chạm vào một bức ảnh để ngắm vợ iu rõ hơn nhé.” |
| Letter title | “Gửi vợ iu của anh” |
| Closing title | “Vợ iu ơi, hành trình đẹp nhất vẫn còn ở phía trước” |
| Closing highlight | “Anh thương vợ iu. Nhiều lắm.” |

Body, lead, bốn đoạn thư, invitation note và các CTA còn lại lấy mục X làm bản xuất phát. Ở Content Review, có thể đề xuất chỉnh nhẹ để giảm lặp hoặc câu gượng; ghi rõ **trước → sau → lý do**, chờ bạn duyệt trước khi áp dụng phần khác với bộ copy đã chọn. Không thay “em” thành “vợ iu” bằng phép thay từ hàng loạt.

Tiêu chí ngôn ngữ áp dụng cho toàn bộ `note4.txt` và `celebration-content.ts`:

- Xưng hô chủ yếu bằng “vợ iu”, nhưng dùng ngữ cảnh hoặc lược chủ ngữ khi câu đã rõ; không nhồi lại cách gọi này trong từng mệnh đề.
- Ngọt ngào, tự nhiên khi đọc thành tiếng; tránh chuỗi lời hứa/câu sáo rỗng hoặc quá nhiều tính từ khiến giọng văn mất riêng tư.
- Không tự thêm chuyến đi, cuộc hẹn, câu nói, thời gian yêu nhau hoặc kỷ niệm chưa được cung cấp.
- Không cắt lời chúc chỉ để ép vừa một viewport. Ưu tiên natural height, line length và spacing trước khi đề xuất đổi câu.
- Giữ chính xác **Nguyễn Võ Mai Khuê · Cử nhân Luật · Đại học Tôn Đức Thắng · 17/10/2026 · Quân iu**; thiệp hiển thị “17 tháng 10 năm 2026”. Không thêm số điện thoại.
- Rà soát nhịp giữa các section: Hero chào mừng, Message ghi nhận nỗ lực, Letter tâm tình, Closing kết lại; không lặp nguyên ý quá nhiều lần.

Chữ ký giữ hai dòng:

```text
Thương vợ iu rất nhiều,
Quân iu
```

Footer thư dùng `white-space: pre-line`.

Caption tiếp tục là map theo ID. Giữ nhóm ID hiện có `1, 5, 9, 14, 18, 23, 29, 34`, chọn lời chung phù hợp trong danh sách mẫu; các ảnh khác không bắt buộc có caption. Không thêm kỷ niệm cụ thể.

Bảng copy đã duyệt và preview typography là đầu ra của Phase 6. Final Creative Review sau Phase 7 sẽ đọc lại toàn hành trình, không chỉ kiểm tra từng chuỗi text tách rời.

---

## 3. Kiến trúc animation, scroll và gallery

### 3.1. Cấu trúc triển khai

Tái sử dụng Hero và Invitation hiện có, bổ sung:

- `GraduationPortraitComponent`: chịu trách nhiệm `<picture>`, PNG/ảnh nguồn fallback, kích thước, alt và asset error.
- `OpeningStoryDirective`: gắn vào wrapper chung Hero–Invitation, sở hữu entrance timeline và ScrollTrigger không pin; CSS quyết định sticky/normal flow.
- Utility thuần cho profile responsive, thông số storyboard, quyết định auto-alignment và phép chiếu gallery, phục vụ unit test.

App tiếp tục điều phối Intro, audio, hash navigation, Lightbox và section tracking. Gallery giữ controller riêng; ScrollTrigger không ghi transform lên card gallery.

Các interface bổ sung:

- `HeroContent`: `subheading`, `scrollHint`, `portraitSrc`, `portraitFallback`, `portraitSrcSet`, `portraitAlt`, `portraitWidth`, `portraitHeight`.
- `GalleryContent`: `instruction`.
- `ClosingContent`: `finalHighlight`.
- Directive nhận trạng thái `enabled`, `suspended` và `replayToken`; phát trạng thái vùng chuyển cảnh đang hoạt động cho scroll coordinator.
- `OpeningStoryState`: profile, readiness, suspended và story-active; chỉ phát khi trạng thái đổi, không phát progress mỗi frame vào Angular.
- `SectionMetrics`: ID, vị trí trong document, chiều cao nội dung và trạng thái short/long theo vùng nhìn thực tế.
- `AlignmentDecision`: target hoặc `null`, kèm reason để test quyết định không settle trong story, nội dung dài, modal hoặc gesture.
- Gallery thông báo trạng thái tương tác bắt đầu/kết thúc cho coordinator; không đưa motion position mỗi frame lên App.

Mỗi phần tử chỉ có một bên điều khiển transform:

- GSAP điều khiển các wrapper portrait/typography/transition.
- Gallery RAF điều khiển card gallery.
- CSS điều khiển bố cục và các hiệu ứng trang trí độc lập.

### 3.2. Entrance khi mở quà

Entrance chỉ bắt đầu sau khi người xem mở Intro hoặc đi vào Hero trong session đã bỏ qua Intro.

| Thời gian | Hành vi |
|---|---|
| 0–350ms | Nền và halo hiện nhẹ |
| 100–600ms | Eyebrow, heading theo từng dòng; translateY tối đa 18px |
| 180–850ms | Portrait hiện từ opacity 0, scale 0,98 và translateY 24px |
| 450–950ms | Lead, CTA và ornament xuất hiện |

Dùng easing mềm, không bounce; toàn bộ khoảng một giây.

Entrance và scroll motion dùng wrapper khác nhau. Nếu người dùng cuộn ngay khi mở quà, hoàn tất entrance rồi ưu tiên vị trí tương ứng với scroll, tránh hai timeline tranh chấp.

Audio vẫn được gọi **đồng bộ trong click mở quà**, trước animation. Replay chỉ khởi động lại phần hình ảnh, không reset nhạc.

### 3.3. Storyboard Hero → Invitation

#### So sánh và quyết định kiến trúc

| Phương án | Lợi ích | Rủi ro chính | Quyết định |
|---|---|---|---|
| CSS `position: sticky` + ScrollTrigger chỉ scrub | Bố cục/giới hạn giữ ảnh do CSS quản lý; không có pin-spacer; anchor dựa trên section normal flow; rời wrapper tự kết thúc sticky | Ancestor có overflow/containment hoặc grid stretch có thể làm sticky sai; vẫn cần kiểm tra viewport thấp và chiều cao thực | **Chọn cho desktop đủ điều kiện** |
| ScrollTrigger pin mặc định, có spacing | GSAP quản lý thời gian pin và khoảng bù; hợp với một scene riêng cần scroll runway | Spacer làm thay đổi scroll height/anchor; refresh và restoration cần tính cả spacing; không phù hợp mục tiêu hai chapter nối nhau mà không thêm khoảng cuộn | Không chọn cho đợt này |
| Pinned stage với `pinSpacing: false`, tự quản spacing | Kiểm soát overlap có chủ đích nếu có wrapper/runway đo chính xác | Section sau có thể trượt dưới pin; phải tự chịu trách nhiệm toàn bộ scroll height, overlap, reverse, resize và hash; đặc biệt rủi ro trên Safari | **Loại khỏi phương án triển khai mặc định** |

GSAP mặc định bù khoảng trống cho pin; bỏ spacing không tự chứng minh rằng layout vẫn đúng. Sticky cũng phụ thuộc ancestor có cơ chế scroll, không chỉ viewport. Đây là lý do chọn layout CSS rõ ràng thay vì giữ `pinSpacing: false` của bản trước. Tham chiếu: [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [MDN position](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position).

**Quyết định cuối:** giữ riêng portrait bằng CSS sticky, **không dùng ScrollTrigger `pin`, `pinSpacing` hoặc `snap`**. Không pin toàn trang, không thêm một màn hình cuộn trống. Nếu sticky không đạt điều kiện hình học hoặc không ổn định trong browser QA, chuyển normal flow, không âm thầm thay bằng pin không spacing.

#### Hợp đồng layout và transform

- Wrapper `opening-story` dùng grid để chồng một portrait track lên hai chapter Hero–Invitation. Hero và Invitation vẫn ở normal flow, có ID thật và thứ tự đọc đúng.
- Tổng chiều cao wrapper được tạo bởi nội dung Hero + Invitation; portrait track phủ hai hàng grid, không cộng thêm một bản chiều cao của hai chapter và không có JS spacer.
- Sticky stage nằm trong track, không bị grid stretch; `top: 0`, chiều cao vừa viewport khả dụng. Safe-area được chừa bên trong stage. Track phải cao hơn stage để có khoảng sticky thực sự.
- Hero dành sẵn cột/vùng cho portrait và khai báo tỷ lệ ảnh; không dùng ảnh absolute làm nguồn chiều cao duy nhất của Hero.
- Không đặt overflow `hidden/auto/scroll`, transform hoặc paint containment không cần thiết trên ancestor của sticky. Mask/crop thuộc wrapper ảnh, không áp dụng lên toàn opening story; không dùng root overflow để giấu lỗi bố cục ngang.
- Stage sticky không bị GSAP transform. Bên trong có wrapper entrance và wrapper scroll-motion riêng, mỗi transform chỉ có một owner.
- Portrait track không nhận pointer; nội dung đọc được, CTA và Invitation có layer cao hơn. Track kết thúc trong opening story, không phủ lên Message/Gallery/Letter/Closing.
- ScrollTrigger chạy từ `home: top top` đến `invitation: top top`, `scrub: 0.45`; chỉ animate các lớp bên trong. Đo các anchor normal-flow, không đo text đã translate để tính scroll range.
- Điều kiện trước khi bật: width ≥1024px, height ≥700px, fine pointer + hover, không coarse-pointer profile, không reduced motion, portrait và nội dung thực tế vừa bố cục đã đo. Width lớn không tự biến iPad thành desktop.

**Layout gate:** khởi tạo/refresh/destroy ScrollTrigger không được sinh spacer hoặc đổi scroll height ngoài các thay đổi layout hợp lệ do font/asset đã khai báo kích thước. Đo trước/sau và kiểm tra anchor `#invitation`; không coi ảnh đẹp tại đầu Hero là đủ.

Gọi `p` là tiến trình chuẩn hóa từ 0 đến 1:

| Tiến trình | Portrait | Chữ và thiệp |
|---|---|---|
| `0–0.15` | Giữ ảnh rõ, scale 1; bắt đầu dịch nhẹ | Hero còn đầy đủ, nền gần như đứng yên |
| `0.15–0.45` | Dịch phải tối đa 3vw, xuống 4svh, scale về 0,94 | Chữ trang trí trôi chậm, Hero text giảm opacity |
| `0.45–0.75` | Dịch phải tới 6vw, xuống 8svh, scale về 0,86 | Invitation vào viewport, card tiến nhẹ từ phía sau; nền chuyển blush/peach |
| `0.75–1` | Opacity về 0, scale dừng tại 0,84 | Invitation trở thành trọng tâm, toàn bộ thông tin đọc được |
| Sau `1` | Portrait không nhận pointer/focus và không che section sau | Message, Gallery, Letter, Closing giữ không gian riêng |

Các giá trị `vw/svh/scale` trên là thông số khởi đầu, không phải quyền đẩy ảnh ra ngoài màn hình. Clamp quỹ đạo theo vùng ảnh và viewport thực tế; ưu tiên giữ đầu/mũ/tua và chữ rõ trước độ dịch chuyển.

Cuộn ngược đảo ngược timeline liên tục; CSS sticky giữ đúng giới hạn của cùng wrapper. Không reparent portrait, không đặt lại ảnh về trạng thái đầu bằng timer, không thêm/bớt khoảng bù khi đổi hướng. Khi jump bằng anchor hoặc restoration, đồng bộ ngay progress với vị trí đích; không chạy entrance Hero ngoài màn hình.

### 3.4. Hợp nhất với hệ thống scroll hiện có

#### Một owner duy nhất cho việc tự căn trang

**Native scrolling + scroll coordinator là phương án chính.** Không chuyển sang cơ chế một wheel = một section, không chặn wheel/touchmove, Ctrl+Wheel, pinch zoom hoặc browser shortcut.

- Khi coordinator khởi tạo thành công, root dùng `scroll-snap-type: none` ổn định trong suốt session. Không đổi snap theo từng lần vào/ra Hero; thay đổi snap khi đang cuộn có thể làm browser căn lại ngoài ý muốn.
- CSS `proximity` chỉ là progressive fallback nếu coordinator không khởi tạo được hoặc bị gỡ; không chạy cùng JS settlement. Fallback giữ đầy đủ nội dung/anchor nhưng không được quảng bá là đã đạt auto-alignment cinematic.
- ScrollTrigger chỉ đọc progress, không tự thay scroll position. Không dùng `ScrollTrigger.snap`.
- Thứ tự ưu tiên: modal/Intro lock → restoration/explicit navigation → story transition → gesture đang diễn ra → một lần settling → idle. Lệnh navigation mới thay thế lệnh cũ; không xếp hàng nhiều animation scroll.
- Không passive-settle trong range Hero–Invitation. Dừng ở giữa **một chuyển cảnh có chủ đích** là hợp lệ, khác với để kẹt giữa hai chapter ngắn độc lập.
- Khi reduced motion hoặc pinch zoom (`visualViewport.scale` khác 1), tắt passive auto-settle. Navigation chủ động vẫn hoạt động, dùng instant khi reduced motion; không ép scroll về đầu sau khi zoom.

#### Xác định thời điểm cuộn thật sự kết thúc

1. Ưu tiên `document.scrollend` khi có hỗ trợ. Sự kiện được dùng cho cả native scroll và kết thúc một lệnh navigation; không giả định timeout cố định là thời lượng smooth scroll.
2. Fallback: không còn scroll/input trong ít nhất **180ms desktop / 240ms touch**, rồi xác nhận **4 frame liên tiếp ổn định** trong sai số 1 CSS px. Có safety timeout cho lệnh bị treo nhưng timeout không tự chứng minh đã đến đích.
3. Không settle khi pointer/touch/key cuộn còn giữ, momentum còn đổi vị trí, đang pinch, Gallery drag hoặc Intro/Lightbox đang mở. Listener quan sát touch dùng passive, không `preventDefault()` trên `touchmove`.
4. Khi hoàn tất programmatic scroll, chỉ unlock target và đồng bộ metrics/active section; không khởi động thêm một lượt settlement cho chính lệnh vừa xong.
5. Mỗi đợt input được phép tối đa một correction. Wheel/touch/keyboard mới hủy correction đang chạy tại vị trí hiện tại; người dùng không bị bắt chờ animation kết thúc.

Khác biệt hỗ trợ cần feature detection và QA fallback, không dựa vào tên browser. Tham chiếu: [MDN scrollend](https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollend_event), [MDN scroll-snap-type](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type).

#### Quy tắc auto-alignment có thể unit test

- Gọi `H` là chiều cao vùng nhìn khả dụng đã trừ vùng fixed/safe-area cần tránh. Section là **short** chỉ khi toàn bộ nội dung, padding và control vừa `H + 8px`; không dùng ngưỡng 1,12H để tuyên bố một nội dung bị cắt là “short”.
- Chỉ xét hai chapter **liền kề đều short**, điểm dừng nằm giữa hai anchor `A < B`, khoảng cách `B - A ≤ 1,12H`, và vùng này không thuộc opening story. Không bỏ qua section dài để tìm một section ngắn ở xa.
- Đặt `p = (scrollY - A) / (B - A)` sau khi đã tính anchor offset thống nhất:

| Input/hướng gần nhất | Target sau khi scroll đã kết thúc |
|---|---|
| Desktop đi xuống | `B` nếu `p ≥ 0,35`, ngược lại `A` |
| Desktop đi lên | `A` nếu `p ≤ 0,65`, ngược lại `B` |
| Touch hoặc không rõ hướng | Anchor gần nhất, ngưỡng `p = 0,5`; đúng giữa thì dùng hướng gần nhất |

- Nếu sai số tới target ≤4 CSS px thì không phát lệnh mới. Không dựa vào chiều quay con lăn đơn lẻ để quyết định, mà dùng hướng dịch chuyển scroll gần nhất đã ổn định.
- Với section dài hoặc ranh giới short–long, giữ native reading position; đặc biệt không tự kéo người đang đọc Letter về đầu. Đây là ngoại lệ có chủ đích đối với yêu cầu không dừng nửa section.
- Touch chỉ correction sau khi momentum kết thúc; không can thiệp đang vuốt. Nếu Safari/device evidence cho thấy correction gây cảm giác bật ngược, giữ native touch cho profile đó, báo rõ tiêu chí cinematic chưa đạt và chờ review trước khi thay thông số.
- Dùng native smooth scroll, không hứa thời lượng cố định giữa mọi browser. Explicit Navigator/CTA dùng `scrollIntoView({ behavior: 'smooth', block: 'start' })` qua coordinator; reduced motion dùng instant. Anchor margin/padding dùng cùng một nguồn offset, tránh cộng safe-area hai lần.

#### Active section, history và restoration

- Giữ IDs `home`, `invitation`, `message`, `memories`, `letter`, `closing`. Active chapter dựa trên narrative line **42% vùng nhìn**, dữ liệu của toàn bộ section, hysteresis **64px**, không chỉ các `entries` của một callback IntersectionObserver.
- Khi explicit navigation/settling diễn ra, giữ active target đến completion hoặc cancellation; observer không tranh quyền. Sau đó xác định lại chapter tại vị trí thực tế.
- Một click Navigator/CTA tạo tối đa một history entry. Passive scroll/settlement không đổi hash hoặc sinh entry mới. Click được xử lý không kích hoạt thêm native anchor scroll; không chặn modified-click mặc định của link.
- Lưu reading position của entry hiện tại bằng `replaceState`, merge với history state đã có. Trong vòng đời coordinator dùng `history.scrollRestoration = 'manual'`, khi destroy trả lại giá trị trước đó; không đồng thời để browser và App cùng restoration.
- `popstate` ưu tiên scroll position đã lưu; nếu chưa có mới dùng hash target. Deduplicate `popstate`/`hashchange` để một điều hướng không chạy hai lần. Hash được nhập trực tiếp cũng qua coordinator.
- Refresh `#invitation`/`#memories`: chờ section metrics sẵn sàng, scroll đúng anchor rồi cập nhật story progress. Không buộc xem Hero entrance hay kéo về home. Nếu Intro cần hiện, giữ pending target và đến đúng đích sau khi mở quà.
- Intro/Lightbox: lưu vị trí, khóa body theo cơ chế hiện có, suspend story/gallery/settlement. Unlock khôi phục style và reading position trước, rồi cập nhật metrics/trigger; không settle lại chỉ vì đóng modal.
- Replay dùng `replaceState` về `#home`, tăng `replayToken`, chuẩn bị Intro/entrance; không reset audio và không thêm chuỗi history entries phụ.
- Orientation/layout resize: lưu chapter + offset đọc trong chapter, đổi profile/đo lại một lượt sau khi ổn định; giữ logical position gallery. Không reset tất cả về ảnh/section đầu.
- Safari toolbar thay đổi: cập nhật vùng nhìn và bounds, không rebuild timeline hoặc auto-settle nếu không có một user scroll mới. Không resize section liên tục theo visual viewport trong một gesture.

Timeline tạo ngoài Angular, truy vấn DOM trong phạm vi directive. Dùng GSAP context/matchMedia để cleanup khi destroy hoặc đổi profile; không xóa trigger của component khác. Refresh sau portrait decode, font sẵn sàng và layout/orientation thay đổi thực sự; gộp các yêu cầu refresh thay vì gọi mỗi frame.

#### Acceptance gate cho section alignment

- Tại các cặp short đủ điều kiện, thử dừng ở 25/50/75% khoảng anchor, cả cuộn lên và xuống: kết thúc tại target theo bảng, sai số ≤4 CSS px, tối đa một correction.
- Không tự nhảy qua một chapter chưa đọc, không mắc kẹt khi đảo hướng hoặc dùng trackpad; input mới có hiệu lực ngay, Ctrl+Wheel/pinch/zoom không bị chặn.
- Dừng giữa Letter dài ở ít nhất ba reading positions: giữ vị trí khi không có input, đọc hết nội dung và đi tiếp/lùi được tự nhiên.
- Dừng giữa Hero story không bị kéo về một section khác; không có root snap và JS/ScrollTrigger cùng sửa scroll position.
- Horizontal Gallery swipe không sinh page settlement; vertical swipe bắt đầu trong gallery vẫn cuộn trang. Không đổi chapter trong khi pointer capture đang điều khiển rail.
- Back/forward, refresh hash, replay, Intro/Lightbox và cuộn ngược đều đúng; đóng modal sai số scroll ≤4 CSS px nếu layout không đổi.
- Không bị kẹt dưới sticky khi scroll ngược; khởi tạo/refresh trigger không làm anchor nhảy hoặc sinh scroll height thừa.
- Cần video iPhone/iPad cho touch momentum và dynamic toolbar. Emulation chỉ xác minh phần tương ứng, không đủ kết luận Safari thật đạt.

### 3.5. Responsive

| Profile | Portrait và layout | Scroll motion | Gallery |
|---|---|---|---|
| Desktop ≥1024px, fine + hover, cao ≥700px và bố cục vừa thực tế | Chữ trái, ảnh phải | CSS sticky portrait; ScrollTrigger scrub không pin | 7 card chính, tối đa 11 DOM |
| iPad portrait 820×1180 | Typography phía trên, ảnh lệch phải nhẹ phía dưới; dành đủ chỗ cho lead | Native flow, scrub nhẹ, không sticky/pin | 5 card chính |
| iPad landscape 1180×820 | Hai cột, ảnh giảm chiều cao; CTA rõ | Native flow, x/y nhẹ và scale tối thiểu 0,92 | 7 card chính, scene giới hạn theo chiều cao |
| iPhone 393×852 | Heading → portrait giữa → lead/CTA; chiều cao tự nhiên | Không sticky/pin; translate tối đa 24px, scale tối thiểu 0,98 | 3 card chính |
| Landscape thấp, text zoom lớn hoặc nội dung không vừa | Nội dung tự tăng chiều cao | Normal flow, giảm/bỏ parallax | Profile theo cả chiều cao và pointer |
| Reduced motion, ScrollTrigger không khởi tạo được hoặc fallback ảnh nguồn | Nội dung/portrait đọc được ngay | Normal flow, không phụ thuộc timeline để hiện nội dung | Controls/keyboard/touch và Lightbox vẫn hoạt động; reduced motion tắt autoplay/inertia |

Dùng `svh` cho bố cục touch ổn định và safe-area cho fixed UI; desktop lấy viewport layout phù hợp, đo lại khi resize thực sự. Không ép tất cả nội dung vào một viewport. Portrait, close button và Gallery bounds xét visual viewport riêng mà không biến mọi thay đổi toolbar thành thay đổi chiều cao chapter.

Reduced motion hiển thị portrait và toàn bộ copy ngay; bỏ sticky storytelling, scrub, parallax, passive settlement, autoplay/inertia, vẫn giữ gallery navigation và Lightbox. Thay đổi preference trong lúc trang đang mở phải cleanup animation và giữ reading/logical position, không chỉ đọc media query một lần lúc khởi tạo.

### 3.6. Gallery “3D Memory Orbit”

Giữ geometry rail và virtualization đang có; sửa các điểm kỹ thuật đã audit trước khi tinh chỉnh visual. Không xem việc tăng scale, radius, translateZ hoặc shadow là bằng chứng đã đạt chất lượng 3D. Geometry chỉ cần điều chỉnh thêm nếu screenshot/video cho thấy near–mid–far chưa rõ, card che nhau hoặc bị cắt.

**Rendering và lifecycle**

- Scene có `inline-size: 100%` cùng `max-inline-size` hiện tại.
- Tách scene width phục vụ geometry khỏi viewport height/orientation phục vụ profile.
- Một RAF quản lý position, tốc độ, hover và inertia.
- Hard-stop chung cho destroyed, hidden tab, suspended và offscreen; reduced motion không chạy autoplay/inertia.
- Frame đầu chỉ vẽ trạng thái hiện tại, không đẩy hover progress thẳng tới đích.
- Cập nhật Angular khi virtual window, active photo hoặc tập card tương tác thay đổi; không mỗi frame.
- `will-change` chỉ bật trong lúc card thực sự chuyển động.
- Không đọc layout của từng card trong RAF. Cache kích thước/ma trận từ resize, scroll được gộp và thời điểm bắt đầu interaction; phân tách measurement phase với style-write phase.
- Giữ `perspective` ở scene và `preserve-3d` ở đúng chuỗi wrapper. Không đặt opacity/filter/mask lên ancestor làm phẳng toàn bộ stage; hiệu ứng dim áp dụng lên lớp media thích hợp. Không dùng `z-index` thủ công để giả depth hoặc che lỗi transform hierarchy.

#### Transform hierarchy và hover trong camera space

```text
scene (perspective)
└── stage-camera (yaw/pitch)
    └── card-rail (vị trí + hướng gốc trên quỹ đạo)
        └── hover-presentation (pose nổi ra trước camera)
            └── image / caption / material
```

- Chuyển động quỹ đạo và hover là hai lớp khác nhau, nhưng **cùng RAF controller** tính toán; không có CSS transform transition hoặc tween độc lập cùng ghi vào một lớp.
- Tính pose mục tiêu trong camera space rồi chuyển về local bằng nghịch đảo chuỗi transform cha, kể cả rail rotation và transform origin. Không chỉ bù stage yaw hoặc đặt local yaw về 0.
- Khái niệm tính toán: biểu diễn `M_parent` (chuỗi transform đến card-rail) và `M_target_camera` trong cùng hệ tọa độ camera **trước phép chiếu**, rồi tính `M_hover_target_local = inverse(M_parent) × M_target_camera`. Perspective projection chỉ dùng tiếp để kiểm tra bounds, không đưa ma trận chiếu vào pose local. Nội suy translation/scale và orientation đã tách thành phần; không trộn từng phần tử ma trận gây shear.
- Khi đã nổi hoàn toàn, hướng card gần chính diện camera, mục tiêu net yaw/pitch trong khoảng ±5° khi bounds cho phép. Scale đồng đều, không skew ảnh hay thay tỷ lệ khuôn mặt.

**Trình tự hover**

- Giảm tốc về 0 trong khoảng 180–240ms.
- Ảnh chuyển pose trong khoảng 320–420ms: rời rail, tiến khởi điểm khoảng 160px theo hướng camera và scale tối đa khoảng 1,12. Đây là giới hạn khởi đầu cần visual tuning, không phải trị số bắt buộc áp dụng cho mọi card/viewport.
- Media khi được chọn phải hiện đủ ảnh thumbnail, ưu tiên `contain` trong vùng trình bày; không crop thêm mặt/mũ để lấp đầy khung hover. Click mới tải/xem original qua Lightbox.
- Shadow/ánh sáng thay đổi nhẹ; caption xuất hiện nếu có. Không tạo một modal thứ hai chỉ bằng hover.
- Rail và lớp hình ảnh nâng lên được tách về transform; chỉ mặt ảnh thật nhận pointer, không giữ hit plane vô hình ở vị trí cũ làm chặn ảnh kề. Bàn giao bằng chuyển động pointer thật với intent ngắn, bỏ qua pointerout chỉ do layout thay đổi. Test cả pointer đi qua khoảng trống, không chỉ đứng yên ở tâm.
- Khi chuyển hover nhanh, lấy pose hiện tại làm điểm bắt đầu, không reset về pose cũ. Rời hover trả đúng pose theo logical position đang giữ rồi resume mềm, không quay về ảnh đầu.

**Viewport fitting bắt buộc**

1. Xác định safe rect = phần giao giữa scene có thể nhìn thấy và visual viewport, trừ safe-area + ít nhất 16px lề.
2. Chiếu bốn góc card mục tiêu qua camera/perspective; tính cả biên card và vùng caption/control cần nhìn thấy.
3. Nếu vượt bounds, giảm lift/scale rồi dịch pose theo camera-space trong phạm vi an toàn; không chỉ tăng `overflow: visible` để coi như đã giải quyết clipping.
4. Nếu không còn đủ chỗ, chỉ highlight nhẹ và giữ click mở Lightbox; không tự scroll trang để nhét ảnh hover vào màn hình.
5. Đo lại khi resize/orientation/visual viewport thay đổi, không đọc `getBoundingClientRect()` cho từng card mỗi frame.

**Card lân cận nhường không gian**

- Neighbor cấp 1 dịch ra ngoài khoảng tối đa 24px; cấp 2 tối đa 12px trong camera space, thêm lùi depth rất nhẹ và dim vừa phải.
- Offset được clamp theo safe rect để không đẩy ảnh bên cạnh ra ngoài viewport. Nếu không đủ chỗ thì giảm offset, không ép đủ 24/12px.
- Phải thấy chuyển động nhường không gian trong video, không chỉ giảm opacity rồi coi là hoàn thành.
- Không đổi thứ tự, `logicalIndex`, ảnh bên trong card hoặc vị trí rail gốc. Tất cả offset trở về 0 khi kết thúc hover.

#### Auto motion và loop

- Giữ một continuous logical position, virtual window cập nhật khi vượt ranh giới, không phân trang và không dựng lại toàn bộ DOM mỗi frame.
- Tốc độ khởi đầu: **0,075 ảnh/giây desktop** (~7 phút 33 giây/vòng 34 ảnh), **0,05 ảnh/giây touch** (~11 phút 20 giây/vòng), không tính thời gian pause. Chỉ thay sau review video nếu cảm giác quá chậm/nhanh.
- Card phải đi qua near/mid/far với orientation, perspective size và depth thay đổi liên tục; không chỉ trượt ngang một hàng ảnh cùng độ sâu.
- Ranh giới 34→1 và chiều ngược giữ liên tục cùng rail; normalize theo bội số 34 không đổi hình học tương đối hoặc thay ảnh trên card đang thấy.
- Hard-stop thắng mọi nhánh inertia/hover khi hidden/offscreen/Intro/Lightbox/destroy. Hover/focus chỉ chạy nốt chuyển tiếp hữu hạn rồi dừng RAF; resume reset timestamp để không có delta lớn tích lũy.
- Reduced motion cho phép controls, drag trực tiếp và Lightbox; không tự quay hoặc inertia. Không che nội dung bằng trạng thái entrance chưa hoàn tất.

#### Touch thiết kế riêng, drag và keyboard

- Giữ ngưỡng 8px và phân xử ngang/dọc.
- Pointer capture, pointercancel và lostpointercapture có cleanup thống nhất.
- Mọi drag vượt ngưỡng đều chặn click sau release, kể cả khi không có inertia.
- Vận tốc release loại bỏ sample cũ sau thời gian giữ chuột đứng yên.
- Pointer capture đặt trên phần tử cũng nhận move/up/cancel, chỉ bắt đầu sau khi xác định drag ngang. Vertical swipe vẫn để browser cuộn trang; không `touch-action: none` trên toàn gallery.
- Touch không mô phỏng hover-lift và không yêu cầu lần tap thứ hai: **tap card phía trước có thể tương tác mở Lightbox; swipe chỉ duyệt rail**. Card buffer không vô tình thành điểm mở ảnh ngoài vùng nhìn.
- iPhone có 3 card chính, iPad portrait 5 và landscape 7; điều chỉnh khoảng cách/kích thước theo chiều cao thực để mặt/mũ ảnh chính không bị card khác che. Không suy ra hover từ độ rộng màn hình.
- Trong khi drag, autoplay nhường hoàn toàn; release chỉ có inertia giới hạn trong cùng controller, sau đó resume phù hợp. Xoay thiết bị không reset logical position.
- Arrow điều hướng, Enter/Space mở đúng card đang focus; tránh xử lý phím hai lần khi event nổi lên từ button.
- Giữ quyết định hiện tại là không có dãy nút điều khiển gallery; bổ sung instruction và trạng thái hỗ trợ screen reader.
- Focus trong gallery tạm dừng chuyển động; Lightbox đóng trả đúng focus và vị trí.

#### Gallery Visual Acceptance Gate

- Screenshot phải cho thấy camera nhìn chéo và ít nhất ba mức **near/mid/far** rõ; desktop có ít nhất 7 thumbnail thật nhìn thấy, không khung trống hoặc silhouette quạt đối xứng phẳng.
- Hover trái/giữa/phải đều thấy ảnh rời rail, quay gần chính diện, nằm trong safe rect; mặt/mũ và nội dung ảnh không bị méo/cắt. Các card còn lại nhường chỗ mềm mại, không biến mất hàng loạt.
- Chuyển hover liên tiếp và rời hover không flicker, rung, snap scale hoặc đổi ảnh bất ngờ; card về đúng rail, motion tiếp từ vị trí cũ.
- Auto motion thể hiện quá trình gần–xa; loop đủ 34 ID không blank, không jump tại 34→1 và chiều ngược.
- Touch không cần hover; swipe ngang không mở nhầm ảnh, vuốt dọc không mắc kẹt, tap mở đúng original. Đóng Lightbox giữ scroll, focus và logical position.
- Trong runtime, các thumbnail chính đã tải có `complete === true`, `naturalWidth > 0`; không lỗi console. Buffer lazy-load được kiểm tra khi tiến vào vùng chính.

**Bằng chứng bắt buộc trước/sau:** cùng viewport và cùng logical position; screenshot idle, hover trái/giữa/phải, Lightbox; video 30–60 giây ở tốc độ production có pause/resume và drag. Ghi nhận ở 5/15/30 giây để thấy chuyển động, không chỉ chụp hai trạng thái tĩnh.

Ngoài video ngắn, phải có recording/log quan sát **một vòng desktop đủ 34 ảnh ở tốc độ thật** và clip kiểm tra seam hai chiều; test tăng tốc/đặt position sát 33,95→34,05 chỉ là bổ sung. Touch có recording iPhone và iPad portrait/landscape, kèm browser/device label. **Build xanh và unit tests không thay thế gate này.**

---

## 4. Phases và các điểm review

### 4.1. Phạm vi file và nguyên tắc bảo toàn

`PLAN1.md` là tài liệu điều phối cho đợt **A Love Letter in Motion**; không thay thế toàn bộ `plan.md` lịch sử bằng một kế hoạch khác. Khi implementation được cho phép, cập nhật trạng thái/evidence vào tài liệu này; README chỉ cập nhật hướng dẫn thực tế sau khi tính năng đã hoàn tất.

| File/nhóm file dự kiến | Mục đích | Giới hạn |
|---|---|---|
| `src/app/app.ts`, `app.html`, `app.css`, `src/styles.css` | Wrapper Hero–Invitation, scroll coordinator, active tracking, hash/history, responsive/snap ownership | Giữ sáu section ID và audio/Lightbox integration; không thay toàn bộ design system |
| `src/app/components/graduation-portrait/*` mới | Cutout, picture/srcset, layout và error fallback | Chỉ dùng ảnh nguồn số 1 và asset đã duyệt |
| `src/app/directives/opening-story.directive.ts` mới | Entrance/scrub lifecycle và thông báo story-active | Không pin, không snap, không ghi transform gallery |
| `src/app/utils/opening-story.ts`, `section-alignment.ts` và specs mới nếu chưa có module tương đương | Profile, storyboard và quyết định alignment thuần | Tái sử dụng utility hiện có khi phù hợp; không tạo nhiều controller cạnh tranh |
| `graduation-hero/*`, `graduation-invitation/*` | Editorial layout, vùng portrait, transition trong phạm vi mở đầu | Không đổi dữ liệu tốt nghiệp |
| `interactive-photo-gallery/*`, `utils/gallery-layout.ts` và specs | Camera-space hover, bounds, neighbor offset, lifecycle/interaction regression | Giữ rail/virtualization nếu đạt visual; không thêm WebGL, không tạo lại 34 ảnh |
| `photo-lightbox/*`, `section-navigator/*` | Chỉ sửa lỗi integration, focus, safe-area hoặc responsive đã chứng minh | Giữ original source, circular navigation, focus trap |
| `models/celebration.models.ts`, `data/celebration-content.ts` | Fields mới và copy đã duyệt | Đọc/merge local diff trước mỗi patch; không ghi đè thay đổi của bạn |
| `graduation-message/*`, `graduation-letter/*`, `closing-section/*` | Content fields, signature xuống dòng, spacing/reveal cần thiết | Không làm lại section đang tốt hoặc thêm hiệu ứng ngoài mục tiêu |
| `public/Image/hero/*`, script Sharp riêng khi cần | Asset mới và variants | Không đụng `original/*`, `thumb/*`; không tự chạy script tái sinh toàn bộ gallery |
| `*.spec.ts`, `README.md`, `PLAN1.md` | Regression, hướng dẫn và bằng chứng nghiệm thu | Test kỹ thuật và review trực quan phải có trạng thái riêng |

Package/dependencies, Angular config, branch/remote và workflow giữ nguyên nếu không có lỗi tương thích thực sự; thay đổi ngoài phạm vi phải nêu lý do và xin duyệt. Không tự sửa nhạc, `note4.txt`, ảnh gốc hay các dự án khác. Không commit, push hoặc deploy trong đợt này.

### 4.2. Trình tự triển khai và điều kiện chuyển bước

| Phase | Công việc và file tác động | Kiểm tra, đầu ra và điều kiện chuyển bước |
|---|---|---|
| **1. Audit & baseline** | Đọc lại git diff/source, chốt hash asset, đo layout và ghi baseline trong `PLAN1.md` | Screenshot trước sửa tại các viewport chính, Console/Network và motion recording hiện trạng; baseline kỹ thuật chạy lại khi cần. Runtime/asset P0 phải được xử lý trước phase sau; chưa có browser evidence ghi Pending |
| **2. Portrait asset** | Tách nền từ `1.jpg`; tạo PNG/WebP/variants riêng, chuẩn bị crop/mask desktop/mobile | Gate 2.1: bốn nền, pixel/chi tiết, hash, preview và fallback đề xuất. **DỪNG: bạn duyệt cutout hoặc ảnh nguồn thay thế trước Phase 3** |
| **3. Cinematic Hero** | Hero static nhiều lớp, portrait component, model/data và wrapper App; sau đó entrance | Screenshot desktop/iPhone/iPad, video entrance, keyboard/reduced motion; ảnh không che copy/CTA, không CLS do thiếu kích thước. **DỪNG: bạn duyệt Hero trước Phase 4** |
| **4. Scroll storytelling** | CSS sticky + directive không pin, App coordinator/metrics/history, root snap fallback | Video xuống/lên, bảng alignment 25/50/75%, long Letter, CTA/hash/back/replay/modal, toolbar/rotation. **DỪNG: bạn duyệt chuyển cảnh và auto-alignment trước Phase 5** |
| **5. Gallery polish** | Rendering/lifecycle fix trước; camera-space hover/bounds/neighbors, touch, loop và Lightbox integration sau | Before/after cùng viewport/position; video 30–60 giây, vòng đủ 34 ảnh, seam hai chiều, drag chậm/nhanh, iPhone/iPad. **DỪNG: bạn duyệt gallery trước Phase 6** |
| **6. Content integration** | Hoàn thiện data/models và template/spacing cần thiết; Hero đã dùng copy nền từ Phase 3 | Đọc toàn bộ `note4.txt` và source copy; bảng trước/sau cho mọi chỉnh câu, screenshot typography, chữ ký hai dòng và thư dài. **DỪNG: bạn duyệt copy/nhịp đọc trước Phase 7** |
| **7. E2E visual QA** | Unit/runtime/accessibility/performance, responsive fixes có bằng chứng, docs | Test + production + Pages build đạt, before/after và recording, Console/Network, asset integrity. **DỪNG: bàn giao QA đầy đủ; không tự đánh dấu sản phẩm hoàn tất** |
| **Mốc sau Phase 7: Final Creative Review** | Review tổng thể trải nghiệm, không mặc định thêm tính năng mới | Desktop + iPhone 16 + iPad Gen 10 theo mục 4.3; giảm hiệu ứng cạnh tranh; chạy lại QA phần bị chỉnh. **DỪNG: chờ bạn nghiệm thu cuối** |

Mỗi phase phải ghi: mục tiêu, diff/file đã thay, hành vi trước–sau, test, evidence, rủi ro còn lại và câu hỏi duyệt cụ thể. Bảng trên mô tả trạng thái đích, **không phải danh sách việc đã hoàn thành**.

Không chuyển phase khi còn lỗi visual nghiêm trọng hoặc chưa có phê duyệt ở gate bắt buộc. Nếu thiếu browser automation, phần test có thể thực hiện được vẫn được ghi nhận, nhưng gate trực quan giữ Pending và dừng để nhận evidence/review; không lấy build xanh làm quyền đi tiếp.

### 4.3. Final Creative Review — sau Phase 7

Review nguyên hành trình ở tốc độ sử dụng thật, không chỉ xem ảnh chụp từng section. Đây là mốc **nghiệm thu trải nghiệm**, tách với Final QA kỹ thuật.

| Thành phần | Câu hỏi nghiệm thu |
|---|---|
| Hero portrait | Có đúng Mai Khuê từ ảnh nguồn, silhouette tự nhiên, không thiếu tóc/tua/tay, không gượng ở vùng bàn đã che? |
| Typography layering | Chữ trang trí tạo chiều sâu nhưng H1/họ tên/lời chúc/CTA có đọc rõ ở mọi profile không? |
| Scroll transitions | Giữ ảnh và chuyển thiệp có liền mạch khi xuống/lên; section ngắn tự căn hợp lý, thư dài không bị kéo đi? |
| Invitation | Họ tên, Cử nhân Luật, Đại học Tôn Đức Thắng, ngày 17/10/2026 chính xác, đọc đủ và không bị portrait che? |
| Message | Nhịp chuyển từ chúc mừng sang tự hào có tự nhiên, câu chữ có lặp quá nhiều với Hero/Letter không? |
| 3D Gallery | Quỹ đạo có chiều sâu rõ, hover rời rail thực sự, tốc độ dịu, đủ 34 ảnh, touch và Lightbox dễ dùng? |
| Love Letter | Bốn đoạn dễ đọc, xưng hô tự nhiên, không bịa kỷ niệm, signature hai dòng và không bị hiệu ứng giữ ẩn? |
| Closing | Có điểm kết ấm áp, highlight vừa đủ; CTA Gallery/replay hoạt động mà không reset nhạc hoặc làm rối history? |
| Audio | Bắt đầu từ tương tác khi policy cho phép, không trùng/reset; rejection im lặng an toàn, không có nút nhạc riêng? |
| iPhone 16 | Portrait/landscape, safe-area, toolbar, chữ và thao tác touch thực tế có dễ chịu không? |
| iPad Gen 10 | Portrait/landscape có bố cục riêng hợp lý, không dựa vào hover, xoay máy không mất reading/gallery position? |

**Nguyên tắc giảm hiệu ứng:** mỗi vùng nhìn chỉ có một chuyển động chủ đạo. Khi Hero đang kể chuyện, ornament chỉ làm nền; khi Gallery tương tác, reveal/parallax lân cận không cạnh tranh; Message/Letter sau reveal ưu tiên trạng thái tĩnh để đọc. Nếu cảm giác rối hoặc mệt, giảm số lớp, biên độ hoặc tần suất trước khi nghĩ tới thêm animation.

Content Review được lặp lại ở mức toàn trang: đọc thành tiếng lời chúc trong note và source, kiểm tra “vợ iu” có tự nhiên hay bị lặp, loại câu sáo rỗng bằng đề xuất có duyệt, không đổi thông tin tốt nghiệp. Mọi chỉnh sửa sau QA phải kiểm thử lại vùng ảnh hưởng và cập nhật evidence trước nghiệm thu.

### 4.4. Review khi không có browser automation

Không tuyên bố “đã kiểm tra Safari”, “gallery đã mượt” hoặc “Visual QA Passed” nếu chỉ có source/unit/build.

1. Ghi **Visual QA chưa được xác minh** và chỉ rõ viewport/browser/tình huống đang thiếu.
2. Gửi bạn đường dẫn local và thao tác tái hiện cụ thể; yêu cầu ghi browser/OS, viewport CSS, branch/commit cùng local diff nếu chưa commit, URL/hash và trạng thái reduced motion.
3. Nhờ cung cấp screenshot trước/sau cùng viewport và vị trí: Hero, Invitation, Gallery idle + hover/touch, Letter, Lightbox; portrait có bộ preview riêng theo Gate 2.1.
4. Nhờ video 30–60 giây cho cuộn hai chiều/hover/swipe/modal; loop đủ 34 ảnh dùng recording/log riêng. Trên Safari thật cần thêm toolbar hiện/ẩn và xoay iPad, không suy ra từ emulation.
5. Xin Console/Network evidence khi có ảnh trống, audio hoặc runtime error; không yêu cầu gửi thông tin tài khoản hay dữ liệu nhạy cảm không liên quan.
6. Phân tích evidence, ghi lỗi còn lại và sửa trong phase đã được phép; chỉ cập nhật gate sang Approved khi bạn duyệt rõ ràng.

Mẫu nhật ký gate: `Phase | kỹ thuật | visual/browser | evidence | lỗi còn lại | quyết định của bạn | ngày review`. Các gate hiện tại đều **chưa được nghiệm thu implementation**; đồng ý với kế hoạch không đồng nghĩa duyệt trước asset/UI chưa tồn tại.

---

## 5. Kiểm thử, hiệu năng và tiêu chí nghiệm thu

### 5.1. Asset và portrait

- Master có alpha thật, không phải nền caro được vẽ vào ảnh.
- Không mất đỉnh mũ, tua vàng, tóc hoặc bàn tay.
- Đối chiếu ảnh nguồn ở 100–200%; kiểm tra halo trên nền sáng và tối.
- Với PNG ghép từ mask, pixel vùng chủ thể đặc phải lấy từ nguồn; không dùng gương mặt tái tạo.
- Khai báo width/height và aspect-ratio để không gây layout shift.
- Dùng `<picture>` với WebP/srcset và PNG fallback; không tải đồng thời nhiều bản full-size.
- PNG/WebP/crop desktop/mobile phải đi qua Gate 2.1 và có quyết định của bạn; kỹ thuật xuất được alpha không đủ để duyệt chủ thể.
- Nếu cả WebP và PNG cutout lỗi, hiển thị ảnh gốc trong khung editorial, tắt motion không còn phù hợp và vẫn giữ nội dung đọc được. Fallback runtime không thay thế phê duyệt asset trước Phase Hero.

### 5.2. Unit/component regression cần bổ sung

- New content fields đầy đủ; ngày, tên, ngành, trường, chữ ký và 34 photo paths đúng.
- Hero chưa chạy entrance sau lớp Intro; replay tạo đúng một lượt animation.
- Profile đổi theo touch, orientation, chiều cao và reduced motion.
- Storytelling giữ nguyên hash target và scroll position qua modal/replay.
- Alignment: phân loại short từ nội dung thực; bảng hướng/ngưỡng 0,35–0,65–0,5; sai số 4px; cặp không liền kề, section dài, story range, zoom/reduced motion đều không passive-settle.
- Completion/cancellation: scrollend và fallback chỉ settle một lần, không settle trong momentum/touch còn giữ; explicit navigation hoàn tất không tự phát thêm lệnh.
- History: một entry cho click hợp lệ, passive scroll không đổi hash, deduplicate popstate/hashchange, restoration ưu tiên saved position, cleanup trả lại scrollRestoration trước đó.
- Sticky/normal-flow profile: viewport thấp, coarse pointer, portrait fallback, text không vừa và runtime reduced-motion đều hạ cấp an toàn; không sinh pin-spacer.
- Gallery frame đầu không nhảy hover; pause chặn cả inertia.
- Camera-space pose: bù đầy đủ stage + rail orientation, không shear; phép chiếu bốn góc hữu hạn, safe rect giữ ảnh/caption trong bounds, neighbor offset trở về 0.
- Slow drag không mở Lightbox, pointercancel không kẹt state.
- Hover/focus dùng đúng photo index tại ranh giới virtual window.
- Loop `33.95 → 34.05`, chiều ngược và normalize không đổi hình học tương đối.
- Destroy/resize/replay không tích lũy RAF, listener hoặc ScrollTrigger.
- Letter dài vẫn hiện nội dung; signature giữ xuống dòng.
- Audio direct activation vẫn đồng bộ với click mở quà, không duplicate/reset trên replay/scroll, Promise rejection không thành unhandled error.

Các test geometry/DOM chứng minh tính đúng kỹ thuật, **không chứng minh chất lượng cảm nhận 3D, sự tự nhiên của cutout hoặc độ mượt của Safari**.

### 5.3. Visual test matrix và bộ bằng chứng

- Desktop: **1366×768, 1440×900, 1920×1080**.
- iPhone 16: **393×852** và **852×393**.
- iPad Gen 10: **820×1180** và **1180×820**.
- Thêm text zoom 200%, browser zoom/pinch, reduced motion đổi trong runtime và resize trong lúc đang chuyển cảnh.
- Ghi rõ browser/version/OS, CSS viewport, pointer/hover capability, emulation hay máy thật. Không dùng chỉ width để kết luận đã test iPad.

Hành trình nghiệm thu:

1. First visit → mở quà → kiểm tra audio/entrance.
2. Cuộn chậm, nhanh và ngược giữa Hero–Invitation.
3. Đi tiếp Message → Gallery → Lightbox → Letter → Closing.
4. Drag/swipe, focus keyboard, chuyển hover, đóng/mở ảnh nhiều lần.
5. Replay; refresh `#invitation` và `#memories`; back/forward.
6. Tab hidden/resume, xoay iPad, audio bị từ chối và portrait tải lỗi.
7. Dừng giữa hai chapter ngắn ở 25/50/75% theo cả hai hướng; giữ giữa Letter dài; hủy smooth alignment bằng input mới.
8. Safari toolbar hiện/ẩn, visual viewport thay đổi, zoom, cuộn ngược từ Invitation lên Hero; đảm bảo không resnap hoặc tạo khoảng trống sticky.
9. Portrait PNG/WebP trên bốn nền; kiểm tra lại mặt/tóc/tua/tay và vùng mask dưới khi thực sự đặt sau typography.

Screenshot Hero ở trạng thái đầu, các mốc scroll 25/50/75/100%, Gallery idle/hover và Lightbox. Recording phải đủ thấy pause/resume và chuyển cảnh hai chiều.

| Bộ evidence | Nội dung tối thiểu | Gate sử dụng |
|---|---|---|
| Baseline | Cùng viewport, source revision và trạng thái; screenshot các chapter, video scroll/gallery hiện tại | Phase 1, đối chiếu before/after |
| Portrait | Nguồn/cutout, PNG/WebP bốn nền, chi tiết 100–200%, crop desktop/mobile, hash | Phase 2 |
| Hero | Desktop 1366/1440/1920, iPhone và iPad hai hướng; screenshot + entrance/reduced-motion clip | Phase 3 |
| Scroll | Hai chiều, short/long, cancel, hash/back/forward, modal/replay, toolbar/orientation | Phase 4 |
| Gallery | Idle + hover trái/giữa/phải, gần–xa, video production 5/15/30 giây, full-loop 34 ID, seam hai chiều, touch và Lightbox | Phase 5 |
| Content | Copy diff trước/sau/lý do, typography và full Letter/Closing trên mobile | Phase 6 |
| Final | Console/Network/performance, tests/builds, full journey desktop/iPhone/iPad, bảng lỗi còn lại | Phase 7 + Final Creative Review |

Evidence phải tham chiếu được file/link hoặc ảnh/video bạn gửi và bản source được kiểm tra. Không ghi một ô Passed chỉ vì “đã xem code”. Nếu không có recording baseline, nêu rõ thiếu before video; không dựng lại một bản cũ rồi gọi đó là bằng chứng đã thu trước sửa.

Chromium emulation được ghi đúng là mô phỏng. Safari thật cần kiểm tra thiết bị hoặc evidence từ Safari; không đánh dấu Passed chỉ dựa vào kích thước viewport.

### 5.4. Ngân sách hiệu năng

Đây là mục tiêu để đo, chưa phải kết quả đã đạt:

- Initial JS/CSS nằm trong budget 500 KB raw hiện có.
- WebP portrait desktop hướng tới ≤600 KB; mobile ≤250 KB, nhưng không hy sinh tua/tóc để ép dung lượng.
- CLS ≤0,1; LCP hướng tới ≤2,5 giây trên cấu hình đo được ghi rõ. Tách thời gian tải kỹ thuật khỏi thời điểm người dùng bấm mở quà.
- Gallery giữ tối đa 11 card desktop.
- Không có layout read trong RAF gallery; không long task >50ms lặp đều khi tương tác.
- Performance recording desktop hướng tới phần lớn frame nằm trong ngân sách màn hình 60Hz.
- Sau 10 lần replay/modal/resize, số listener, RAF và trigger trở lại mức nền ổn định; memory không tăng liên tục.
- Không preload 34 original; Hero chỉ sử dụng riêng ảnh số 1 và Lightbox preload tối đa hai ảnh kề.

Đo trên cấu hình browser/hardware/throttling được ghi rõ; báo cả frame pacing trong recording, long tasks và thời gian main-thread, không quy toàn bộ độ mượt về FPS trung bình. Asset preload/decode không được làm trễ tương tác mở quà hoặc gây tải tất cả ảnh original.

### 5.5. Rủi ro còn lại và phương án giảm thiểu

| Rủi ro | Cách phát hiện | Xử lý khi không đạt |
|---|---|---|
| Mask làm mất tóc/tua hoặc tái tạo mặt/tay/thân dưới | So nguồn/master ở 100–200%, bốn nền và source-RGB đối chiếu | Không dùng output; chỉnh mask đúng tọa độ hoặc xin duyệt ảnh nguồn editorial; dừng trước Hero |
| Sticky bị ancestor overflow/stretch hoặc nội dung cao làm sai giới hạn | Đo wrapper/stage/scroll height, cuộn hai chiều, deep link | Sửa layout trong scope hoặc normal-flow fallback; không tự chuyển sang pinSpacing false |
| Auto-alignment gây bật ngược trên trackpad/touch | Video momentum, cancellation, bảng short/long và repeated scroll | Điều chỉnh profile trong phase có review; native fallback khi chưa ổn, báo tiêu chí còn Pending |
| Dynamic toolbar/orientation làm sai anchor/bounds | Safari thật, đọc giữa thư, modal và xoay iPad | Stable layout units, coalesced metrics/refresh, giữ reading offset; không tự settle chỉ vì resize |
| Camera hover vẫn nghiêng hoặc cắt ảnh | Projected corners + screenshot/video card hai mép | Sửa hierarchy/bù camera, giảm lift/scale, clamp neighbors; fallback highlight thay vì cắt ảnh |
| CSS 3D khác giữa Chromium và Safari | So cùng profile/position trên hai renderer | Gỡ grouping property làm flatten, giảm compositing layer; cần evidence thật trước kết luận |
| Reveal/scrub/hover cạnh tranh hoặc quá nhiều motion | Full-journey recording + reduced motion | Một transform owner, một điểm nhấn mỗi vùng; giảm hoặc bỏ hiệu ứng phụ |
| RAF/observer/trigger tích lũy sau replay/resize/modal | 10 chu kỳ, profiling, listener/trigger count | Cleanup theo component/context, không global kill; không nghiệm thu khi memory tăng đều |
| Nội dung “vợ iu” lặp gượng hoặc lời chúc tự suy diễn | Đọc toàn bộ note/source và đọc thành tiếng | Đề xuất trước/sau có lý do, chờ Content Review; khóa thông tin cá nhân |
| Ghi đè local edits trong lúc triển khai | Git diff và hash trước/sau từng phase | Patch đúng phần đã duyệt; nếu overlap không thể hợp nhất an toàn thì dừng hỏi, không reset |
| Thiếu browser automation hoặc Safari thật | Không có evidence tương ứng | Ghi Pending, làm theo mục 4.4; không tự chứng nhận Visual QA |

### 5.6. Checklist nghiệm thu cuối cùng

- [ ] Cutout hoặc ảnh nguồn fallback đã được bạn duyệt; không đổi gương mặt, không sinh thêm cơ thể, không mất mũ/tóc/tua/tay.
- [ ] Hero có layering đẹp nhưng lời chúc/CTA vẫn đọc và nhấn được; desktop/mobile/iPad không clipping, không overflow ngang.
- [ ] Sticky chỉ bật đúng profile; không pin-spacer, không dư scroll height, đảo chiều và fallback normal flow ổn định.
- [ ] Scroll xuống/lên tự căn đúng cặp short đủ điều kiện, tối đa một correction, target sai số ≤4px; input mới hủy được.
- [ ] Không snap trap ở Letter/section dài hoặc opening story; root snap, coordinator và ScrollTrigger không cạnh tranh.
- [ ] Active section ổn định; anchor/hash/back/forward/replay, Intro và Lightbox giữ đúng reading position; Gallery swipe không kích hoạt page settlement.
- [ ] Gallery có near/mid/far và camera chéo rõ, không trở lại photo fan; hover rời rail, gần chính diện, trong bounds, neighbor nhường chỗ và return mượt.
- [ ] Có đủ 34 ảnh duyệt liên tục, seam hai chiều không jump; video tốc độ thật và full-loop evidence đầy đủ, không chỉ unit test.
- [ ] Touch phone/tablet độc lập với hover; drag chậm/nhanh không click nhầm, vertical page scroll hoạt động, keyboard/focus và Lightbox dùng được.
- [ ] Copy tự nhiên theo mục 2.3, không lặp máy móc hoặc bịa kỷ niệm; tên/ngành/trường/ngày/người gửi đúng, chữ ký hai dòng.
- [ ] Audio giữ file/cơ chế hiện có, không thêm button, không duplicate/reset; browser từ chối phát vẫn không làm hỏng trang.
- [ ] iPhone 16 và iPad Gen 10 portrait/landscape có evidence rõ; safe-area, toolbar và orientation không làm mất nội dung.
- [ ] Reduced motion không mất nội dung; keyboard, focus-visible/trap, touch target và browser zoom vẫn dùng được.
- [ ] `npm test`, `npm run build`, `npm run build:github-pages` đạt; không Angular/runtime/asset error chưa xử lý.
- [ ] 34 original + 34 thumbnail giữ nguyên hash; asset mới relative và tương thích `/HappyGradSweetie/`; không sửa nhạc/framework/workflow ngoài scope.
- [ ] Performance/cleanup được đo và phân biệt mục tiêu với kết quả; không đổi Angular semantic state mỗi frame nếu không cần.
- [ ] Bạn duyệt từng gate Portrait → Hero → Scroll Storytelling → Gallery → Content → Final QA và **Final Creative Review** sau Phase 7.
- [ ] Báo cáo tách rõ source audit, automated test, Chromium emulation, Safari/device evidence và các mục Pending; không còn Visual QA bắt buộc chưa xác minh khi gọi là hoàn tất.

### 5.7. Phê duyệt và trạng thái sẵn sàng

Các quyết định kỹ thuật dùng để triển khai đã được ghi rõ: CSS sticky + scrub không pin, một scroll coordinator với CSS snap chỉ làm fallback, gate portrait bắt buộc, gallery hover theo camera space/bounds và review sáng tạo cuối cùng.

**Kế hoạch đã sẵn sàng làm tài liệu triển khai theo phase.** Việc lưu/cập nhật tài liệu không phải lệnh bắt đầu code. Chỉ bắt đầu Phase 1 implementation khi bạn yêu cầu ở lượt sau; sau đó vẫn phải dừng ở từng gate để bạn duyệt asset/UI/video thực tế.

Những điểm tiếp tục cần bạn phê duyệt trong quá trình triển khai:

1. Cutout và crop/mask desktop/mobile; hoặc phương án ảnh nguồn nếu segmentation không đạt.
2. Hero tĩnh/entrance và typography layering.
3. Scroll transition hai chiều, auto-alignment và hành vi fallback trên touch/Safari.
4. Gallery near–far, hover/neighbor choreography, tốc độ, touch và loop.
5. Mọi đề xuất chỉnh copy khác mục X của `note4.txt`, cùng nhịp đọc toàn trang.
6. Final QA evidence và Final Creative Review desktop/iPhone/iPad; các thay đổi ngoài scope hoặc fallback làm giảm trải nghiệm phải nêu riêng.

**Trạng thái của lượt cập nhật 11/10/2026:** chỉ sửa `PLAN1.md`. Chưa tạo cutout, chưa chỉnh source ứng dụng, chưa chạy lại test/build cho tính năng chưa tồn tại. Các thay đổi local của bạn được giữ nguyên. Không commit, push hoặc deploy.

### 5.8. Nhật ký thực thi sau khi được yêu cầu implementation

Mục trên ghi lại lượt cập nhật kế hoạch trước đó; bảng này phản ánh tiến độ thực thi mới, không tự đánh dấu các checklist đích đã đạt.

| Phase/gate | Kết quả hiện tại | Evidence / bước tiếp theo |
|---|---|---|
| Phase 1 — baseline | Đọc lại source/diff; 16/16 tests PASS, Pages build PASS; thu 60 screenshot tại 7 viewport và report DOM/network/hash. Không runtime/asset P0 trong lượt đo | [Baseline report](qa/plan1/BASELINE.md). Edge headless/touch emulation, không phải Safari thật. Video liên tục/performance vẫn Pending |
| Phát hiện baseline | Scene gallery width=0 ở cả 7 profile, touch vẫn 11 card; overflow desktop và hover/crop chưa đạt | Giữ trong scope Phase 4/5, không tự sửa trước review Portrait/Hero/Scroll |
| Phase 2 — attempt 1 | Built-in imagegen cutout có alpha nhưng thay đổi scale/vị trí và tái tạo chi tiết; **Rejected** | Không đưa vào public asset |
| Phase 2 — attempt 2 | Mask + RGB nguồn bảo toàn pixel RGB nhưng lệch viền mũ/tay áo/tóc; **Rejected** | [Portrait review](qa/plan1/portrait-review-2026-10-11/REVIEW.md), PNG/WebP và preview bốn nền. Không dùng fade để che lỗi |
| Phase 2 — Canva | Đã được bạn cho phép upload `1.jpg`; Canva tạo media `MAHXspK6hGc`, metadata 1706×2560. File mới `public/Image/original/canva.png` chỉ 533×800, alpha thật nhưng còn mặt bàn. Đã so nguồn và preview bốn nền/chi tiết 200%; **chưa được duyệt** | [Canva review](qa/plan1/portrait-canva-2026-10-11/REVIEW.md), [inspection](qa/plan1/portrait-canva-2026-10-11/received-533x800/inspection.json). 68 baseline assets nguyên hash. Không sửa/xóa file Canva mới; không upload hoặc chạy tách nền lại |
| Phase 2 — PNG bạn cung cấp | Đã nhận `hero/mai-khue-cutout.png`, 1024×1536, alpha thật, đã bỏ bàn. Giữ nguyên master và xuất variants QA 1024/768/480 px (~215/146/69 KB). Alpha full-size WebP giữ nguyên toàn bộ pixel; đã xem PNG/WebP bốn nền và chi tiết 200% | [User portrait review](qa/plan1/portrait-user-2026-10-11-c4024b5c/REVIEW.md). Framing asset bằng Sharp; sau phê duyệt, variants đã copy nguyên hash vào public và tích hợp trong Phase 3 |
| Portrait Quality Gate | **Approved — 11/10/2026**, bạn trả lời “Duyệt bản này, dùng làm Hero” | Chốt master hash `c4024b5c…250011`; đã thông báo khác biệt so với nguồn. Bảo toàn PNG, dùng variants đã kiểm tra; không tuyên bố fidelity RGB với `1.jpg` |
| Phase 3 — Cinematic Hero | **Hero Review Approved — 11/10/2026**: “Duyệt Hero, tiếp tục Phase 4”. 29/29 tests, production + Pages build PASS | [Hero Review](qa/plan1/PHASE3-HERO-REVIEW.md), [runtime evidence](qa/plan1/hero-2026-10-11-final/hero.json). Giữ asset/copy đã duyệt |
| Phase 4 — Scroll Storytelling | **Đã triển khai; chờ Scroll Review — 12/10/2026**. 68/68 tests, production + Pages build PASS; 96/96 alignment cases, sai số lớn nhất 0,5px | [Scroll Review](qa/plan1/PHASE4-SCROLL-REVIEW.md), screenshot/video 7 viewport, [verification + source hashes](qa/plan1/PHASE4-VERIFICATION.json). Modal/focus/replay/touch/history/reduced motion đã kiểm tra Chromium; Safari/device/trackpad thật vẫn Pending |
| Scroll Review | **Approved — 12/10/2026:** “Duyệt Scroll, tiếp tục Gallery” | Bắt đầu Phase 5, không đổi Hero/Scroll đã duyệt; Safari/device evidence vẫn là giới hạn đã công bố |
| Phase 5 — Gallery polish | **Đã triển khai; chờ Gallery Review — 13/10/2026**. 88/88 tests, production + Pages build PASS; 267/267 kiểm chứng evidence đạt; full-loop thật 453,276 giây qua đủ 34 ảnh và logical boundary 34 | [Gallery Review](qa/plan1/PHASE5-GALLERY-REVIEW.md), [verification + source hashes](qa/plan1/PHASE5-VERIFICATION-FINAL.json). 7 viewport Chromium emulation; giữ giới hạn Safari/device Pending, cần bạn duyệt hover/near–far/touch trước Content |
| Phase 6–7 + Final Creative Review | **Chưa bắt đầu** | Chờ Gallery Review trước Content |

Sau phê duyệt Portrait, source được sửa trong phạm vi Phase 3; Hero dùng copy đã chốt ở mục 2.3, các chỉnh sửa local khác được bảo toàn. PNG master, `note4.txt`, 34 originals và 34 thumbnails phải giữ nguyên hash. Lịch sử upload Canva vẫn giữ nguyên; không upload mới, không thêm dependency, không commit/push/deploy. Toàn bộ mục tiêu chưa hoàn tất; Hero/Scroll/Gallery/Content/Final vẫn có các gate riêng.

### 5.9. Ghi nhận Phase 4 — 12/10/2026

- CSS sticky + GSAP scrub không pin, một portrait DOM; không pin-spacer hoặc tăng scroll height trong chuyển cảnh. Touch/low-height/long-content/reduced-motion dùng normal flow.
- Coordinator sở hữu alignment, active chapter, history/restoration và modal suspension. Căn tối đa một lần sau cuộn; click không scroll không gây correction; target lock chỉ nhả khi đến đích (hoặc bị hủy), không dựa vào timeout cố định để tuyên bố hoàn tất.
- Đã sửa trường hợp CDK auto-return focus kéo trang thêm 55px sau đóng Lightbox: giữ focus trap, tự capture/return với `preventScroll`, resume sau khôi phục vị trí.
- **Ngoại lệ scope cần thiết cho scroll:** Gallery scene width=0 và projected buffer làm nở mobile layout viewport, khiến anchor/Closing sai. Chỉ thêm width scene và containment ngang tại section Gallery; không đổi geometry/motion/hover/content. Width iPhone/iPad đã khớp viewport, Closing sai số dưới 1px. Chất lượng Gallery vẫn chờ Phase 5.
- Kiểm thử 1366×768, 1440×900, 1920×1080, 393×852, 852×393, 820×1180, 1180×820 bằng Edge headless/touch emulation; không tuyên bố Safari thật. Bảng alignment 25/50/75% hai chiều đạt 96/96, sai số tối đa 0,5px. Ca viewport không có hai chapter cùng ngắn giữ native scrolling.
- Bằng chứng modal/keyboard/touch xác nhận giữ scroll, trap/return focus, swipe ngang không chuyển page, vuốt dọc vẫn thoát Gallery, replay về home. Deep link, refresh, back/forward, reduced motion và fallback thiếu scrollend có report riêng.
- Hash 34 originals + 34 thumbnails, PNG master và `note4.txt` giữ nguyên. Initial build 465,13 kB raw; Pages base `/HappyGradSweetie/`. Không thêm dependency, không thay audio, không commit/push/deploy.
- **Gate hiện tại:** bạn xem [PHASE4-SCROLL-REVIEW.md](qa/plan1/PHASE4-SCROLL-REVIEW.md), duyệt nhịp portrait/Invitation, căn section hai chiều và touch. Chỉ sau câu trả lời duyệt mới bắt đầu Phase 5. Physical Safari toolbar/safe areas/trackpad và profiling production chưa được nghiệm thu.

### 5.10. Ghi nhận Phase 5 — 13/10/2026

- **Quyền triển khai:** tiếp nối câu duyệt Scroll ngày 12/10 và các yêu cầu tiếp tục. Không coi các yêu cầu tiếp tục là phê duyệt trước Gallery hoặc Content. Gate Phase 4 ở mục 5.9 là ghi nhận lịch sử; Scroll đã được bạn duyệt ở bảng 5.8.
- Giữ ellipse/camera desktop; tách camera → rail → presentation. Hover nội suy quaternion, translation và uniform scale trong camera space, dùng nghịch đảo toàn bộ parent để quay gần chính diện, không shear hoặc CSS transform transition cạnh tranh. Chiếu bốn góc để fit safe rect, neighbor nhường có giới hạn; không dùng z-index giả depth.
- Một RAF ngoài Angular điều khiển position/hover/inertia; semantic Signals/DOM list chỉ đổi ở boundary. Frame đầu không nhảy pose. Hard-stop khi hidden/offscreen/suspended; reduced motion vẫn drag/keyboard/Lightbox, không autoplay/inertia. Giữ tốc độ 0,075 desktop / 0,05 touch.
- Browser QA phát hiện và sửa hai lỗi thực: camera plane vô hình chặn hit-test của card sâu; touch implicit capture chuyển button → scene phát `lostpointercapture` khiến drag bị hủy sớm. Đã kiểm tra capture/cancel, drag chậm không inertia, click suppression, focus và original Lightbox.
- Touch có profile/hướng ảnh riêng: iPhone 3, iPad portrait 5, landscape 7 card chính; tối đa 11 card DOM desktop. Main card dùng thumbnail `contain`, không crop mặt/mũ. Letterbox ivory của ảnh ngang là chủ đích và cần bạn review, không chỉnh asset để lấp khung.
- Evidence: 7 viewport; hover trái/giữa/phải tại 3 desktop đều gần chính diện và trong safe rect; mouse/touch drag, vertical page scroll, keyboard, modal, orientation, reduced motion, tab visibility. 10 chu kỳ modal sau warm-up giữ 494 DOM nodes / 128 JS listeners; không suy rộng thành bảo đảm không có mọi loại memory leak.
- Production chạy đủ 34 ID ở tốc độ thật trong **453,276 giây**, vượt logical boundary 34. Mẫu đo ~45 giây: p95 khoảng 8,4ms, không frame >50ms hoặc long task; đây là Edge headless có overhead capture, **không phải FPS bảo đảm trên Safari/thiết bị thật**. Video và log đầy đủ được liên kết trong review.
- 88/88 unit/component tests và hai build đạt; initial 471,69 kB raw. Verifier đối chiếu SHA-256 xác nhận 68 ảnh, PNG master và `note4.txt` nguyên vẹn; chỉ sáu file gallery/layout hiện có đổi so với Phase 4, thêm presentation utility/test. Không thay nội dung, Hero, Scroll, audio, dependency hay workflow.
- Lượt lifecycle forced-freeze cũ khiến WebSocket HMR bị đóng và reload; giữ nguyên evidence lỗi, không gọi đó là console sạch. Đã thay bằng kiểm tra đổi tab bình thường và chạy lại 10 chu kỳ không lỗi; production visibility là bằng chứng resume không HMR. `PHASE5-VERIFICATION-FINAL.json` là bản kiểm chứng cuối, bản đầu giữ để truy vết.
- **Chưa nghiệm thu tự động:** chất lượng sáng tạo tổng thể, cảm giác hover giữa các ảnh kề có overlap, Safari/iOS/iPadOS thật, safe-area phần cứng, toolbar/trackpad/zoom và performance lâu dài. Nếu không có thiết bị, giữ Pending và yêu cầu video từ bạn; không biến build/test xanh thành visual approval.
- **DỪNG tại Gallery Review.** Bạn review rail/hover/tốc độ/touch và video trong [PHASE5-GALLERY-REVIEW.md](qa/plan1/PHASE5-GALLERY-REVIEW.md). Chỉ khi bạn duyệt mới sang Phase 6 Content. Toàn bộ PLAN1 chưa hoàn tất; không commit, push hoặc deploy.

### 5.11. Checkpoint từng phase và sửa hover — 14/10/2026

- Bạn chọn **“Chỉnh tiếp hover che ảnh kề trước khi duyệt”**. Đã bỏ hit plane vô hình, giữ một vùng ảnh kề có thể trỏ tới bằng phép chiếu camera-space, và thêm hover intent 80 ms trong RAF hiện có. Ảnh hover không còn bị giảm opacity theo buffer; khi rời hover trả đúng pose rail.
- Bản sửa chỉ đổi sáu file Gallery/presentation so với checkpoint Phase 5 trước; không đổi rail idle, tốc độ, nội dung, Hero/Scroll hoặc ảnh cá nhân.
- **92/92 tests PASS**, production build và Pages build PASS. Initial bundle 473,04 kB raw / 133,22 kB estimated transfer. **312/312 kiểm chứng hover/evidence PASS** trong [manifest](qa/plan1/PHASE5-HOVER-VERIFICATION.json).
- Ba chuỗi tương tác khoảng 45 giây tại 1366×768, 1440×900 và 1920×1080: mỗi chuỗi có 15 đích hover, 12 lần chuyển trực tiếp giữa hai ảnh kề theo cả hai hướng, không phải rời scene rồi quay lại để vượt ảnh bị che. Kiểm tra thêm bảy viewport và bốn profile interaction/touch. Đây là Chromium emulation, không phải Safari/thiết bị thật.
- Full-loop 34 ảnh tốc độ thật là bằng chứng Phase 5 trước; không tuyên bố đã chạy lại hơn 7,5 phút cho bản sửa hover này. Idle rail/loop không thay đổi; seam 34↔1 được kiểm tra lại trong chuỗi mới.
- Commit theo nhóm phụ thuộc: Phase 2 asset; Phase 3.1 data/portrait; Phase 4.1 scroll foundation; Phase 4.2 tích hợp Hero + Scroll; Phase 5.1 presentation math; Phase 5.2 gallery renderer/interaction; Phase 5.3 tài liệu/QA. Phần nối Hero–Scroll phải atomic vì cùng dùng portrait track và directive, không tách thành commit có CTA hoặc portrait bị thiếu liên kết.
- Không đẩy khoảng 3 GB raw frame/bản thử. Không xóa chúng: giữ local, chỉ track bằng chứng chọn lọc. File `public/Image/original/canva.png` là bản thử chưa duyệt, giữ local và không đưa vào artifact GitHub.
- **Phase 6–7 và Final Creative Review chưa bắt đầu.** Push checkpoint không thay thế review/approval của bạn; tiếp tục dừng trước Content.
