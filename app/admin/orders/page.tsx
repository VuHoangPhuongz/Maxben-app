/*
======================================================================
File: app/admin/orders/page.tsx
Mục đích: Trang này cho phép admin xem và quản lý tất cả đơn hàng
từ các đại lý.
======================================================================
*/
'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // Đảm bảo đường dẫn này đúng

// --- Định nghĩa kiểu dữ liệu ---
interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    userId: string;
    userName: string;
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
    createdAt: Timestamp;
    items: OrderItem[];
}

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

// --- Component Spinner ---
const Spinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<OrderStatus>('all');

    // Lấy dữ liệu tất cả đơn hàng từ Firestore
    useEffect(() => {
        const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Order));
            setOrders(ordersData);
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    // Hàm cập nhật trạng thái đơn hàng
    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        const orderRef = doc(db, "orders", orderId);
        try {
            await updateDoc(orderRef, { status: newStatus });
            alert("Cập nhật trạng thái thành công!");
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái: ", error);
            alert("Có lỗi xảy ra khi cập nhật trạng thái.");
        }
    };

    // Hàm định dạng màu cho từng trạng thái
    const getStatusClass = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'shipped': return 'bg-green-100 text-green-800 border-green-300';
            case 'completed': return 'bg-gray-200 text-gray-800 border-gray-400';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-gray-100 border-gray-300';
        }
    };

    // Lọc đơn hàng theo trạng thái đã chọn
    const filteredOrders = orders.filter(order => {
        if (filterStatus === 'all') return true;
        return order.status === filterStatus;
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Quản lý Đơn hàng</h1>
                <div>
                    <label htmlFor="status-filter" className="mr-2 text-sm font-medium">Lọc theo trạng thái:</label>
                    <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as OrderStatus)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="all">Tất cả</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đã giao</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            {isLoading ? <Spinner /> : (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Mã ĐH</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tên Đại lý</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Ngày đặt</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-right">Tổng tiền</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="px-5 py-4 text-sm">
                                        <p className="font-mono text-gray-700 whitespace-no-wrap">{order.id.slice(0, 8).toUpperCase()}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{order.userName}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">
                                            {order.createdAt.toDate().toLocaleDateString('vi-VN')}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-right">
                                        <p className="text-gray-900 font-semibold whitespace-no-wrap">
                                            {order.totalAmount.toLocaleString('vi-VN')} ₫
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-center">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                                            className={`px-3 py-1 border rounded-full text-xs appearance-none ${getStatusClass(order.status)}`}
                                        >
                                            <option value="pending">Chờ xử lý</option>
                                            <option value="processing">Đang xử lý</option>
                                            <option value="shipped">Đã giao</option>
                                            <option value="completed">Hoàn thành</option>
                                            <option value="cancelled">Đã hủy</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredOrders.length === 0 && (
                        <p className="text-center text-gray-500 py-10">Không có đơn hàng nào phù hợp.</p>
                    )}
                </div>
            )}
        </div>
    );
}
