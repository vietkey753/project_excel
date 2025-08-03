# 📁 Hướng Dẫn Sử Dụng Thư Mục

## 📂 templates/

**Mục đích**: Chứa các file Excel mẫu để export
**Sử dụng**:

- Đặt file .xlsx template vào đây
- App sẽ đọc và áp dụng format từ template
- Có thể có nhiều template cho các mục đích khác nhau

**Ví dụ tên file**:

- `template_baocao_tinh.xlsx`
- `template_tonghop_donvi.xlsx`

## 📁 uploads/

**Mục đích**: Thư mục tạm để lưu file upload (nếu có backend)
**Lưu ý**:

- File sẽ tự động xóa sau khi xử lý
- Chỉ dùng cho development
- Production nên dùng cloud storage

## 🎯 Cách Sử Dụng

1. Đặt file Excel mẫu vào `templates/`
2. App sẽ tự động scan và hiển thị available templates
3. Khi export, chọn template phù hợp
4. Dữ liệu sẽ được map vào template và download
