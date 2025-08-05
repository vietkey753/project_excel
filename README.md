# Excel Processing Application

## Mô tả

Ứng dụng xử lý file Excel với khả năng:

- Upload và phân tích file Excel
- Tính toán dữ liệu đa cột (cộng, trừ, nhân, chia, sao chép text)
- Merge dữ liệu vào template Excel
- Chọn hàng bắt đầu chèn dữ liệu tùy ý

## Công nghệ sử dụng

### Frontend

- React 18 + TypeScript
- Ant Design (antd)
- Vite
- Axios

### Backend

- Go với Gin framework
- Excelize library cho xử lý Excel
- SQLite database

## Cài đặt và chạy

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
go mod download
go run cmd/main.go
```

## Tính năng chính

### 1. Multi-Column Calculator

- Hỗ trợ các phép tính: cộng, trừ, nhân, chia
- **Mới**: Sao chép text từ cột nguồn (copy operation)
- Tính toán theo hàng (row-wise calculation)

### 2. Multi-Data Merger

- Chèn nhiều cột tính toán vào template Excel
- Chọn hàng bắt đầu tùy ý (startRow)
- Preview trước khi merge
- Hỗ trợ xử lý dữ liệu text và số

### 3. Excel Processing

- Upload file Excel
- Phân tích cấu trúc sheet và cột
- Export kết quả theo template

## Cấu trúc thư mục

```
Project_excel/
├── frontend/           # React TypeScript app
├── backend/           # Go Gin server
├── templates/         # Excel templates
└── docs/             # Documentation
```

## API Endpoints

### File Management

- `POST /api/files/upload` - Upload Excel file
- `GET /api/files/:id/sheets` - Lấy danh sách sheets

### Calculations

- `POST /api/files/:id/calculate` - Tính toán row-wise
- `POST /api/files/:id/merge` - Merge vào template

## Copy Operation (Mới)

Phép tính "copy" cho phép sao chép text từ cột nguồn mà không chuyển đổi thành số:

- Frontend: Thêm option "Sao chép text" trong MultiColumnCalculator
- Backend: Xử lý riêng cho operation="copy" để giữ nguyên dữ liệu text

## Ghi chú phát triển

- ✅ Fixed startRow insertion logic
- ✅ Enhanced text data handling
- ✅ Added copy operation for text preservation
- ✅ Multi-column merge support
