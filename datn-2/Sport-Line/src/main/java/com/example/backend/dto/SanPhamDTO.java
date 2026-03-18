package com.example.backend.dto;




import lombok.Data;

@Data
public class SanPhamDTO {
    private String tenSanPham;
    private String ghiChu; // Thêm ghi chú vào đây để nhận từ Form React gửi lên
    private Integer idDanhMuc;
    private Integer idThuongHieu;
    private Integer idChatLieu;
    private Integer idXuatXu;
    private Integer idKhuyenMai;
    private String images;
    private Integer trangThai;
}