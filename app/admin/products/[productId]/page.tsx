/*
======================================================================
File: app/products/[productId]/page.tsx
Mục đích: Hiển thị thông tin chi tiết cho một sản phẩm cụ thể.
======================================================================
*/
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase'; // Đảm bảo đường dẫn này đúng

// --- Định nghĩa kiểu dữ liệu ---
interface Product {
    id: string;
    name: string;
    unit: string;
    category: string;
    stock: number;
    price: { [key: string]: number };
    description?: string; // Thêm mô tả (tùy chọn)
    imageUrl?: string; // Thêm URL hình ảnh (tùy chọn)
}

// --- Component Spinner ---
const Spinner = () => (
    <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.productId as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (productId) {
            const fetchProduct = async () => {
                setIsLoading(true);
                const productRef = doc(db, "products", productId);
                try {
                    const docSnap = await getDoc(productRef);
                    if (docSnap.exists()) {
                        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
                    } else {
                        setError("Không tìm thấy sản phẩm.");
                    }
                } catch (err) {
                    setError("Lỗi khi tải dữ liệu sản phẩm.");
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProduct();
        }
    }, [productId]);

    if (isLoading) {
        return <Spinner />;
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 text-lg">{error}</p>
                <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">
                    Quay lại
                </button>
            </div>
        );
    }
    
    if (!product) {
        return null; // Hoặc một thông báo khác
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Cột hình ảnh */}
                    <div className="p-4">
                        <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                            {/* Thay thế bằng thẻ <Image> của Next.js nếu có URL */}
                            <span className="text-gray-500">Hình ảnh sản phẩm</span>
                        </div>
                    </div>

                    {/* Cột thông tin */}
                    <div className="p-8 flex flex-col justify-between">
                        <div>
                            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{product.category}</span>
                            <h1 className="text-4xl font-bold text-gray-900 mt-4">{product.name}</h1>
                            <p className="text-gray-500 mt-2">Mã sản phẩm: {product.id}</p>
                            
                            <p className="text-lg text-gray-700 mt-6">
                                {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
                            </p>

                            <div className="mt-6">
                                <h3 className="text-lg font-semibold">Bảng giá tham khảo:</h3>
                                <ul className="list-disc list-inside mt-2 text-gray-600">
                                    {Object.entries(product.price).map(([role, value]) => (
                                        <li key={role}>
                                            <span className="font-medium capitalize">{role.replace(/_/g, ' ')}:</span>
                                            <span className="font-bold text-green-700 ml-2">{value.toLocaleString('vi-VN')} ₫</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-2xl font-bold text-gray-800">
                                    Tồn kho: <span className="text-blue-600">{product.stock.toLocaleString('vi-VN')}</span>
                                </p>
                                <p className="text-lg text-gray-600">ĐVT: {product.unit}</p>
                            </div>
                            <button className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                                Thêm vào giỏ hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
