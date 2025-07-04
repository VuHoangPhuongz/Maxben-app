/*
======================================================================
File: app/admin/products/page.tsx
Mục đích: Trang này cho phép admin xem danh sách, thêm, sửa, và xóa sản phẩm.
======================================================================
*/
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // Đảm bảo đường dẫn này đúng

// --- Định nghĩa kiểu dữ liệu ---
interface ProductPrice {
    [key: string]: number;
}

interface Product {
    id: string;
    name: string;
    unit: string;
    category: string;
    stock: number;
    price: ProductPrice;
}

// --- Component Spinner ---
const Spinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

// --- Component Modal ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};


export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State cho form
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [priceFields, setPriceFields] = useState<{ role: string, value: number }[]>([{ role: '', value: 0 }]);

    // Lấy dữ liệu sản phẩm từ Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(productsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (product: Product | null = null) => {
        if (product) {
            // Chế độ sửa
            setCurrentProduct(product);
            setPriceFields(Object.entries(product.price).map(([role, value]) => ({ role, value })));
        } else {
            // Chế độ thêm mới
            setCurrentProduct({ name: '', unit: '', category: '', stock: 0 });
            setPriceFields([{ role: 'daily_cap_1', value: 0 }]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setPriceFields([{ role: '', value: 0 }]);
    };
    
    const handlePriceChange = (index: number, field: 'role' | 'value', value: string | number) => {
        const newPriceFields = [...priceFields];
        if (field === 'value') {
            newPriceFields[index][field] = Number(value);
        } else {
            newPriceFields[index][field] = String(value);
        }
        setPriceFields(newPriceFields);
    };

    const addPriceField = () => {
        setPriceFields([...priceFields, { role: '', value: 0 }]);
    };

    const removePriceField = (index: number) => {
        const newPriceFields = priceFields.filter((_, i) => i !== index);
        setPriceFields(newPriceFields);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentProduct) return;

        const priceObject = priceFields.reduce((acc, field) => {
            if (field.role) {
                acc[field.role] = field.value;
            }
            return acc;
        }, {} as ProductPrice);

        const productData = {
            name: currentProduct.name,
            unit: currentProduct.unit,
            category: currentProduct.category,
            stock: Number(currentProduct.stock),
            price: priceObject
        };

        if (currentProduct.id) {
            // Cập nhật sản phẩm
            const productRef = doc(db, "products", currentProduct.id);
            await updateDoc(productRef, productData);
        } else {
            // Thêm sản phẩm mới
            await addDoc(collection(db, "products"), productData);
        }
        handleCloseModal();
    };

    const handleDelete = async (productId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
            await deleteDoc(doc(db, "products", productId));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Quản lý Sản phẩm</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    Thêm Sản phẩm mới
                </button>
            </div>

            {isLoading ? <Spinner /> : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tên sản phẩm</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Danh mục</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tồn kho</th>
                                <th className="px-5 py-3 border-b-2 border-gray-300 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="px-5 py-4 text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{product.name}</p>
                                        <p className="text-gray-600 whitespace-no-wrap text-xs">ĐVT: {product.unit}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{product.category}</p></td>
                                    <td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{product.stock.toLocaleString()}</p></td>
                                    <td className="px-5 py-4 text-sm text-center">
                                        <button onClick={() => handleOpenModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Sửa</button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentProduct?.id ? "Sửa Sản phẩm" : "Thêm Sản phẩm mới"}>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                            <input type="text" value={currentProduct?.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                            <input type="text" value={currentProduct?.category || ''} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Đơn vị tính</label>
                            <input type="text" value={currentProduct?.unit || ''} onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số lượng tồn kho</label>
                            <input type="number" value={currentProduct?.stock || 0} onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                         <h4 className="text-md font-semibold mb-2">Thiết lập giá theo vai trò</h4>
                         {priceFields.map((field, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input type="text" placeholder="Vai trò (vd: npp, daily_cap_1)" value={field.role} onChange={e => handlePriceChange(index, 'role', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                <input type="number" placeholder="Giá" value={field.value} onChange={e => handlePriceChange(index, 'value', e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                <button type="button" onClick={() => removePriceField(index)} className="px-3 py-2 bg-red-500 text-white rounded-md">&times;</button>
                            </div>
                         ))}
                         <button type="button" onClick={addPriceField} className="text-sm text-blue-600 hover:text-blue-800">+ Thêm mức giá</button>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={handleCloseModal} className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">Lưu</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
