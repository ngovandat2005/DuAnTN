package com.example.backend.controller;

import com.example.backend.dto.ThemGioHangDTO;
import com.example.backend.entity.GioHangChiTiet;
import com.example.backend.service.GioHangChiTietService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gio-hang-chi-tiet")
public class GioHangChiTietController {

    @Autowired
    private GioHangChiTietService gioHangChiTietService;

    @PostMapping("/them")
    public ResponseEntity<?> themVaoGio(@RequestBody ThemGioHangDTO req) {
        try {
            return ResponseEntity.ok(gioHangChiTietService.themVaoGio(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{idKhachHang}")
    public ResponseEntity<List<GioHangChiTiet>> layDanhSachTheoKhach(@PathVariable Integer idKhachHang) {
        return ResponseEntity.ok(gioHangChiTietService.getDanhSachTheoKhach(idKhachHang));
    }

    @PutMapping("/cap-nhat")
    public ResponseEntity<?> capNhatSoLuong(@RequestParam Integer id, @RequestParam int soLuongMoi) {
        try {
            GioHangChiTiet capNhat = gioHangChiTietService.capNhatSoLuong(id, soLuongMoi);
            return ResponseEntity.ok(capNhat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/xoa-tat-ca/{idKhach}")
    public ResponseEntity<Void> xoaHetTheoKhach(@PathVariable Integer idKhach) {
        gioHangChiTietService.xoaTatCaTheoKhach(idKhach);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/xoa/{id}")
    public ResponseEntity<?> xoaSanPhamKhoiGio(@PathVariable Integer id) {
        try {
            gioHangChiTietService.xoaTheoId(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/so-loai/{idKhach}")
    public ResponseEntity<Integer> soLoai(@PathVariable Integer idKhach) {
        int count = gioHangChiTietService.soLoaiSanPham(idKhach);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/tong-so-luong/{idKhachHang}")
    public ResponseEntity<Integer> tongSoLuong(@PathVariable Integer idKhachHang) {
        return ResponseEntity.ok(gioHangChiTietService.tongSoLuong(idKhachHang));
    }

    @GetMapping("/tong-tien/{idKhachHang}")
    public ResponseEntity<Double> tongTien(@PathVariable Integer idKhachHang) {
        return ResponseEntity.ok(gioHangChiTietService.tongTien(idKhachHang));
    }
}
