# Phase 7 — Phân tích bộ nhớ sau replay/modal/resize

> **15/10/2026 · local production Chromium · chưa commit/push/deploy.**
>
> Bổ sung cho [Final QA](PHASE7-FINAL-QA.md). Không đổi source ứng dụng, giao diện, nội dung hoặc asset. Không thay thế Final Creative Review và không nghiệm thu Safari thật.

## Kết luận trong phạm vi đo

Heap tăng ở soak trước chưa đủ để kết luận ứng dụng bị memory leak. Lượt đo mới có snapshot sau chu kỳ 10 và 30 cho thấy phần tăng **chủ yếu thuộc mã biên dịch V8 và đối tượng native của browser/DevTools**. Không thấy dấu hiệu listener, closure hoặc detached DOM tích lũy qua 20 chu kỳ giữa hai snapshot.

**Chưa xác nhận lỗi giữ bộ nhớ của ứng dụng để sửa.** Không thêm cleanup phỏng đoán, không xóa bộ đệm Performance để làm đẹp số đo. Kết quả không chứng minh mọi đường chạy đều leak-free hoặc heap đã đạt plateau dài hạn.

## 1. Phương pháp và provenance

- Edge **155.0.4283.45**, headless trên Windows; production artifact **`main-OUJE5TSM.js`**, base `/HappyGradSweetie/`.
- Source/artifact đối chiếu bằng SHA-256 trong [manifest v3](../../../qa/plan1/PHASE7-VERIFICATION-v3.json). Source ứng dụng không thay đổi trong lượt điều tra.
- Một profile browser riêng; chu kỳ 0 warm-up, sau đó 30 lần mở/đóng Lightbox → resize → replay Intro → quay lại Gallery. Chụp cùng trạng thái card focus để autoplay không làm đổi kích thước virtual window trong mẫu đo.
- Collector giữ nguyên input/logic ứng dụng; instrument RAF để đếm, lấy listener/DOM counters và gọi GC trước mẫu heap. Có CDP Network và HeapProfiler đang hoạt động.
- Snapshot ở chu kỳ 10 và 30; so sánh node type/name, shallow bytes, object ID ổn định và một số đường giữ tham chiếu mạnh về GC root. **Không tính dominator hoặc tổng retained size.** Snapshot gây dừng GC, không dùng lượt này để đo FPS/độ mượt.
- Heap snapshot chứa dữ liệu trong bộ nhớ của trang; giữ local dưới `qa/`, không upload lên dịch vụ ngoài hoặc tự push.

Theo [tài liệu Chrome DevTools về heap snapshot](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots), snapshot dùng để xem đối tượng còn được tham chiếu và so sánh trước/sau; shallow size khác retained size, và compiled code cũng là bộ nhớ. Vì vậy không quy mọi mức tăng heap thành leak ứng dụng.

## 2. Số liệu thật

Lượt mới đạt **51/51 checks**, không collector/runtime/network error ngoài ý muốn: [capture](../../../qa/plan1/final-heap-2026-10-15-diagnostic/final.json). Các checks chỉ xác nhận kịch bản/lifecycle và ngưỡng ngân sách, không phải chứng nhận không leak.

| Chỉ số | Chu kỳ 10 | Chu kỳ 30 | Diễn giải |
|---|---:|---:|---|
| `Runtime.getHeapUsage().usedSize`, sau GC | 4.638.064 B | 4.872.392 B | Tăng 234.328 B (~5,05%) |
| Tổng shallow bytes trong snapshot | 7.787.259 B | 8.105.032 B | Tăng 317.773 B; bao gồm native, không cùng đại lượng với `usedSize` |
| Code shallow bytes | 2.862.976 B | 3.078.096 B | +215.120 B, khoảng 67,7% mức tăng tổng shallow |
| Native shallow bytes | 3.651.135 B | 3.753.864 B | +102.729 B; đã kiểm tra một số retainer bên dưới |
| JS object count / shallow bytes | 5.339 / 186.292 B | 5.344 / 186.380 B | +5 object / +88 B; không chứng minh mọi instance đều ổn định |
| Closure count | 7.458 | 7.458 | Không tăng trong cặp snapshot |
| Detached native DOM nodes | 4 | 4 | **Cùng bốn object ID**, không phải bốn node mới thay thế |
| DOM event listeners | 124 | 124 | Window/document/scene lần lượt 9/17/9 ở toàn bộ 31 mẫu |
| DOM nodes | 489 | 491 | Tăng hai node, không tăng theo mỗi chu kỳ |
| Pending RAF tại điểm lấy mẫu | 1 | 1 | Toàn bộ 31 mẫu đều 1; không suy rằng toàn trang không còn RAF khi Gallery pause |

Chi tiết tổng hợp và retainer: [comparison-retainers.json](../../../qa/plan1/final-heap-2026-10-15-diagnostic/comparison-retainers.json). [Comparison đầu](../../../qa/plan1/final-heap-2026-10-15-diagnostic/comparison.json) giữ nguyên, không ghi đè khi bổ sung native paths.

## 3. Đường giữ tham chiếu đã kiểm tra

| Nhóm tăng | Bằng chứng trong snapshot | Kết luận giới hạn |
|---|---|---|
| `InstructionStream`, `TrustedByteArray`, `ProtectedFixedArray` | Các mẫu code đi qua closure → `Code` → instruction/deoptimization data | Phù hợp với compiled code/metadata V8; không phải số component DOM tăng |
| `DOMRectReadOnly`, `LayoutShift`, attribution | Window → native Performance → PerformanceEntry vector → LayoutShift → attribution → rect | Đường tham chiếu đã lấy mẫu nằm trong bộ đệm Performance của browser |
| `PerformanceResourceTiming`, LCP | Window → native Performance → PerformanceEntry vector | Các entry được giữ bởi native Performance; không có bằng chứng từ các path này rằng Angular giữ một mảng replay vô hạn |
| `NetworkResourcesData::ResourceData` | C++ persistent root → DevToolsSession → InspectorNetworkAgent → NetworkResourcesData | Có overhead của phiên CDP Network đang thu evidence |

Một path mạnh là bằng chứng một cách đối tượng còn được giữ, **không phải bằng chứng đó là đường giữ duy nhất**. Việc V8/Performance/Inspector chiếm phần tăng chính là kết luận từ snapshot này, không là bảo đảm hành vi của Safari hoặc mọi phiên chạy lâu hơn.

Bốn detached node có cùng ID ở cả hai snapshot: `175753`, `175755`, `175909`, `191615` (ba `div`, một `ng-component`). Chưa gán chúng cho một component hoặc gọi chúng là bug chỉ dựa vào tên; điều đã xác minh là chúng **không tích lũy giữa hai thời điểm**.

## 4. Quyết định và điểm còn mở

- Không sửa ứng dụng từ bằng chứng này: chưa xác định một retaining path lỗi cần cleanup.
- Giữ kết quả soak 10/30 chu kỳ cũ trong Final QA; lượt này giải thích thêm, không thay số lịch sử.
- Kiểm tra cleanup trong phạm vi kịch bản Chromium có bằng chứng tốt hơn; **plateau dài hạn và mọi loại memory leak vẫn chưa được chứng minh**.
- Nếu có dấu hiệu lag sau thời gian dài trên thiết bị thật: thu snapshot/recording đúng browser, cùng trạng thái UI và cùng phiên; truy retainer/dominator của nhóm tăng trước khi sửa.
- Tại lúc đo ngày 15/10, Final QA/Creative Review còn chờ bạn. **Cập nhật 16/10:** bạn đã duyệt bản Chromium; Safari/iPhone/iPad thật giữ Pending. Approval sáng tạo không mở rộng kết luận memory của các snapshot.

## 5. Chạy lại

Giữ production preview đang chạy, không rebuild giữa capture. Dùng thư mục mới:

```powershell
node scripts/qa/capture-final-lifecycle.mjs http://127.0.0.1:4205/HappyGradSweetie/ qa/plan1/my-new-heap 31 --heap-snapshots
node scripts/qa/analyze-heap-snapshots.mjs qa/plan1/my-new-heap/heap-cycle-10.heapsnapshot qa/plan1/my-new-heap/heap-cycle-30.heapsnapshot qa/plan1/my-new-heap/comparison.json
```

Collector/analyzer từ chối ghi đè evidence. File `.heapsnapshot` có thể mở bằng Memory panel của DevTools để kiểm tra thủ công; không cần tải dữ liệu cá nhân lên công cụ phân tích online.
