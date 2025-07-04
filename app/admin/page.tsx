import React from 'react';

const AdminDashboardPage = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            <p>Chào mừng đến khu vực quản trị. Chỉ những người dùng có vai trò 'admin' mới có thể thấy trang này.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg">Quản lý Sản phẩm</h3>
                    <p className="text-sm text-gray-600 mt-2">Thêm, sửa, hoặc xóa sản phẩm trong hệ thống.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg">Xem Đơn hàng</h3>
                    <p className="text-sm text-gray-600 mt-2">Kiểm tra và cập nhật trạng thái các đơn hàng.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg">Quản lý Người dùng</h3>
                    <p className="text-sm text-gray-600 mt-2">Xem và thay đổi vai trò của các đại lý.</p>
                </div>
            </div>
        </div>
    );
};
