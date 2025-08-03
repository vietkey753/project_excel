package services

import (
	"excel-processor/internal/models"
)

type ProvinceService struct {
}

func NewProvinceService() *ProvinceService {
	return &ProvinceService{}
}

// GetAllProvinces returns sample provinces data
func (s *ProvinceService) GetAllProvinces() []models.Province {
	return []models.Province{
		{
			ID:   1,
			Name: "Hà Nội",
			Code: "HN",
		},
		{
			ID:   2,
			Name: "Hồ Chí Minh",
			Code: "HCM",
		},
		{
			ID:   3,
			Name: "Đà Nẵng",
			Code: "DN",
		},
		{
			ID:   4,
			Name: "Hải Phòng",
			Code: "HP",
		},
		{
			ID:   5,
			Name: "An Giang",
			Code: "AG",
		},
		{
			ID:   6,
			Name: "Bà Rịa - Vũng Tàu",
			Code: "BRVT",
		},
		{
			ID:   7,
			Name: "Bắc Giang",
			Code: "BG",
		},
		{
			ID:   8,
			Name: "Bắc Kạn",
			Code: "BK",
		},
		{
			ID:   9,
			Name: "Bạc Liêu",
			Code: "BL",
		},
		{
			ID:   10,
			Name: "Bắc Ninh",
			Code: "BN",
		},
	}
}

// GetUnitsByProvince returns sample units for a province
func (s *ProvinceService) GetUnitsByProvince(provinceId uint) []models.Unit {
	unitsByProvince := map[uint][]models.Unit{
		1: { // Hà Nội
			{ID: 1, Name: "Sở Giáo dục và Đào tạo Hà Nội", Code: "SGDDT_HN", ProvinceID: 1},
			{ID: 2, Name: "Sở Y tế Hà Nội", Code: "SYT_HN", ProvinceID: 1},
			{ID: 3, Name: "Sở Tài chính Hà Nội", Code: "STC_HN", ProvinceID: 1},
			{ID: 4, Name: "UBND Quận Ba Đình", Code: "UBND_BD", ProvinceID: 1},
			{ID: 5, Name: "UBND Quận Hoàn Kiếm", Code: "UBND_HK", ProvinceID: 1},
		},
		2: { // Hồ Chí Minh
			{ID: 6, Name: "Sở Giáo dục và Đào tạo TP.HCM", Code: "SGDDT_HCM", ProvinceID: 2},
			{ID: 7, Name: "Sở Y tế TP.HCM", Code: "SYT_HCM", ProvinceID: 2},
			{ID: 8, Name: "Sở Tài chính TP.HCM", Code: "STC_HCM", ProvinceID: 2},
			{ID: 9, Name: "UBND Quận 1", Code: "UBND_Q1", ProvinceID: 2},
			{ID: 10, Name: "UBND Quận 3", Code: "UBND_Q3", ProvinceID: 2},
		},
		3: { // Đà Nẵng
			{ID: 11, Name: "Sở Giáo dục và Đào tạo Đà Nẵng", Code: "SGDDT_DN", ProvinceID: 3},
			{ID: 12, Name: "Sở Y tế Đà Nẵng", Code: "SYT_DN", ProvinceID: 3},
			{ID: 13, Name: "Sở Du lịch Đà Nẵng", Code: "SDL_DN", ProvinceID: 3},
		},
		4: { // Hải Phòng
			{ID: 14, Name: "Sở Giáo dục và Đào tạo Hải Phòng", Code: "SGDDT_HP", ProvinceID: 4},
			{ID: 15, Name: "Cảng Hải Phòng", Code: "CANG_HP", ProvinceID: 4},
		},
		5: { // An Giang
			{ID: 16, Name: "Sở Nông nghiệp An Giang", Code: "SNN_AG", ProvinceID: 5},
			{ID: 17, Name: "Sở Thủy lợi An Giang", Code: "STL_AG", ProvinceID: 5},
		},
	}

	if units, exists := unitsByProvince[provinceId]; exists {
		return units
	}
	return []models.Unit{}
}
