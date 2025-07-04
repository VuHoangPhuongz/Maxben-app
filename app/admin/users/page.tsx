/*
======================================================================
File: app/admin/users/page.tsx
Mục đích: Trang này cho phép admin xem danh sách và thay đổi vai trò
của người dùng (đại lý).
======================================================================
*/
'use client';

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // Đảm bảo đường dẫn này đúng

// --- Định nghĩa kiểu dữ liệu ---
interface User {
    id: string; // Firestore document ID
    name: string;
    email: string;
    role: 'npp' | 'daily_cap_1' | 'daily_cap_2' | 'admin';
}

type UserRole = 'npp' | 'daily_cap_1' | 'daily_cap_2' | 'admin';

// --- Component Spinner ---
const Spinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Lấy dữ liệu tất cả người dùng từ Firestore
    useEffect(() => {
        const usersQuery = query(collection(db, "users"), orderBy("name", "asc"));
        
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as User));
            setUsers(usersData);
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    // Hàm cập nhật vai trò người dùng
    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (userId === 'some-admin-id-to-protect') { // Thay thế bằng ID thực của admin chính nếu cần
             alert("Không thể thay đổi vai trò của quản trị viên chính.");
             return;
        }
        
        const userRef = doc(db, "users", userId);
        try {
            await updateDoc(userRef, { role: newRole });
            alert("Cập nhật vai trò thành công!");
        } catch (error) {
            console.error("Lỗi khi cập nhật vai trò: ", error);
            alert("Có lỗi xảy ra khi cập nhật vai trò.");
        }
    };
    
    // Hàm định dạng màu cho vai trò
    const getRoleClass = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'bg-red-200 text-red-800 border-red-400';
            case 'npp': return 'bg-purple-200 text-purple-800 border-purple-400';
            case 'daily_cap_1': return 'bg-green-200 text-green-800 border-green-400';
            case 'daily_cap_2': return 'bg-blue-200 text-blue-800 border-blue-400';
            default: return 'bg-gray-200 text-gray-800 border-gray-400';
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Quản lý Người dùng</h1>
                <p className="text-gray-600 mt-1">Xem và phân quyền cho các tài khoản đại lý.</p>
            </div>

            {isLoading ? <Spinner /> : (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tên người dùng</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Email</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-center">Vai trò</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="px-5 py-4 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{user.name}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{user.email}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-center">
                                        {/* Không cho phép đổi vai trò của admin */}
                                        {user.role === 'admin' ? (
                                             <span className={`px-3 py-1 border rounded-full text-xs font-semibold ${getRoleClass(user.role)}`}>
                                                Admin
                                             </span>
                                        ) : (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                className={`px-3 py-1 border rounded-full text-xs appearance-none ${getRoleClass(user.role)}`}
                                            >
                                                <option value="npp">Nhà Phân Phối</option>
                                                <option value="daily_cap_1">Đại lý Cấp 1</option>
                                                <option value="daily_cap_2">Đại lý Cấp 2</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {users.length === 0 && (
                        <p className="text-center text-gray-500 py-10">Không tìm thấy người dùng nào.</p>
                    )}
                </div>
            )}
        </div>
    );
}
