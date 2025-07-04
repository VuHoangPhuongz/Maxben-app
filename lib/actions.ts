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

// ===============================================
// PRODUCT ACTIONS
// ===============================================

const ProductSchema = z.object({
  name: z.string().min(3, { message: 'Tên sản phẩm phải có ít nhất 3 ký tự.' }),
  unit: z.string().min(1, { message: 'Đơn vị không được để trống.' }),
  stock: z.coerce.number().int().nonnegative({ message: 'Tồn kho phải là số không âm.' }),
  price_level_1: z.coerce.number().positive({ message: 'Giá cấp 1 phải là số dương.' }),
  price_level_2: z.coerce.number().positive({ message: 'Giá cấp 2 phải là số dương.' }),
});

export type Product = z.infer<typeof ProductSchema> & { id: string };

export async function getProducts(searchQuery?: string): Promise<Product[]> {
  try {
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    let productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      productList = productList.filter(product => 
        product.name.toLowerCase().includes(lowercasedQuery)
      );
    }

    return productList;
  } catch (error) {
    console.error("Error fetching products: ", error);
    return [];
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error("Error fetching product by ID: ", error);
    return null;
  }
}

export async function createProduct(formData: FormData) {
  const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
  try {
    await addDoc(collection(db, 'products'), { ...validatedFields.data, createdAt: serverTimestamp() });
    revalidatePath('/(dashboard)/products');
    return { success: true };
  } catch (error) {
    return { error: 'Không thể tạo sản phẩm.' };
  }
}

export async function updateProduct(productId: string, formData: FormData) {
  const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) return { errors: validatedFields.error.flatten().fieldErrors };
  try {
    await updateDoc(doc(db, 'products', productId), { ...validatedFields.data, updatedAt: serverTimestamp() });
    revalidatePath('/(dashboard)/products');
    revalidatePath(`/(dashboard)/products/edit/${productId}`);
    return { success: true };
  } catch (error) {
    return { error: 'Không thể cập nhật sản phẩm.' };
  }
}

export async function deleteProduct(productId: string) {
  try {
    await deleteDoc(doc(db, 'products', productId));
    revalidatePath('/(dashboard)/products');
    return { success: 'Product deleted successfully.' };
  } catch (error) {
    return { error: 'Failed to delete product.' };
  }
}

// ===============================================
// ORDER ACTIONS (Admin & User)
// ===============================================

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'completed', 'cancelled'] as const;

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: { productId: string; productName: string; quantity: number; price: number; }[];
  totalAmount: number;
  status: typeof ORDER_STATUSES[number];
  createdAt: { seconds: number; nanoseconds: number; };
  appliedPromotion: string | null;
}

export async function getOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const orderSnapshot = await getDocs(q);
    return orderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
  } catch (error) {
    console.error("Error fetching orders: ", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: typeof ORDER_STATUSES[number]) {
  if (!ORDER_STATUSES.includes(status)) return { error: 'Invalid status value.' };
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
    revalidatePath('/(dashboard)/orders');
    return { success: 'Order status updated successfully.' };
  } catch (error) {
    return { error: 'Failed to update order status.' };
  }
}

export async function getOrderForUser(orderId: string): Promise<Order | null> {
  const session = await getSession();
  if (!session.uid) return null;
  try {
    const orderSnap = await getDoc(doc(db, 'orders', orderId));
    if (!orderSnap.exists()) return null;
    const orderData = orderSnap.data() as Omit<Order, 'id'>;
    if (orderData.userId !== session.uid && session.role !== 'admin') return null;
    return { id: orderSnap.id, ...orderData };
  } catch (error) {
    console.error("Error fetching order details: ", error);
    return null;
  }
}

// ===============================================
// USER ACTIONS (Admin)
// ===============================================

export const USER_ROLES = ['admin', 'daily_cap_1', 'daily_cap_2', 'user'] as const;

export interface AppUser {
  uid: string;
  email?: string;
  displayName?: string;
  role: typeof USER_ROLES[number];
  createdAt: string;
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    const userRecords = await adminAuth.listUsers();
    const usersCollection = await adminDb.collection('users').get();
    const usersData = new Map(usersCollection.docs.map(doc => [doc.id, doc.data()]));
    return userRecords.users.map(user => {
      const userData = usersData.get(user.uid);
      return {
        uid: user.uid,
        email: user.email,
        displayName: userData?.name || user.displayName || 'N/A',
        role: userData?.role || 'user',
        createdAt: new Date(user.metadata.creationTime).toLocaleDateString('vi-VN'),
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function updateUserRole(uid: string, role: typeof USER_ROLES[number]) {
  if (!USER_ROLES.includes(role)) return { error: 'Invalid role.' };
  try {
    await adminDb.collection('users').doc(uid).update({ role });
    await adminAuth.setCustomUserClaims(uid, { role });
    revalidatePath('/(dashboard)/users');
    return { success: 'User role updated successfully.' };
  } catch (error) {
    return { error: 'Failed to update user role.' };
  }
}

// ===============================================
// CART ACTIONS (User)
// ===============================================

export interface CartItem {
  id: string; // productId
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

export async function getCartItems(): Promise<CartItem[]> {
  const session = await getSession();
  if (!session.uid) return [];
  try {
    const cartSnapshot = await getDocs(collection(db, 'users', session.uid, 'cart'));
    return cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CartItem[];
  } catch (error) {
    console.error("Error fetching cart items: ", error);
    return [];
  }
}

export async function addToCart(productId: string, quantity: number) {
  const session = await getSession();
  if (!session.uid || !session.role) return { error: 'Bạn phải đăng nhập.' };
  if (quantity <= 0) return { error: 'Số lượng phải lớn hơn 0.' };

  try {
    const productSnap = await getDoc(doc(db, 'products', productId));
    if (!productSnap.exists()) return { error: 'Sản phẩm không tồn tại.' };
    const productData = productSnap.data();

    let price;
    if (session.role === 'daily_cap_1') price = productData.price_level_1;
    else if (session.role === 'daily_cap_2') price = productData.price_level_2;
    else return { error: 'Vai trò của bạn không được phép mua hàng.' };

    const cartItemRef = doc(db, 'users', session.uid, 'cart', productId);
    const cartItemSnap = await getDoc(cartItemRef);

    if (cartItemSnap.exists()) {
      await updateDoc(cartItemRef, { quantity: cartItemSnap.data().quantity + quantity });
    } else {
      await setDoc(cartItemRef, { productId, name: productData.name, unit: productData.unit, price, quantity, addedAt: serverTimestamp() });
    }
    revalidatePath(`/products/${productId}`);
    return { success: 'Đã thêm sản phẩm vào giỏ hàng!' };
  } catch (error) {
    return { error: 'Không thể thêm sản phẩm vào giỏ hàng.' };
  }
}

export async function updateCartItemQuantity(productId: string, newQuantity: number) {
  const session = await getSession();
  if (!session.uid) return { error: 'Bạn phải đăng nhập.' };
  if (newQuantity <= 0) return removeCartItem(productId);
  try {
    await updateDoc(doc(db, 'users', session.uid, 'cart', productId), { quantity: newQuantity });
    revalidatePath('/cart');
    return { success: 'Cập nhật số lượng thành công.' };
  } catch (error) {
    return { error: 'Không thể cập nhật số lượng.' };
  }
}

export async function removeCartItem(productId: string) {
  const session = await getSession();
  if (!session.uid) return { error: 'Bạn phải đăng nhập.' };
  try {
    await deleteDoc(doc(db, 'users', session.uid, 'cart', productId));
    revalidatePath('/cart');
    return { success: 'Đã xóa sản phẩm khỏi giỏ hàng.' };
  } catch (error) {
    return { error: 'Không thể xóa sản phẩm.' };
  }
}

export async function createOrderFromCart() {
  const session = await getSession();
  if (!session.uid || !session.role) return { error: 'Xác thực không thành công.' };
  const cartItems = await getCartItems();
  if (cartItems.length === 0) return { error: 'Giỏ hàng của bạn đang trống.' };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderPayload = {
    userId: session.uid,
    userName: (session as any).displayName || 'Không rõ',
    items: cartItems.map(item => ({ productId: item.id, productName: item.name, quantity: item.quantity, price: item.price })),
    totalAmount,
    status: 'pending',
    createdAt: serverTimestamp(),
    appliedPromotion: null,
  };

  try {
    const batch = writeBatch(db);
    const orderRef = doc(collection(db, 'orders'));
    batch.set(orderRef, orderPayload);
    cartItems.forEach(item => batch.delete(doc(db, 'users', session.uid, 'cart', item.id)));
    await batch.commit();
    revalidatePath('/cart');
    revalidatePath('/dashboard/orders');
    return { success: 'Đặt hàng thành công!', orderId: orderRef.id };
  } catch (error) {
    return { error: 'Không thể tạo đơn hàng.' };
  }
}
