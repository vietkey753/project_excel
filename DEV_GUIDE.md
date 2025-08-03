# Development Scripts

## 🚀 Start Development Servers

### Frontend (React)

```bash
cd frontend
npm run dev
```

Server sẽ chạy tại: http://localhost:5173

### Backend (Golang)

```bash
cd backend
go run cmd/main.go
```

Server sẽ chạy tại: http://localhost:8080

## 📝 API Documentation

### Base URL

```
http://localhost:8080/api
```

### Endpoints

- `GET /health` - Health check
- `POST /upload` - Upload Excel file
- `GET /sheets/:fileId` - Get sheets from file
- `GET /data/:fileId/:sheetName` - Get sheet data
- `GET /provinces` - Get all provinces
- `GET /units/:provinceId` - Get units by province
- `POST /calculate` - Perform calculations
- `POST /export` - Export to Excel

## 🗂️ Project Structure

```
Project_excel/
├── frontend/          # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── hooks/
├── backend/           # Golang + Gin
│   ├── cmd/
│   ├── internal/
│   │   ├── handlers/
│   │   ├── models/
│   │   └── services/
├── templates/         # Excel templates
└── uploads/          # Temporary uploads
```

## ✅ Phase 1 Complete!

- [x] React app với TypeScript
- [x] Golang backend với Gin
- [x] Basic project structure
- [x] API endpoints định nghĩa
- [x] Dependencies installed
- [x] Development ready
