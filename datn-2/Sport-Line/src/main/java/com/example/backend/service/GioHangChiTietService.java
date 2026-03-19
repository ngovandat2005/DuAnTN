package com.example.backend.service;

import com.example.backend.dto.ThemGioHangDTO;
import com.example.backend.entity.GioHangChiTiet;
import com.example.backend.entity.KhachHang;
import com.example.backend.entity.SanPhamChiTiet;
import com.example.backend.repository.GioHangChiTietRepo;
import com.example.backend.repository.KhachHangRepository;
import com.example.backend.repository.SanPhamChiTietRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GioHangChiTietService {

    @Autowired
    private GioHangChiTietRepo gioHangChiTietRepo;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Autowired
    private SanPhamChiTietRepository sanPhamChiTietRepository;

    @Transactional
    public GioHangChiTiet themVaoGio(ThemGioHangDTO req) {
        if (req == null) {
            throw new RuntimeException("Dữ liệu thêm giỏ hàng không hợp lệ!");
        }

        return themVaoGio(req.getIdKhachHang(), req.getIdSanPhamChiTiet(), req.getSoLuong());
    }

    @Transactional
    public GioHangChiTiet themVaoGio(Integer idKhachHang, Integer idSanPhamChiTiet, Integer soLuongThem) {
        if (idKhachHang == null) {
            throw new RuntimeException("Khách hàng không hợp lệ!");
        }

        if (idSanPhamChiTiet == null) {
            throw new RuntimeException("Sản phẩm không hợp lệ!");
        }

        if (soLuongThem == null || soLuongThem <= 0) {
            throw new RuntimeException("Số lượng mua phải lớn hơn 0!");
        }

        KhachHang khachHang = khachHangRepository.findById(idKhachHang)
                .orElseThrow(() -> new RuntimeException("Khách hàng không tồn tại!"));

        SanPhamChiTiet spct = sanPhamChiTietRepository.findById(idSanPhamChiTiet)
                .orElseThrow(() -> new RuntimeException("Sản phẩm chi tiết không tồn tại!"));

        if (spct.getSoLuong() == null || spct.getSoLuong() == 0) {
            throw new RuntimeException("Hàng đã hết!");
        }

        GioHangChiTiet gioHangDaCo = gioHangChiTietRepo
                .findBySanPhamChiTietIdAndKhachHangId(idSanPhamChiTiet, idKhachHang);

        int soLuongDangCoTrongGio = gioHangDaCo != null ? gioHangDaCo.getSoLuong() : 0;
        int tongSauKhiThem = soLuongDangCoTrongGio + soLuongThem;

        if (tongSauKhiThem > spct.getSoLuong()) {
            throw new RuntimeException("Không đủ số lượng tồn!");
        }

        GioHangChiTiet gioHangChiTiet;
        if (gioHangDaCo != null) {
            gioHangChiTiet = gioHangDaCo;
            gioHangChiTiet.setSoLuong(tongSauKhiThem);
        } else {
            gioHangChiTiet = new GioHangChiTiet();
            gioHangChiTiet.setKhachHang(khachHang);
            gioHangChiTiet.setSanPhamChiTiet(spct);
            gioHangChiTiet.setSoLuong(soLuongThem);
        }

        gioHangChiTiet.setGia(
                spct.getGiaBanGiamGia() != null && spct.getGiaBanGiamGia() > 0
                        ? spct.getGiaBanGiamGia()
                        : spct.getGiaBan()
        );

        return gioHangChiTietRepo.save(gioHangChiTiet);
    }

    @Transactional
    public GioHangChiTiet capNhatSoLuong(Integer idGioHangChiTiet, Integer soLuongMoi) {
        if (soLuongMoi == null || soLuongMoi <= 0) {
            throw new RuntimeException("Số lượng mua phải lớn hơn 0!");
        }

        GioHangChiTiet gioHangChiTiet = gioHangChiTietRepo.findById(idGioHangChiTiet)
                .orElseThrow(() -> new RuntimeException("Sản phẩm trong giỏ không tồn tại!"));

        SanPhamChiTiet spct = gioHangChiTiet.getSanPhamChiTiet();

        if (spct == null) {
            throw new RuntimeException("Sản phẩm chi tiết không tồn tại!");
        }

        if (spct.getSoLuong() == null || spct.getSoLuong() == 0) {
            throw new RuntimeException("Hàng đã hết!");
        }

        if (soLuongMoi > spct.getSoLuong()) {
            throw new RuntimeException("Không đủ số lượng tồn!");
        }

        gioHangChiTiet.setSoLuong(soLuongMoi);
        gioHangChiTiet.setGia(
                spct.getGiaBanGiamGia() != null && spct.getGiaBanGiamGia() > 0
                        ? spct.getGiaBanGiamGia()
                        : spct.getGiaBan()
        );

        return gioHangChiTietRepo.save(gioHangChiTiet);
    }

    public List<GioHangChiTiet> getDanhSachTheoKhach(Integer idKhachHang) {
        return gioHangChiTietRepo.findByKhachHangId(idKhachHang);
    }

    @Transactional
    public void xoaTatCaTheoKhach(Integer idKhach) {
        List<GioHangChiTiet> ds = gioHangChiTietRepo.findByKhachHangId(idKhach);
        gioHangChiTietRepo.deleteAll(ds);
    }

    @Transactional
    public void xoaTheoId(Integer id) {
        GioHangChiTiet gioHangChiTiet = gioHangChiTietRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm trong giỏ không tồn tại!"));

        gioHangChiTietRepo.delete(gioHangChiTiet);
    }

    public int soLoaiSanPham(Integer idKhach) {
        return gioHangChiTietRepo.findByKhachHangId(idKhach).size();
    }

    public int tongSoLuong(Integer idKhachHang) {
        return gioHangChiTietRepo.demTongSoLuongTrongGioKhach(idKhachHang);
    }

    public double tongTien(Integer idKhachHang) {
        return gioHangChiTietRepo.tinhTongTienGioHang(idKhachHang);
    }
}
