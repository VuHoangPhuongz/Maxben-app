// lib/actions.ts
'use server';

import { db } from '@/lib/firebase';
import { 
  collection, getDocs, doc, deleteDoc, addDoc, updateDoc, 
  getDoc, serverTimestamp, query, orderBy, setDoc, writeBatch
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getSession } from '@/lib/session';

// ... (Toàn bộ code của Product, Order, User, và addToCart Actions đã có của bạn nằm ở đây)

// ===============================================
// CART MANAGEMENT ACTIONS
// ===============================================

// Định nghĩa kiểu dữ liệu cho một sản phẩm trong giỏ hàng
export interface CartItem {
  id: string; // productId
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

// Hành động lấy tất cả sản phẩm trong giỏ hàng của người dùng
export async function getCartItems(): Promise<CartItem[]> {
  const session = await getSession();
  if (!session.uid) {
    return [];
  }

  try {
    const cartCol = collection(db, 'users', session.uid, 'cart');
    const cartSnapshot = await getDocs(cartCol);
    const cartList = cartSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<CartItem, 'id'>),
    }));
    return cartList;
  } catch (error) {
    console.error("Error fetching cart items: ", error);
    return [];
  }
}

// Hành động cập nhật số lượng sản phẩm trong giỏ hàng
export async function updateCartItemQuantity(productId: string, newQuantity: number) {
  const session = await getSession();
  if (!session.uid) {
    return { error: 'Bạn phải đăng nhập.' };
  }

  if (newQuantity <= 0) {
    // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
    return removeCartItem(productId);
  }

  try {
    const cartItemRef = doc(db, 'users', session.uid, 'cart', productId);
    await updateDoc(cartItemRef, { quantity: newQuantity });
    revalidatePath('/cart');
    return { success: 'Cập nhật số lượng thành công.' };
  } catch (error) {
    console.error("Error updating cart item quantity: ", error);
    return { error: 'Không thể cập nhật số lượng.' };
  }
}

// Hành động xóa một sản phẩm khỏi giỏ hàng
export async function removeCartItem(productId: string) {
  const session = await getSession();
  if (!session.uid) {
    return { error: 'Bạn phải đăng nhập.' };
  }

  try {
    const cartItemRef = doc(db, 'users', session.uid, 'cart', productId);
    await deleteDoc(cartItemRef);
    revalidatePath('/cart');
    return { success: 'Đã xóa sản phẩm khỏi giỏ hàng.' };
  } catch (error) {
    console.error("Error removing cart item: ", error);
    return { error: 'Không thể xóa sản phẩm.' };
  }
}

// Hành động tạo đơn hàng từ giỏ hàng
export async function createOrderFromCart() {
    const session = await getSession();
    if (!session.uid || !session.role) {
        return { error: 'Xác thực không thành công.' };
    }

    const cartItems = await getCartItems();
    if (cartItems.length === 0) {
        return { error: 'Giỏ hàng của bạn đang trống.' };
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderPayload = {
        userId: session.uid,
        userName: session.displayName || 'Không rõ', // Lấy tên từ session
        items: cartItems.map(item => ({ productId: item.id, productName: item.name, quantity: item.quantity, price: item.price })),
        totalAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        appliedPromotion: null, // Logic khuyến mãi có thể thêm ở đây
    };

    try {
        const batch = writeBatch(db);

        // 1. Thêm đơn hàng mới vào collection 'orders'
        const orderRef = doc(collection(db, 'orders'));
        batch.set(orderRef, orderPayload);

        // 2. Xóa tất cả các sản phẩm trong giỏ hàng
        cartItems.forEach(item => {
            const cartItemRef = doc(db, 'users', session.uid, 'cart', item.id);
            batch.delete(cartItemRef);
        });

        // Thực hiện tất cả các thao tác cùng một lúc
        await batch.commit();

        revalidatePath('/cart');
        revalidatePath('/dashboard/orders');
        return { success: 'Đặt hàng thành công!', orderId: orderRef.id };
    } catch (error) {
        console.error("Error creating order: ", error);
        return { error: 'Không thể tạo đơn hàng.' };
    }
}
