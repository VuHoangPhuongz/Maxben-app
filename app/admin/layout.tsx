'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase'; // Đảm bảo đường dẫn này đúng

// Định nghĩa lại kiểu User để sử dụng trong file này
interface User {
    uid: string;
    name: string;
    email: string;
    role: string;
}

// Component hiển thị khi đang tải
const Spinner = () => (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    setIsAuthorized(true);
                } else {
                    // Nếu không phải admin hoặc không có thông tin, chuyển hướng
                    alert("Bạn không có quyền truy cập vào trang này.");
                    router.push('/');
                }
            } else {
                // Nếu chưa đăng nhập, chuyển hướng
                router.push('/');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Cấu trúc trả về mới để tránh lỗi
    return (
        <>
            {/* Hiển thị spinner khi đang tải */}
            {isLoading && <Spinner />}

            {/* Chỉ hiển thị nội dung trang admin khi đã tải xong và được cấp quyền */}
            {!isLoading && isAuthorized && (
                <div className="flex h-screen bg-gray-50">
                    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
                        <h2 className="text-2xl font-bold mb-6 text-center">Admin Panel</h2>
                        <nav className="flex-1">
                            <ul>
                                <li className="mb-2"><a href="/admin" className="block p-2 rounded hover:bg-gray-700">Dashboard</a></li>
                                <li className="mb-2"><a href="/admin/products" className="block p-2 rounded hover:bg-gray-700">Quản lý Sản phẩm</a></li>
                                <li className="mb-2"><a href="/admin/orders" className="block p-2 rounded hover:bg-gray-700">Quản lý Đơn hàng</a></li>
                            </ul>
                        </nav>
                    </aside>
                    <main className="flex-1 p-6 overflow-y-auto">
                        {children}
                    </main>
                </div>
            )}
            
            {/* Nếu không được cấp quyền, một fragment trống sẽ được render trong khi router thực hiện chuyển hướng.
                Điều này ngăn component trả về `null` và gây lỗi. */}
        </>
    );
}