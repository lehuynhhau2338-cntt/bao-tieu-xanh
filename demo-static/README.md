# Bao Tiêu Xanh · Demo tĩnh kết nối nông sản

Website này phục vụ học tập, portfolio và trình diễn giao diện/tính năng. Toàn bộ sản phẩm, giá tham khảo, tồn kho mẫu, hồ sơ nông hộ, chương trình mua chung và đơn hàng đều là dữ liệu minh họa.

## Mở trang

Mở `index.html` trực tiếp trong trình duyệt hoặc chạy một máy chủ tĩnh local sẵn có (ví dụ `http://127.0.0.1`) để kiểm thử đầy đủ. Không cần cài đặt thêm package.

## Tính năng trình diễn

- **Danh mục nông sản**: Tìm kiếm theo tên/nông hộ/vùng trồng, lọc theo danh mục, vùng trồng, mức giá, sắp xếp giá/tồn mẫu, chuyển đổi chế độ xem 4 mặt hàng tiêu biểu hoặc toàn bộ danh mục, xem chi tiết lô mẫu và đánh dấu quan tâm.
- **Giỏ hàng & Đặt hàng mô phỏng**: Tính toán tổng tiền bằng số nguyên VNĐ, kiểm tra giới hạn tồn mẫu, tạo mã đơn demo `BTX-...`, tạm giữ tồn mẫu 24 giờ và tự động hoàn tồn nếu đơn quá hạn chưa xác nhận.
- **Tra cứu đơn demo**: Tra cứu theo mã đơn, chọn nhanh mã đơn gần đây, xem tiến trình trạng thái và hủy đơn mẫu để hoàn lại tồn kho.
- **Mua chung nông sản**: Theo dõi thanh tiến độkg đạt được, bảng bậc giá tham khảo theo sản lượng và đăng ký số lượng tham gia.
- **Hồ sơ nông hộ & Giá thị trường**: Xem thông tin nông hộ mẫu, lọc sản phẩm theo nông hộ, xem bảng giá tham khảo đồng bộ cùng thời điểm cập nhật.
- **Hỗ trợ nhà nông & Phát triển bền vững**: Giới thiệu quy trình đồng hành kỹ thuật, bao tiêu minh bạch và canh tác bền vững.
- **Quản trị demo cục bộ**: Thêm/sửa/xóa sản phẩm mẫu, cập nhật trạng thái đơn demo, điều chỉnh mục tiêu mua chung, xuất CSV đơn demo và khôi phục dữ liệu mặc định.

## Dữ liệu, tài nguyên và giới hạn

- Trạng thái giỏ hàng, tồn mẫu, đơn demo, danh sách quan tâm và lượt mua chung lưu trong `localStorage` của trình duyệt (`bao-tieu-xanh-demo-v1:*`).
- Biểu mẫu chỉ sử dụng mã người nhận mẫu và khu vực nhận mẫu; không thu thập dữ liệu cá nhân thật, không có backend, tài khoản quản trị, cổng thanh toán hay dịch vụ vận chuyển thật.
- Quản trị demo chỉ là bảng thao tác cục bộ trên trình duyệt để phục vụ trình diễn, không phải cơ chế bảo mật hay phân quyền thực tế.
- Font chữ tiếng Việt (`Lora` và `Be Vietnam Pro`) được nạp cục bộ từ `../assets/fonts`.
- Hình ảnh nông sản, nông hộ và hero sử dụng bộ ảnh mẫu cục bộ trong `assets/images/` kết hợp hình minh họa SVG dự phòng cho sản phẩm mới tạo trong bảng quản trị.

## Hệ thống chuyển động (Tham chiếu `home-export.json`)

- **Hero Entrance (`appearEffect` `trigger: "onMount"`)**: Chuỗi xuất hiện theo thứ tự nhãn (`HjL21fk0e`: `tween 0,1.03,0.56,1 1s`), tiêu đề (`nSbXPqmtA`: `y: 52px`, `tween 0.6,0,0.38,1.01 1.1s`), mô tả và nút hành động (`StcOupOJT`, `apCbNrzxd`, `PXvYMi9dc`: `y: 56px`, `skewX: -3deg`, `tween 0.6,0,0.38,1.01 1.1s`) cùng hiệu ứng thu phóng ảnh Hero từ `scale(1.2)` về `scale(1)` (`b3y0Udg0m`: `tween 0.44,0,0.56,1 1.6s`).
- **Scroll-Triggered Reveals (`appearEffect` `trigger: "onInView"`, `replay: false`)**: Sử dụng `IntersectionObserver` với các biến thể `spring-up` (`y: 40px`, xấp xỉ `spring-duration 1.2s 0.1 0.1s`), `story-left` / `story-right` (`x: ±48px`), `tween-up` (`y: 30px`, `tween 0.6,0,0.38,1.01 1.1s`) và `tween-down` (`y: -36px`).
- **Multi-Layer Parallax (`parallaxEffect`)**: Các lớp nội dung Hero di chuyển theo tốc độ `140` và `180` trên Desktop (`>= 1200px`), giảm biên độ trên Tablet (`810px–1199.98px`) và tự động tắt trên điện thoại (`<= 809.98px`) hoặc khi bật `prefers-reduced-motion: reduce`.
- **Scroll-Linked & Variant Effects (`styleTransformEffect` & `scrollVariantEffect`)**: Xoay họa tiết lá theo cuộn trang từ `-35deg` đến `38deg` (`loHhh3Amj`) và hiệu ứng đếm số `Flowing Number` (`iLB2S3RaZ`) trên tiến độ mua chung khi vào vùng nhìn.
- **Giới hạn kỹ thuật từ file xuất Framer**: File `home-export.json` không bao gồm mã nguồn của `codeOverride` (`codeFile/vud1EhG:withTextReveal`) và component `Flowing Number`. Hệ thống đã triển khai bản tương đương bằng CSS/JS thuần (`initTextReveal` tách từ giữ nguyên khoảng trắng tự nhiên cho trình đọc màn hình/sao chép/tìm kiếm, và `animateGroupFlowingNumber` đếm mượt theo `requestAnimationFrame`).
