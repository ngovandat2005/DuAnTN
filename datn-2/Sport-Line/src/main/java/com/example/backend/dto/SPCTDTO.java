package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SPCTDTO {

    private Integer id;
    private String images;
    private String tenSanPham;
    private String ghiChu;
    private Integer soLuong;
    private Double giaBan;
    private Double giaBanGiamGia;
    private String kichThuoc;
    private String mauSac;
    private Integer idKhuyenMai;
}