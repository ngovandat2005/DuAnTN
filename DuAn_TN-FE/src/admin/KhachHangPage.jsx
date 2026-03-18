import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space, message, Popconfirm, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, KeyOutlined, CalendarOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import config from '../config/config';
import { parseGHNResponse } from '../utils/ghnUtils';
import '../styles/AdminPanel.css'; // Import the CSS file

const { Option } = Select;

export default function KhachHangPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form] = Form.useForm();

  // Dữ liệu giả định cho khách hàng
  const [khachHangs, setKhachHangs] = useState([]);

  // GHN Address states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [wardLoading, setWardLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8080/api/khachhang')
      .then(response => response.json())
      .then(data => setKhachHangs(data))
      .catch(error => console.error('Lỗi khi gọi API kích thước:', error));
  }, []);

  // Load provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      setAddressLoading(true);
      try {
        const response = await fetch(config.getApiUrl("api/ghn/provinces"));
        if (response.ok) {
          const responseData = await response.json();
          const data = parseGHNResponse(responseData);
          if (data) setProvinces(data);
        }
      } catch (error) {
        console.error("Lỗi fetch tỉnh/thành:", error);
      } finally {
        setAddressLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  // Load districts
  useEffect(() => {
    if (selectedProvince) {
      const fetchDistricts = async () => {
        setDistrictLoading(true);
        setDistricts([]);
        setWards([]);
        try {
          const response = await fetch(config.getApiUrl(`api/ghn/districts/${selectedProvince}`));
          if (response.ok) {
            const responseData = await response.json();
            const data = parseGHNResponse(responseData);
            if (data) setDistricts(data);
          }
        } catch (error) {
          console.error("Lỗi fetch quận/huyện:", error);
        } finally {
          setDistrictLoading(false);
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince]);

  // Load wards
  useEffect(() => {
    if (selectedDistrict) {
      const fetchWards = async () => {
        setWardLoading(true);
        setWards([]);
        try {
          const response = await fetch(config.getApiUrl(`api/ghn/wards/${selectedDistrict}`));
          if (response.ok) {
            const responseData = await response.json();
            const data = parseGHNResponse(responseData);
            if (data) setWards(data);
          }
        } catch (error) {
          console.error("Lỗi fetch phường/xã:", error);
        } finally {
          setWardLoading(false);
        }
      };
      fetchWards();
    } else {
      setWards([]);
    }
  }, [selectedDistrict]);

  const handleProvinceChange = (provinceId) => {
    setSelectedProvince(provinceId);
    setSelectedDistrict(null);
    setSelectedWard(null);
    form.setFieldsValue({ districtId: null, wardCode: null });
  };

  const handleDistrictChange = (districtId) => {
    setSelectedDistrict(districtId);
    setSelectedWard(null);
    form.setFieldsValue({ wardCode: null });
  };

  const handleWardChange = (wardId) => {
    setSelectedWard(wardId);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Bạn có chắc chắn muốn xóa khách hàng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Có',
      cancelButtonText: 'Không',
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://localhost:8080/api/khachhang/delete/${id}`, { method: 'DELETE' })
          .then(res => {
            if (res.ok) return true;
            if (res.status === 404 || res.status === 410) return false;
            throw new Error();
          })
          .then((found) => {
            if (found === true) {
              Swal.fire({ icon: 'success', title: 'Xóa thành công', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, width: 250 });
            } else {
              Swal.fire({ icon: 'info', title: 'Khách hàng đã bị xóa hoặc không tồn tại', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, width: 250 });
            }
            fetch('http://localhost:8080/api/khachhang')
              .then(res => res.json())
              .then(data => setKhachHangs(data));
          })
          .catch(() => {
            Swal.fire({ icon: 'error', title: 'Xóa thất bại',text:'Khách Hàng Này Đang Có Liên Quan Đến Đơn Hàng K Thể Xóa', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, width: 250 });
          });
      }
    });
  };

  const columns = [
    { 
      title: 'STT', 
      key: 'stt',
      render: (text, record, index) => index + 1 
    },
    { title: 'Tên KH', dataIndex: 'tenKhachHang', key: 'tenKhachHang' },
    { title: 'email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'soDienThoai', key: 'soDienThoai' },
    {
      title: 'Ngày Sinh',
      dataIndex: 'ngaySinh',
      key: 'ngaySinh',
      render: (value) => value ? new Date(value).toLocaleDateString('vi-VN') : ''
    },
    {
      title: 'Giới Tính',
      dataIndex: 'gioiTinh',
      key: 'gioiTinh',
      render: value => value ? 'Nam' : 'Nữ'
    },
    { title: 'Địa Chỉ', dataIndex: 'diaChi', key: 'diaChi' },
    {
      title: 'Hành Động',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" onClick={() => handleEdit(record)}>Sửa</Button>
          {/* <Button type="danger" onClick={() => handleDelete(record.id)}>Xóa</Button> */}
        </Space>
      ),
    },
  ];

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    form.resetFields();
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    showModal();
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
      ...customer,
      addressDetail: customer.diaChi,
      provinceId: null,
      districtId: null,
      wardCode: null,
      ngaySinh: customer.ngaySinh ? moment(customer.ngaySinh) : null,
      gioiTinh: customer.gioiTinh === true || customer.gioiTinh === 1 ? 'Nam' : 'Nữ',
      trangThai: customer.trangThai ? 1 : 0,
    });
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    showModal();
  };

  const onFinish = (values) => {
    let finalAddress = values.addressDetail || "";
    if (values.provinceId && values.districtId && values.wardCode) {
      const provName = provinces.find(p => p.ProvinceID === values.provinceId)?.ProvinceName || '';
      const distName = districts.find(d => d.DistrictID === values.districtId)?.DistrictName || '';
      const wardName = wards.find(w => w.WardCode === values.wardCode)?.WardName || '';
      finalAddress = `${values.addressDetail ? values.addressDetail + ', ' : ''}${wardName}, ${distName}, ${provName}`;
    }

    // Map giá trị đúng với backend
    const dataSend = {
      ...values,
      tenKhachHang: values.tenKhachHang,
      email: values.email,
      soDienThoai: values.soDienThoai,
      ngaySinh: values.ngaySinh ? values.ngaySinh.toISOString() : null,
      gioiTinh: values.gioiTinh === 'Nam' ? true : false,
      diaChi: finalAddress,
      trangThai: values.trangThai === 1 ? true : false,
      maThongBao: null,
      thoiGianThongBao: null,
    };
    console.log('Dữ liệu gửi lên:', dataSend);
    if (editingCustomer) {
      // Sửa
      fetch(`http://localhost:8080/api/khachhang/update/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dataSend, id: editingCustomer.id }),
      })
        .then(response => {
          if (!response.ok) throw new Error('Cập nhật thất bại');
          return response.json();
        })
        .then(data => {
          Swal.fire({
            icon: 'success',
            title: 'Cập nhật thành công',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            width: 250
          });
          fetch('http://localhost:8080/api/khachhang')
            .then(res => res.json())
            .then(data => setKhachHangs(data));
        })
        .catch(error => {
          Swal.fire({
            icon: 'success',
            title: 'Cập nhật thất bại',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            width: 250
          });
          console.error(error);
        });
    } else {
      // Thêm mới
      fetch('http://localhost:8080/api/khachhang/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataSend),
      })
        .then(async response => {
          if (!response.ok) {
            // Lấy message lỗi từ BE (ví dụ: số điện thoại đã tồn tại)
            const errorMessage = await response.text();
            Swal.fire({
              icon: 'error',
              title: 'Thêm thất bại',
              text: "Dữ liệu khách hàng đang bị trùng hoặc thiếu",
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 1800,
              width: 250
            });
            throw new Error(errorMessage);
          }
          return response.json();
        })
        .then(data => {
          Swal.fire({
            icon: 'success',
            title: 'Thêm thành công',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            width: 250
          });
          fetch('http://localhost:8080/api/khachhang')
            .then(res => res.json())
            .then(data => setKhachHangs(data));
        })
        .catch(error => {
          // Đã hiển thị lỗi ở trên, không cần Swal nữa
          console.error(error);
        });
    }
    handleCancel();
  };

  return (
    <div className="admin-content-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý Khách Hàng</h1>
        <Button type="primary" onClick={handleAdd}>Thêm Khách Hàng Mới</Button>
      </div>
      <Table dataSource={khachHangs} columns={columns} rowKey="id" pagination={false} />

      <Modal
        title={editingCustomer ? "Sửa Khách Hàng" : "Thêm Khách Hàng"}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null} // Ẩn footer mặc định của Modal
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ gioiTinh: 'Nam', trangThai: 1 }}
        >
          {editingCustomer && (
            <Form.Item name="id" label="ID">
              <Input disabled />
            </Form.Item>
          )}
          <Form.Item
            name="tenKhachHang"
            label="Tên Khách Hàng"
            rules={[{ required: true, message: 'Vui lòng nhập Tên Khách Hàng!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên Khách Hàng" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Vui lòng nhập Email hợp lệ!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="soDienThoai"
            label="Số Điện Thoại"
            rules={[{ required: true, message: 'Vui lòng nhập Số Điện Thoại!' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Số Điện Thoại" />
          </Form.Item>
          <Form.Item
            name="ngaySinh"
            label="Ngày Sinh"
            rules={[{ required: true, message: 'Vui lòng chọn Ngày Sinh!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" prefix={<CalendarOutlined />} />
          </Form.Item>
          <Form.Item
            name="gioiTinh"
            label="Giới Tính"
            rules={[{ required: true, message: 'Vui lòng chọn Giới Tính!' }]}
          >
            <Select prefix={<QuestionCircleOutlined />} placeholder="Chọn Giới Tính">
              <Option value="Nam">Nam</Option>
              <Option value="Nữ">Nữ</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="provinceId" label="Tỉnh/Thành phố">
                <Select
                  placeholder="Thành phố"
                  onChange={handleProvinceChange}
                  loading={addressLoading}
                  showSearch
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  allowClear
                >
                  {provinces.map(p => <Option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="districtId" label="Quận/Huyện">
                <Select
                  placeholder="Quận/Huyện"
                  onChange={handleDistrictChange}
                  loading={districtLoading}
                  disabled={!selectedProvince}
                  showSearch
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  allowClear
                >
                  {districts.map(d => <Option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="wardCode" label="Phường/Xã">
                <Select
                  placeholder="Phường/Xã"
                  onChange={handleWardChange}
                  loading={wardLoading}
                  disabled={!selectedDistrict}
                  showSearch
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                  allowClear
                >
                  {wards.map(w => <Option key={w.WardCode} value={w.WardCode}>{w.WardName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="addressDetail"
            label={editingCustomer ? "Địa Chỉ Cũ / Địa Chỉ Cụ Thể" : "Địa Chỉ Cụ Thể"}
            rules={[{ required: true, message: 'Vui lòng nhập Địa Chỉ cụ thể!' }]}
          >
            <Input prefix={<HomeOutlined />} placeholder="Ví dụ: Số nhà, tên đường..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingCustomer ? "Cập Nhật" : "Thêm Mới"}
            </Button>
            <Button onClick={handleCancel} style={{ marginLeft: 8 }}>
              Hủy
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 