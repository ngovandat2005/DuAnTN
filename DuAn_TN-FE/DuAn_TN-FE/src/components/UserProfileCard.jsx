import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Radio,
  Modal,
  Tag,
  Space,
  Popconfirm,
  message,
  Checkbox
} from "antd";
import { getUserInfo, getCustomerId, isLoggedIn } from "../utils/authUtils";
import config from "../config/config";
import { parseGHNResponse, logGHNResponse } from "../utils/ghnUtils";
import moment from "moment";
import Swal from 'sweetalert2';

const { Option } = Select;
const { Title, Text } = Typography;

const UserProfileCard = () => {
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Address Book states
  const customerId = getCustomerId();
  const addressStorageKey = `savedAddresses_${customerId || 'guest'}`;
  const [addresses, setAddresses] = useState([]);
  
  // Modal states
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);

  // States for address selects in Modal
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [wardLoading, setWardLoading] = useState(false);

  // Load Main Profile Info
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const localUser = getUserInfo();

        const initialValues = {
          name: localUser?.ten || "",
          email: localUser?.email || "",
          phone: localUser?.soDienThoai || "",
          ngaySinh: localUser?.ngaySinh ? moment(localUser.ngaySinh) : null,
          gioiTinh: localUser?.gioiTinh || null,
        };
        form.setFieldsValue(initialValues);

        if (isLoggedIn() && customerId) {
          try {
            const res = await fetch(config.getApiUrl(`api/khachhang/${customerId}`));
            if (res.ok) {
              const data = await res.json();
              form.setFieldsValue({
                name: initialValues.name || data.ten || data.hoTen || "",
                email: initialValues.email || data.email || "",
                phone: initialValues.phone || data.soDienThoai || data.sdt || "",
                ngaySinh: data.ngaySinh ? moment(data.ngaySinh) : null,
                gioiTinh: data.gioiTinh === true ? 'Nam' : data.gioiTinh === false ? 'Nữ' : null,
              });
            }
          } catch (e) {}
        }
        setInitialLoaded(true);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [form, customerId]);

  // Load Address Book
  useEffect(() => {
    try {
      const raw = localStorage.getItem(addressStorageKey);
      let list = raw ? JSON.parse(raw) : [];

      // Seed if empty
      if (!Array.isArray(list) || list.length === 0) {
        const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
        const regAddress = userLocal.diaChi || userLocal.address || '';
        const regName = userLocal.ten || userLocal.name || '';
        const regPhone = userLocal.soDienThoai || userLocal.phone || '';

        if (regAddress) {
          const seeded = [{
            id: Date.now(),
            name: regName,
            phone: regPhone,
            email: userLocal.email || '',
            addressDetail: '',
            fullAddress: regAddress,
            provinceId: null,
            districtId: null,
            wardCode: null,
            isDefault: true
          }];
          list = seeded;
          localStorage.setItem(addressStorageKey, JSON.stringify(seeded));
        }
      }
      setAddresses(list);
    } catch (e) {
      console.error(e);
    }
  }, [addressStorageKey]);

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
    addressForm.setFieldsValue({ districtId: null, wardCode: null });
  };

  const handleDistrictChange = (districtId) => {
    setSelectedDistrict(districtId);
    setSelectedWard(null);
    addressForm.setFieldsValue({ wardCode: null });
  };

  const handleWardChange = (wardId) => {
    setSelectedWard(wardId);
  };

  const handleSaveMainProfile = async () => {
    try {
      const values = await form.validateFields();
      
      let defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
      let fullAddress = defaultAddress ? defaultAddress.fullAddress : "";

      const existing = getUserInfo() || {};
      const updated = {
        ...existing,
        ten: values.name || existing.ten,
        email: values.email || existing.email,
        soDienThoai: values.phone || existing.soDienThoai,
        diaChi: fullAddress || existing.diaChi,
        ngaySinh: values.ngaySinh ? values.ngaySinh.toISOString() : null,
        gioiTinh: values.gioiTinh === 'Nam' ? true : values.gioiTinh === 'Nữ' ? false : null,
        profileUpdatedAt: new Date().toISOString(),
      };
      localStorage.setItem("user", JSON.stringify(updated));

      if (isLoggedIn() && customerId) {
        try {
          const body = {
            id: Number(customerId),
            tenKhachHang: values.name,
            ten: values.name,
            hoTen: values.name,
            email: values.email || null,
            soDienThoai: values.phone,
            sdt: values.phone,
            diaChi: fullAddress,
            ngaySinh: values.ngaySinh ? values.ngaySinh.toISOString() : null,
            gioiTinh: values.gioiTinh === 'Nam' ? true : values.gioiTinh === 'Nữ' ? false : null,
            trangThai: true,
          };
          
          const res = await fetch(config.getApiUrl(`api/khachhang/update/${customerId}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Đã cập nhật thông tin cá nhân!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
          } else {
            Swal.fire({ icon: 'warning', title: 'Cảnh báo', text: 'Cập nhật hệ thống thất bại.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
          }
        } catch (e) {
          Swal.fire({ icon: 'warning', title: 'Cảnh báo', text: 'Lỗi kết nối khi cập nhật.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        }
      } else {
        Swal.fire({ icon: 'success', title: 'Thành công!', text: 'Đã lưu trên trình duyệt!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Lỗi!', text: 'Kiểm tra lại thông tin.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
  };

  // --- Modal Address Logic ---
  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddrId(address.id);
      addressForm.setFieldsValue({
        name: address.name,
        phone: address.phone,
        addressDetail: address.addressDetail,
        provinceId: address.provinceId,
        districtId: address.districtId,
        wardCode: address.wardCode,
        isDefault: address.isDefault
      });
      setSelectedProvince(address.provinceId);
      setTimeout(() => setSelectedDistrict(address.districtId), 100);
      setTimeout(() => setSelectedWard(address.wardCode), 200);
    } else {
      setEditingAddrId(null);
      addressForm.resetFields();
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedWard(null);
      // If list is empty, default should be checked
      if (addresses.length === 0) {
        addressForm.setFieldsValue({ isDefault: true });
      }
    }
    setAddressModalVisible(true);
  };

  const handleSaveAddress = async () => {
    try {
      const values = await addressForm.validateFields();
      
      const provName = provinces.find(p => p.ProvinceID === values.provinceId)?.ProvinceName || '';
      const distName = districts.find(d => d.DistrictID === values.districtId)?.DistrictName || '';
      const wardName = wards.find(w => w.WardCode === values.wardCode)?.WardName || '';
      
      const fullAddress = `${values.addressDetail}, ${wardName}, ${distName}, ${provName}`;

      let updatedList = [...addresses];

      if (values.isDefault) {
        updatedList = updatedList.map(a => ({ ...a, isDefault: false }));
      }

      if (editingAddrId) {
        updatedList = updatedList.map(a => {
          if (a.id === editingAddrId) {
            return {
              ...a,
              name: values.name,
              phone: values.phone,
              provinceId: values.provinceId,
              districtId: values.districtId,
              wardCode: values.wardCode,
              addressDetail: values.addressDetail,
              fullAddress,
              isDefault: values.isDefault || (updatedList.length === 1)
            };
          }
          return a;
        });
      } else {
        updatedList.push({
          id: Date.now(),
          name: values.name,
          phone: values.phone,
          provinceId: values.provinceId,
          districtId: values.districtId,
          wardCode: values.wardCode,
          addressDetail: values.addressDetail,
          fullAddress,
          isDefault: values.isDefault || addresses.length === 0
        });
      }

      // Ensure at least one default if list is not empty
      if (updatedList.length > 0 && !updatedList.some(a => a.isDefault)) {
        updatedList[0].isDefault = true;
      }

      setAddresses(updatedList);
      localStorage.setItem(addressStorageKey, JSON.stringify(updatedList));
      setAddressModalVisible(false);
      message.success('Đã lưu địa chỉ!');

    } catch (e) {
      // validation error
    }
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    setAddresses(updated);
    localStorage.setItem(addressStorageKey, JSON.stringify(updated));
    message.success('Đã xóa địa chỉ!');
  };

  const handleSetDefaultAddress = (id) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    setAddresses(updated);
    localStorage.setItem(addressStorageKey, JSON.stringify(updated));
    message.success('Đã thiết lập làm địa chỉ mặc định!');
  };

  return (
    <Card 
      style={{ margin: "16px 0", borderRadius: "2px", boxShadow: "0 1px 2px 0 rgba(0,0,0,.13)" }} 
      bodyStyle={{ padding: "0 30px 30px" }}
      loading={loading && !initialLoaded}
    >
      <div style={{ borderBottom: '1px solid #efefef', padding: '18px 0', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0, color: '#333', textTransform: 'capitalize' }}>
          Hồ Sơ Của Tôi
        </h1>
        <div style={{ fontSize: '14px', color: '#555', marginTop: '4px' }}>
          Quản lý thông tin hồ sơ để bảo mật tài khoản
        </div>
      </div>

      <Row gutter={40}>
        <Col span={16}>
          <Form 
            form={form} 
            layout="horizontal"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            labelAlign="right"
            style={{ paddingRight: '30px' }}
          >
            <Form.Item label={<span style={{ color: '#555' }}>Tên đăng nhập</span>}>
              <Text strong>{getUserInfo()?.tenDangNhap || getUserInfo()?.email || "Chưa có"}</Text>
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#555' }}>Họ và tên</span>}
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
            >
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#555' }}>Số điện thoại</span>}
              name="phone"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
            >
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: '#555' }}>Email</span>}
              name="email"
              rules={[{ type: "email", message: "Email không hợp lệ" }]}
            >
              <Input placeholder="Nhập email" />
            </Form.Item>

            <Form.Item label={<span style={{ color: '#555' }}>Giới tính</span>} name="gioiTinh">
              <Radio.Group>
                <Radio value="Nam">Nam</Radio>
                <Radio value="Nữ">Nữ</Radio>
                <Radio value="Khác">Khác</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item label={<span style={{ color: '#555' }}>Ngày sinh</span>} name="ngaySinh">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="Chọn ngày sinh" />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
              <Button type="primary" onClick={handleSaveMainProfile} disabled={loading} style={{ backgroundColor: '#ee4d2d', borderColor: '#ee4d2d', height: '40px', padding: '0 20px' }}>
                Lưu
              </Button>
            </Form.Item>
          </Form>
        </Col>

        {/* Avatar Section */}
        <Col span={8} style={{ borderLeft: '1px solid #efefef', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' }}>
             <img src="https://ui-avatars.com/api/?name=User&background=random&size=100" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <Button style={{ marginBottom: 10 }}>Chọn Ảnh</Button>
          <div style={{ color: '#999', fontSize: 13, textAlign: 'center', lineHeight: '20px' }}>
            Dung lượng file tối đa 1 MB<br/>
            Định dạng: .JPEG, .PNG
          </div>
        </Col>
      </Row>

      {/* Address Book Section Component */}
      <div style={{ borderTop: '1px solid #efefef', marginTop: '40px', paddingTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={4} style={{ margin: 0 }}>Địa chỉ của tôi</Title>
          <Button type="primary" style={{ backgroundColor: '#ee4d2d', borderColor: '#ee4d2d' }} onClick={() => openAddressModal()}>
            + Thêm địa chỉ mới
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            Bạn chưa có địa chỉ nào.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {addresses.map(addr => (
              <div key={addr.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #efefef' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 500, fontSize: '16px', color: '#333' }}>{addr.name}</span>
                    <span style={{ color: '#ccc' }}>|</span>
                    <span style={{ color: '#555' }}>{addr.phone}</span>
                  </div>
                  <div style={{ color: '#555', marginBottom: '4px' }}>{addr.addressDetail || ''}</div>
                  <div style={{ color: '#555', marginBottom: '8px' }}>
                    {(addr.fullAddress || '').replace(`${addr.addressDetail}, `, '')}
                  </div>
                  {addr.isDefault && (
                    <Tag color="red" style={{ margin: 0 }}>Mặc định</Tag>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <Space>
                    <a onClick={() => openAddressModal(addr)} style={{ color: '#0055aa' }}>Cập nhật</a>
                    {!addr.isDefault && (
                      <Popconfirm title="Xóa địa chỉ này?" onConfirm={() => handleDeleteAddress(addr.id)}>
                        <a style={{ color: '#ee4d2d' }}>Xóa</a>
                      </Popconfirm>
                    )}
                  </Space>
                  {!addr.isDefault && (
                    <Button size="small" onClick={() => handleSetDefaultAddress(addr.id)}>
                      Thiết lập mặc định
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Modal */}
      <Modal
        title={editingAddrId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
        open={addressModalVisible}
        onCancel={() => setAddressModalVisible(false)}
        onOk={handleSaveAddress}
        okText="Hoàn thành"
        cancelText="Trở lại"
        okButtonProps={{ style: { backgroundColor: '#ee4d2d', borderColor: '#ee4d2d' } }}
        width={600}
      >
        <Form form={addressForm} layout="vertical" style={{ marginTop: '20px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}>
                <Input placeholder="Họ và tên" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                <Input placeholder="Số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="provinceId" rules={[{ required: true, message: 'Chọn Tỉnh/Thành phố' }]}>
                <Select
                  placeholder="Tỉnh/Thành phố"
                  onChange={handleProvinceChange}
                  loading={addressLoading}
                  showSearch
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  {provinces.map(p => <Option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="districtId" rules={[{ required: true, message: 'Chọn Quận/Huyện' }]}>
                <Select
                  placeholder="Quận/Huyện"
                  onChange={handleDistrictChange}
                  loading={districtLoading}
                  disabled={!selectedProvince}
                  showSearch
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  {districts.map(d => <Option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="wardCode" rules={[{ required: true, message: 'Chọn Phường/Xã' }]}>
                <Select
                  placeholder="Phường/Xã"
                  onChange={handleWardChange}
                  loading={wardLoading}
                  disabled={!selectedDistrict}
                  showSearch
                  filterOption={(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
                >
                  {wards.map(w => <Option key={w.WardCode} value={w.WardCode}>{w.WardName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="addressDetail" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể' }]}>
            <Input.TextArea placeholder="Địa chỉ cụ thể" rows={2} />
          </Form.Item>

          <Form.Item name="isDefault" valuePropName="checked">
            <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserProfileCard;
