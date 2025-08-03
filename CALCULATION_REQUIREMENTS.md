# YÊU CẦU TÍNH TOÁN EXCEL - GHI CHÚ CHI TIẾT

## 🎯 MỤC TIÊU CHÍNH

Tạo hệ thống tính toán Excel với khả năng:

- Lấy dữ liệu từ hàng cụ thể (ví dụ: hàng 11)
- Thực hiện phép tính theo từng hàng (row-wise calculation)
- Xuất kết quả vào file template Excel

## 📊 VẤN ĐỀ HIỆN TẠI

1. **Sheet có 36 cột** nhưng **UI chỉ hiển thị 3 cột**

   - Nguyên nhân: Hàng đầu tiên chỉ có 3 cột có dữ liệu
   - Các cột khác (I, K, M, ...) có dữ liệu ở hàng 11 trở đi

2. **Logic tính toán sai**
   - Hiện tại: Tổng cột I + Tổng cột K (column-wise sum)
   - Mong muốn: Hàng 11 cột I + Hàng 11 cột K = Kết quả hàng 11 (row-wise calculation)

## 🔧 YÊU CẦU CỤ THỂ

### 1. CHỌN VÙNG DỮ LIỆU

```
Từ hàng: 11 (hoặc hàng bắt đầu do user chọn)
Đến hàng: 100 (hoặc đến khi hết dữ liệu)
Cột nguồn: I, K, M (user có thể chọn nhiều cột)
Cột đích: L (trong template)
```

### 2. TÍNH TOÁN THEO HÀNG

```
Hàng 11: I11 + K11 = L11
Hàng 12: I12 + K12 = L12
Hàng 13: I13 + K13 = L13
...
Hàng N: IN + KN = LN (đến khi hết dữ liệu)
```

### 3. XUẤT VÀO TEMPLATE

- Kết quả được ghi vào file template Excel
- Đúng vị trí cột đích và cả hàng nữa (ví dụ: cột L hàng 11)
- Giữ nguyên format và structure của template

## 🚨 VẤN ĐỀ CẦN SỬA

### A. Hiển thị cột

- **Hiện tại**: Chỉ hiển thị cột có dữ liệu ở hàng đầu tiên
- **Cần sửa**: Hiển thị TẤT CẢ cột có trong Excel (A đến AK)
- **Giải pháp**: Lấy column headers từ Excel structure, không phụ thuộc vào dữ liệu hàng đầu

### B. Logic tính toán

- **Hiện tại**: Tính tổng theo cột (column-wise aggregation)
- **Cần sửa**: Tính toán theo hàng (row-wise calculation)
- **Giải pháp**: Duyệt từng hàng, thực hiện phép tính, lưu kết quả từng hàng

### C. Template integration

- **Hiện tại**: Chưa có
- **Cần thêm**: Tích hợp với file template ./templates/FileMauImportThuNhap.xlsx
- **Giải pháp**: Sử dụng TemplateManager để ghi kết quả vào template

## 📝 WORKFLOW MỚI

### Bước 1: Chọn vùng dữ liệu

```
- Chọn hàng bắt đầu: 11
- Hệ thống tự động phát hiện hàng kết thúc (khi hết dữ liệu)
- Hiển thị preview: "Tìm thấy dữ liệu từ hàng 11 đến hàng 95"
```

### Bước 2: Chọn cột nguồn

```
- Hiển thị TẤT CẢ cột Excel (A, B, C, ..., AK)
- User chọn: I, K, M
- Hiển thị sample data từ hàng được chọn
```

### Bước 3: Chọn phép tính

```
- Cộng: I + K + M
- Trừ: I - K - M
- Nhân: I × K × M
- Chia: I ÷ K ÷ M
```

### Bước 4: Chọn cột đích

```
- Chọn cột trong template để ghi kết quả
- Preview công thức: "I + K + M = L"
```

### Bước 5: Thực hiện tính toán

```
- Duyệt từ hàng 11 đến hàng cuối
- Tính toán từng hàng
- Lưu kết quả vào template
```

## 🔍 TECHNICAL NOTES

### Frontend Changes Needed:

1. **ColumnCalculator.tsx**:

   - Sửa logic hiển thị cột: Lấy từ Excel column structure
   - Sửa calculation logic: Row-wise thay vì column-wise
   - Thêm preview tính toán từng hàng

2. **Data Range Detection**:
   - Smart detection: Tìm hàng bắt đầu có dữ liệu thực
   - Tìm hàng kết thúc khi hết dữ liệu
   - Hiển thị preview range

### Backend Changes Needed:

1. **Excel Service**:

   - Cải thiện column detection
   - Row-wise calculation API
   - Template integration

2. **Template Manager**:
   - Load template file
   - Write calculated results
   - Export final file

## 📋 EXAMPLE WORKFLOW

```
Input Excel: DSOAT-T1.2025
- 36 cột (A đến AK)
- Dữ liệu từ hàng 11 đến hàng 95
- Cột I, K, M có số liệu cần tính

User chọn:
- Hàng bắt đầu: 11
- Cột nguồn: I, K, M
- Phép tính: Cộng (I + K + M)
- Cột đích: L (trong template)

Kết quả:
- Hàng 11: I11 + K11 + M11 = L11
- Hàng 12: I12 + K12 + M12 = L12
- ...
- Hàng 95: I95 + K95 + M95 = L95

Output: Template Excel với dữ liệu đã tính toán
```

## ⚠️ NOTES FOR DEVELOPER

1. **KHÔNG** tính tổng cột (SUM(I:I) + SUM(K:K))
2. **PHẢI** tính theo hàng (I11+K11, I12+K12, ...)
3. **PHẢI** hiển thị tất cả cột Excel, không chỉ cột có dữ liệu ở hàng đầu
4. **PHẢI** tích hợp với template để xuất file cuối cùng

---

_File này sẽ được cập nhật khi có thêm yêu cầu mới_
