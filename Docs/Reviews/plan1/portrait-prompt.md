# Portrait — prompt và invariants

Chế độ: built-in image generation/edit, `background-extraction`, transparent background. Nguồn chỉnh sửa duy nhất: `public/Image/original/1.jpg` (1706×2560), không dùng các screenshot baseline làm reference.

## Prompt gửi công cụ

Use case: background-extraction.
Asset type: transparent photographic graduation portrait for the HappyGradSweetie website, not an illustration or a redesigned person.
Input image 1 is the EDIT TARGET and the only source of the person.

Remove only the outdoor background (trees, greenery, pale column) and the white stone table. Make those pixels genuinely transparent. Preserve the visible woman exactly as photographed: same face, eyes, expression, skin, hairstyle, body proportions, pose, black graduation cap, complete yellow tassel and thin tassel strings, black-and-gold graduation gown, pink cuffs, both visible hands, and all existing lettering/logos on clothing. No retouching, beautification, relighting, recoloring, face reconstruction or added detail.

The lower body is occluded by the table. DO NOT reconstruct it. DO NOT invent fingers, arms, hands, clothing, legs or a new smooth hem. Preserve only body pixels visible in the original. The silhouette must end at the original table-occlusion boundary and original bottom image boundary; transparent below the occlusion. Do not replace the table with body or fabric. Do not remove the hand resting above the table.

Maintain the full original portrait canvas/aspect ratio and exact source-relative placement and scale of every visible feature. Do not recenter, zoom, rotate, crop the cap/tassel/hands, or add headroom. Leave former background areas transparent. Preserve natural fine hair and tassel edges without white/green halos. No drawn checkerboard, backdrop, drop shadow, decorative glow, text or watermark. No lower-body fade baked into the master: any display fade will be separate CSS after review.

Output: one high-quality transparent cutout. Identity and visible source geometry take precedence over making a complete-body silhouette.

## Kiểm tra sau khi nhận output

- Không coi output AI là master đã được duyệt.
- Đối chiếu geometry trước khi dùng alpha; nếu lệch không co kéo người để khớp.
- Khi mask khớp, dùng alpha cùng RGB ảnh nguồn để bảo toàn mặt/tay; export PNG/WebP rồi kiểm tra trên bốn nền.
- Nếu không đạt thì giữ trạng thái Rejected/Pending, trình bày lỗi và fallback ảnh nguồn để bạn quyết định; không đi tiếp Hero.
