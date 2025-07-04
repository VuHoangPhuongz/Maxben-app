// lib/actions.ts
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, getDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ... (Các schema và actions của Product đã có ở trên)

// ===============================================
// ORDER ACTIONS
// ===============================================

// Định nghĩa các trạng thái đơn hàng có thể có
export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'] as const;

// Định nghĩa kiểu dữ liệu cho một sản phẩm trong đơn hàng
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// Định nghĩa kiểu dữ liệu cho một đơn hàng
export interface Order {
  id: string;
  userId: string;
  userName: string; // Tên người đặt hàng để hiển thị
  items: OrderItem[];
  totalAmount: number;
  status: typeof ORDER_STATUSES[number];
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  appliedPromotion: string | null; // Đảm bảo là null nếu không có
}

// Hành động lấy tất cả đơn hàng, sắp xếp theo ngày tạo mới nhất
export async function getOrders(): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    // Sắp xếp theo 'createdAt' giảm dần để đơn mới nhất lên đầu
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    const orderSnapshot = await getDocs(q);
    const orderList = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Order, 'id'>),
    }));
    return orderList;
  } catch (error) {
    console.error("Error fetching orders: ", error);
    return [];
  }
}

// Hành động cập nhật trạng thái đơn hàng
export async function updateOrderStatus(orderId: string, status: typeof ORDER_STATUSES[number]) {
  if (!orderId || !status) {
    return { error: 'Order ID and status are required.' };
  }
  if (!ORDER_STATUSES.includes(status)) {
    return { error: 'Invalid status value.' };
  }

  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, { status });
    revalidatePath('/(dashboard)/orders'); // Cập nhật lại trang danh sách đơn hàng
    return { success: 'Order status updated successfully.' };
  } catch (error) {
    console.error("Error updating order status: ", error);
    return { error: 'Failed to update order status.' };
  }
}

// ... (Các hàm khác đã có)
// Chú ý: Đảm bảo bạn đã có các hàm của Product ở đây
export interface Product {
  id: string;
  name: string;
  unit: string;
  stock: number;
  price_level_1: number;
  price_level_2: number;
}
export async function getProducts(): Promise<Product[]> {
  try {
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    const productList = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Product, 'id'>),
    }));
    return productList;
  } catch (error) {
    console.error("Error fetching products: ", error);
    return [];
  }
}
// ...vân vân
