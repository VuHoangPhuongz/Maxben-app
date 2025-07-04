/*
======================================================================
File: app/page.tsx (Bản nâng cấp Giai đoạn 3 - Trang xem Khuyến mãi)
Mục đích: Thêm trang cho phép đại lý xem các chương trình khuyến mãi
đang hoạt động và hoàn thiện luồng quản lý cho admin.
======================================================================
*/
'use client';

import React, { useState, useEffect, useCallback, useRef, FormEvent } from 'react';

// --- TÍCH HỢP FIREBASE & CÁC THƯ VIỆN ---
import { initializeApp } from "firebase/app";
import { 
    getAuth,
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
    getFirestore,
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    onSnapshot,
    writeBatch,
    query,
    where,
    getDocs,
    runTransaction,
    Timestamp,
    orderBy,
    addDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- CẤU HÌNH VÀ KHỞI TẠO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyD6GHPj8rCumKGyJRvIneCJrA8fcm98Z7g",
  authDomain: "b2bweb-app.firebaseapp.com",
  projectId: "b2bweb-app",
  storageBucket: "b2bweb-app.appspot.com",
  messagingSenderId: "868675766167",
  appId: "1:868675766167:web:d45c3e9c712af8ea9666d2",
  measurementId: "G-MYSP5EWXQ6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- ĐỊNH NGHĨA CÁC KIỂU DỮ LIỆU (TYPESCRIPT) ---
interface ProductPrice { [key: string]: number; }
interface Product { id: string; name: string; unit: string; category: string; stock: number; price: ProductPrice; description?: string; imageUrl?: string; }
interface User { uid: string; name: string; email: string; role: 'npp' | 'daily_cap_1' | 'daily_cap_2' | 'admin'; }
interface CartItem { id: string; productId: string; name: string; unit: string; price: number; quantity: number; category: string; }
interface Order { id: string; userId: string; userName: string; userRole: string; items: Omit<CartItem, 'id'>[]; subTotal: number; discountAmount: number; totalAmount: number; appliedPromotion?: { id: string; code: string; }; status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'; createdAt: Timestamp; }
interface Promotion { id: string; code: string; description: string; discountType: 'percentage' | 'fixed'; discountValue: number; conditions: { minAmount?: number; productCategory?: string; userRole?: string; }; isActive: boolean; }
type NotificationType = { type: 'success' | 'error' | 'info'; message: string; };
type UserView = { page: 'dashboard' | 'products' | 'productDetail' | 'cart' | 'orders' | 'promotions'; detailId?: string | null; }
type AdminView = { page: 'adminDashboard' | 'adminProducts' | 'adminOrders' | 'adminUsers' | 'adminPromotions'; }

// --- DỮ LIỆU MẪU ---
const SAMPLE_PRODUCTS: Omit<Product, 'id'>[] = [
    { name: 'Xi măng PCB40 Hoàng Thạch', unit: 'Bao', category: 'Xi măng', stock: 1000, price: { 'daily_cap_1': 85000, 'daily_cap_2': 87000, 'npp': 82000 } },
    { name: 'Thép Pomina D10', unit: 'Cây', category: 'Thép', stock: 500, price: { 'daily_cap_1': 150000, 'daily_cap_2': 152000, 'npp': 148000 } },
];
const SAMPLE_USERS = [
    { email: 'npp@example.com', password: 'password', name: 'Nhà Phân Phối Trung Tâm', role: 'npp' },
    { email: 'daily1@example.com', password: 'password', name: 'Đại lý Cấp 1 An Khang', role: 'daily_cap_1' },
    { email: 'daily2@example.com', password: 'password', name: 'Cửa hàng VLXD Bình An', role: 'daily_cap_2' },
    { email: 'admin@example.com', password: 'password', name: 'Quản Trị Viên', role: 'admin' },
];

// --- BIỂU TƯỢNG (ICONS) ---
const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"></path><path d="M12 22V12"></path><path d="m21 10-7 4-7-4"></path><path d="m3 10 7 4 7-4"></path></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29a2.82 2.82 0 0 0 4 0L22 12l-9.29-9.29A2.82 2.82 0 0 0 12 2z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;


// --- CÁC COMPONENT CON ---
const Spinner = () => <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
interface ModalProps { isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string; }
const FormModal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl"><div className="flex justify-between items-center border-b pb-3 mb-4"><h3 className="text-xl font-bold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button></div>{children}</div></div>; };
const ConfirmModal: React.FC<Omit<ModalProps, 'children'> & {onConfirm: () => void}> = ({ isOpen, onClose, onConfirm, title }) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"><h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3><p>Bạn có chắc chắn muốn thực hiện hành động này?</p><div className="mt-6 flex justify-end space-x-4"><button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button><button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Xác nhận</button></div></div></div>; };
interface LoginPageProps { setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>; }
const LoginPage: React.FC<LoginPageProps> = ({ setNotification }) => { const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [isLoading, setIsLoading] = useState(false); const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); try { await signInWithEmailAndPassword(auth, email, password); } catch (error) { setNotification({ type: 'error', message: 'Email hoặc mật khẩu không đúng.' }); } finally { setIsLoading(false); } }; return <div className="flex items-center justify-center min-h-screen bg-gray-100"><div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md"><div className="text-center"><h1 className="text-3xl font-bold text-gray-900">Cổng Thông Tin Đại Lý</h1><p className="mt-2 text-gray-600">Vui lòng đăng nhập để tiếp tục</p></div><form className="space-y-6" onSubmit={handleLogin}><div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="npp@example.com" /></div><div><label className="block text-sm font-medium text-gray-700">Mật khẩu</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="password" /></div><button type="submit" disabled={isLoading} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center">{isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Đăng nhập'}</button></form><div className="text-sm text-gray-500 text-center"><p className="font-semibold">Tài khoản mẫu:</p><p>npp@example.com / password</p><p>daily1@example.com / password</p><p>admin@example.com / password</p></div></div></div>; };

// --- CÁC COMPONENT TRANG CHO ĐẠI LÝ ---
interface ProductCardProps { product: Product; userRole: string; onAddToCart: (product: Product, quantity: number) => void; onViewDetail: (productId: string) => void; }
const ProductCard: React.FC<ProductCardProps> = ({ product, userRole, onAddToCart, onViewDetail }) => { const price = product.price[userRole] || 'N/A'; const [quantity, setQuantity] = useState(1); const handleAddToCartClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (quantity > 0 && quantity <= product.stock) { onAddToCart(product, quantity); setQuantity(1); } }; return <div onClick={() => onViewDetail(product.id)} className="cursor-pointer block hover:shadow-xl transition-shadow duration-300 rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full"><div className="p-4 flex-grow"><span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{product.category}</span><h3 className="text-lg font-semibold text-gray-800 mt-2">{product.name}</h3><p className="text-sm text-gray-500">ĐVT: {product.unit}</p><p className={`text-xl font-bold mt-2 ${price === 'N/A' ? 'text-red-500' : 'text-green-600'}`}>{price !== 'N/A' ? `${(price as number).toLocaleString('vi-VN')} ₫` : 'Liên hệ'}</p><p className={`text-sm mt-1 ${product.stock > 0 ? 'text-gray-600' : 'text-red-500'}`}>Tồn kho: {product.stock > 0 ? product.stock.toLocaleString('vi-VN') : 'Hết hàng'}</p></div>{product.stock > 0 && price !== 'N/A' && (<div className="p-4 bg-gray-50 border-t"><div className="flex items-center space-x-2"><input type="number" value={quantity} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" max={product.stock} className="w-20 px-2 py-1 border border-gray-300 rounded-md" /><button onClick={handleAddToCartClick} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">Thêm vào giỏ</button></div></div>)}</div>; };
interface ProductsPageProps { user: User; setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>; setView: (view: UserView) => void; }
const ProductsPage: React.FC<ProductsPageProps> = ({ user, setNotification, setView }) => { const [products, setProducts] = useState<Product[]>([]); const [isLoading, setIsLoading] = useState(true); const [searchTerm, setSearchTerm] = useState(''); const [selectedCategory, setSelectedCategory] = useState('all'); const [stockStatus, setStockStatus] = useState('all'); const [priceRange, setPriceRange] = useState({ min: '', max: '' }); useEffect(() => { const productsCollection = collection(db, "products"); const unsubscribe = onSnapshot(productsCollection, (snapshot) => { setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))); setIsLoading(false); }); return () => unsubscribe(); }, []); const handleAddToCart = async (product: Product, quantity: number) => { if (!user) return; const cartRef = doc(db, `users/${user.uid}/cart/${product.id}`); try { await runTransaction(db, async (transaction) => { const cartDoc = await transaction.get(cartRef); if (!cartDoc.exists()) { transaction.set(cartRef, { productId: product.id, name: product.name, unit: product.unit, price: product.price[user.role], quantity: quantity, category: product.category }); } else { const newQuantity = cartDoc.data().quantity + quantity; transaction.update(cartRef, { quantity: newQuantity }); } }); setNotification({ type: 'success', message: `Đã thêm ${product.name} vào giỏ hàng.` }); } catch (error) { setNotification({ type: 'error', message: 'Lỗi khi thêm vào giỏ hàng.' }); } }; const categories = ['all', ...new Set(products.map(p => p.category))]; const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => { setPriceRange({ ...priceRange, [e.target.name]: e.target.value }); }; const filteredProducts = products.filter(p => { const term = searchTerm.toLowerCase(); return p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term); }).filter(p => selectedCategory === 'all' || p.category === selectedCategory).filter(p => { if (stockStatus === 'inStock') return p.stock > 0; if (stockStatus === 'outOfStock') return p.stock === 0; return true; }).filter(p => { const userPrice = p.price[user.role]; if (userPrice === undefined) return false; const min = parseFloat(priceRange.min); const max = parseFloat(priceRange.max); if (!isNaN(min) && userPrice < min) return false; if (!isNaN(max) && userPrice > max) return false; return true; }); if (isLoading) return <Spinner />; return <div className="p-6"><h1 className="text-3xl font-bold text-gray-800 mb-4">Danh mục sản phẩm</h1><div className="p-4 bg-white rounded-lg shadow-sm mb-6 border"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"><div><label className="text-sm font-medium text-gray-700 block mb-1">Tìm kiếm (Tên, Mã SP)</label><input type="text" placeholder="VD: Xi măng, SP001..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" /></div><div><label className="text-sm font-medium text-gray-700 block mb-1">Danh mục</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"><option value="all">Tất cả danh mục</option>{categories.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div><div><label className="text-sm font-medium text-gray-700 block mb-1">Tình trạng kho</label><select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"><option value="all">Tất cả</option><option value="inStock">Còn hàng</option><option value="outOfStock">Hết hàng</option></select></div><div><label className="text-sm font-medium text-gray-700 block mb-1">Khoảng giá</label><div className="flex items-center space-x-2"><input name="min" type="number" placeholder="Từ" value={priceRange.min} onChange={handlePriceChange} className="w-1/2 px-3 py-2 border border-gray-300 rounded-md" /><input name="max" type="number" placeholder="Đến" value={priceRange.max} onChange={handlePriceChange} className="w-1/2 px-3 py-2 border border-gray-300 rounded-md" /></div></div></div></div>{filteredProducts.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredProducts.map(product => (<ProductCard key={product.id} product={product} userRole={user.role} onAddToCart={handleAddToCart} onViewDetail={(productId) => setView({ page: 'productDetail', detailId: productId })} />))}</div>) : (<div className="text-center py-16"><p className="text-gray-600">Không tìm thấy sản phẩm nào phù hợp.</p></div>)}</div>; };
interface CartPageProps { user: User; setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>; setView: (view: UserView) => void; }
const CartPage: React.FC<CartPageProps> = ({ user, setNotification, setView }) => { const [cartItems, setCartItems] = useState<CartItem[]>([]); const [promotions, setPromotions] = useState<Promotion[]>([]); const [isLoading, setIsLoading] = useState(true); const [isModalOpen, setIsModalOpen] = useState(false); useEffect(() => { if (!user) return; const cartUnsub = onSnapshot(collection(db, `users/${user.uid}/cart`), (snapshot) => { const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem)); setCartItems(items); setIsLoading(false); }); const promoUnsub = onSnapshot(query(collection(db, "promotions"), where("isActive", "==", true)), (snapshot) => { setPromotions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion))); }); return () => { cartUnsub(); promoUnsub(); }; }, [user]); const subTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0); let discountAmount = 0; let appliedPromotion: Promotion | null = null; for (const promo of promotions) { let isEligible = true; const { minAmount, productCategory, userRole } = promo.conditions; if (userRole && userRole !== user.role) isEligible = false; if (minAmount && subTotal < minAmount) isEligible = false; if (productCategory && !cartItems.some(item => item.category === productCategory)) isEligible = false; if (isEligible) { let currentDiscount = 0; if (promo.discountType === 'percentage') { currentDiscount = subTotal * (promo.discountValue / 100); } else { currentDiscount = promo.discountValue; } if (currentDiscount > discountAmount) { discountAmount = currentDiscount; appliedPromotion = promo; } } } const totalAmount = subTotal - discountAmount; const handlePlaceOrder = async () => { setIsModalOpen(false); if (cartItems.length === 0) return; const orderRef = collection(db, "orders"); const newOrder: Omit<Order, 'id'> = { userId: user.uid, userName: user.name, userRole: user.role, items: cartItems.map(({ id, ...item }) => item), subTotal, discountAmount, totalAmount, appliedPromotion: appliedPromotion ? { id: appliedPromotion.id, code: appliedPromotion.code } : undefined, status: 'pending', createdAt: Timestamp.now(), }; try { await runTransaction(db, async (transaction) => { const productRefs = cartItems.map(item => doc(db, "products", item.productId)); const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref))); for (let i = 0; i < productDocs.length; i++) { const productDoc = productDocs[i]; const cartItem = cartItems[i]; if (!productDoc.exists() || productDoc.data().stock < cartItem.quantity) throw new Error(`Sản phẩm "${cartItem.name}" không đủ tồn kho.`); } transaction.set(doc(orderRef), newOrder); productDocs.forEach((productDoc, i) => { const cartItem = cartItems[i]; const newStock = productDoc.data().stock - cartItem.quantity; transaction.update(productDoc.ref, { stock: newStock }); }); const cartItemRefs = cartItems.map(item => doc(db, `users/${user.uid}/cart`, item.id)); cartItemRefs.forEach(ref => transaction.delete(ref)); }); setNotification({ type: 'success', message: 'Đặt hàng thành công!' }); setView({ page: 'orders' }); } catch (error: any) { setNotification({ type: 'error', message: error.message || 'Lỗi khi đặt hàng.' }); } }; if (isLoading) return <Spinner />; return <div className="p-6"><h1 className="text-3xl font-bold text-gray-800 mb-6">Giỏ hàng</h1>{cartItems.length > 0 ? (<div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm"><ul className="divide-y divide-gray-200">{cartItems.map(item => (<li key={item.id} className="py-4 flex items-center justify-between"><div><p className="font-semibold text-gray-800">{item.name}</p><p className="text-sm text-gray-500">Số lượng: {item.quantity}</p></div><p className="font-semibold text-gray-800">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</p></li>))}</ul></div><div className="bg-white p-6 rounded-lg shadow-sm h-fit space-y-4"><div><h2 className="text-xl font-bold mb-4">Tổng cộng</h2><div className="space-y-2"><div className="flex justify-between"><span>Tạm tính:</span><span>{subTotal.toLocaleString('vi-VN')} ₫</span></div>{discountAmount > 0 && (<div className="flex justify-between text-green-600"><span>Khuyến mãi ({appliedPromotion?.code}):</span><span>- {discountAmount.toLocaleString('vi-VN')} ₫</span></div>)}<div className="flex justify-between text-lg font-bold text-gray-800 border-t pt-2"><span>Thành tiền:</span><span>{totalAmount.toLocaleString('vi-VN')} ₫</span></div></div></div><button onClick={() => setIsModalOpen(true)} className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Tiến hành đặt hàng</button></div></div>) : (<p className="text-center text-gray-500 mt-10">Giỏ hàng của bạn đang trống.</p>)}<ConfirmModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handlePlaceOrder} title="Xác nhận đặt hàng" /></div>; };
interface OrdersPageProps { user: User; }
const OrdersPage: React.FC<OrdersPageProps> = ({ user }) => { const [orders, setOrders] = useState<Order[]>([]); const [isLoading, setIsLoading] = useState(true); useEffect(() => { if (!user) return; const ordersQuery = query(collection(db, "orders"), where('userId', '==', user.uid)); const unsubscribe = onSnapshot(ordersQuery, (snapshot) => { const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)); ordersData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()); setOrders(ordersData); setIsLoading(false); }); return () => unsubscribe(); }, [user]); const getStatusClass = (status: Order['status']) => { switch (status) { case 'pending': return 'bg-yellow-100 text-yellow-800'; case 'processing': return 'bg-blue-100 text-blue-800'; case 'shipped': return 'bg-green-100 text-green-800'; case 'completed': return 'bg-gray-100 text-gray-800'; case 'cancelled': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100'; } }; if (isLoading) return <Spinner />; return <div className="p-6"><h1 className="text-3xl font-bold text-gray-800 mb-6">Lịch sử đơn hàng</h1>{orders.length > 0 ? (<div className="space-y-4">{orders.map(order => (<div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border"><div className="flex justify-between items-start"><div><p className="font-bold text-blue-600">Mã ĐH: {order.id.slice(0, 8).toUpperCase()}</p><p className="text-sm text-gray-500">Ngày đặt: {order.createdAt.toDate().toLocaleDateString('vi-VN')}</p></div><span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(order.status)}`}>{order.status}</span></div><div className="mt-4"><ul className="divide-y divide-gray-100">{order.items.map((item, index) => (<li key={index} className="py-2 flex justify-between text-sm"><span>{item.name} (x{item.quantity})</span><span className="text-gray-600">{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span></li>))}</ul></div><div className="mt-4 pt-2 border-t text-right"><p className="font-bold">Tổng tiền: {order.totalAmount.toLocaleString('vi-VN')} ₫</p></div></div>))}</div>) : (<p className="text-center text-gray-500 mt-10">Bạn chưa có đơn hàng nào.</p>)}</div>; };
interface DashboardPageProps { user: User; }
const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => { const [orders, setOrders] = useState<Order[]>([]); const [isLoading, setIsLoading] = useState(true); useEffect(() => { if (!user) return; const ordersQuery = query(collection(db, "orders"), where('userId', '==', user.uid)); const unsubscribe = onSnapshot(ordersQuery, (snapshot) => { const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)); setOrders(ordersData); setIsLoading(false); }, () => setIsLoading(false)); return () => unsubscribe(); }, [user]); const totalSpent = orders.reduce((acc, order) => acc + order.totalAmount, 0); const orderStatusCounts = orders.reduce((acc, order) => { acc[order.status] = (acc[order.status] || 0) + 1; return acc; }, {} as Record<string, number>); const chartData = [ { name: 'Chờ xử lý', count: orderStatusCounts.pending || 0 }, { name: 'Đang xử lý', count: orderStatusCounts.processing || 0 }, { name: 'Đã giao', count: orderStatusCounts.shipped || 0 }, { name: 'Hoàn thành', count: orderStatusCounts.completed || 0 }, ]; if (isLoading) return <Spinner />; return <div className="p-6"><h1 className="text-3xl font-bold text-gray-800 mb-2">Chào mừng, {user.name}!</h1><p className="text-gray-600 mb-6">Đây là trang tổng quan kinh doanh của bạn.</p><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"><div className="bg-white p-6 rounded-lg shadow-sm border"><h3 className="text-gray-500">Tổng số đơn hàng</h3><p className="text-3xl font-bold text-blue-600">{orders.length}</p></div><div className="bg-white p-6 rounded-lg shadow-sm border"><h3 className="text-gray-500">Tổng chi tiêu</h3><p className="text-3xl font-bold text-green-600">{totalSpent.toLocaleString('vi-VN')} ₫</p></div><div className="bg-white p-6 rounded-lg shadow-sm border"><h3 className="text-gray-500">Cấp đại lý</h3><p className="text-3xl font-bold text-purple-600 capitalize">{user.role.replace(/_/g, ' ')}</p></div></div><div className="bg-white p-6 rounded-lg shadow-sm border"><h2 className="text-xl font-bold mb-4">Thống kê trạng thái đơn hàng</h2><div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip formatter={(value: number) => [`${value} đơn`, 'Số lượng']} /><Legend /><Bar dataKey="count" fill="#3b82f6" name="Số lượng đơn" /></BarChart></ResponsiveContainer></div></div></div>; };
interface ProductDetailPageProps { user: User; productId: string; setView: (view: UserView) => void; setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>; }
const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ user, productId, setView, setNotification }) => { const [product, setProduct] = useState<Product | null>(null); const [isLoading, setIsLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [quantity, setQuantity] = useState(1); useEffect(() => { if (productId) { const fetchProduct = async () => { setIsLoading(true); const productRef = doc(db, "products", productId); try { const docSnap = await getDoc(productRef); if (docSnap.exists()) { setProduct({ id: docSnap.id, ...docSnap.data() } as Product); } else { setError("Không tìm thấy sản phẩm."); } } catch (err) { setError("Lỗi khi tải dữ liệu sản phẩm."); } finally { setIsLoading(false); } }; fetchProduct(); } }, [productId]); const handleAddToCart = async () => { if (!user || !product) return; const cartRef = doc(db, `users/${user.uid}/cart/${product.id}`); try { await runTransaction(db, async (transaction) => { const cartDoc = await transaction.get(cartRef); if (!cartDoc.exists()) { transaction.set(cartRef, { productId: product.id, name: product.name, unit: product.unit, price: product.price[user.role], quantity: quantity, category: product.category }); } else { const newQuantity = cartDoc.data().quantity + quantity; transaction.update(cartRef, { quantity: newQuantity }); } }); setNotification({ type: 'success', message: `Đã thêm ${product.name} vào giỏ hàng.` }); } catch (error) { setNotification({ type: 'error', message: 'Lỗi khi thêm vào giỏ hàng.' }); } }; if (isLoading) return <div className="p-6"><Spinner /></div>; if (error) return <div className="p-6 text-center text-red-500">{error}</div>; if (!product) return null; return <div className="p-4 md:p-8"><button onClick={() => setView({ page: 'products' })} className="flex items-center text-blue-600 hover:underline mb-4"><ArrowLeftIcon /> <span className="ml-2">Quay lại danh sách</span></button><div className="bg-white rounded-lg shadow-lg overflow-hidden"><div className="grid grid-cols-1 md:grid-cols-2"><div className="p-4"><div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg"><span className="text-gray-500">Hình ảnh sản phẩm</span></div></div><div className="p-8 flex flex-col justify-between"><div><span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{product.category}</span><h1 className="text-4xl font-bold text-gray-900 mt-4">{product.name}</h1><p className="text-gray-500 mt-2">Mã sản phẩm: {product.id}</p><p className="text-lg text-gray-700 mt-6">{product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}</p><div className="mt-6"><h3 className="text-lg font-semibold">Bảng giá tham khảo:</h3><ul className="list-disc list-inside mt-2 text-gray-600">{Object.entries(product.price).map(([role, value]) => (<li key={role}><span className="font-medium capitalize">{role.replace(/_/g, ' ')}:</span><span className="font-bold text-green-700 ml-2">{value.toLocaleString('vi-VN')} ₫</span></li>))}</ul></div></div><div className="mt-8 border-t pt-6"><div className="flex items-center justify-between mb-4"><p className="text-2xl font-bold text-gray-800">Tồn kho: <span className="text-blue-600">{product.stock.toLocaleString('vi-VN')}</span></p><p className="text-lg text-gray-600">ĐVT: {product.unit}</p></div><div className="flex items-center space-x-2"><input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" max={product.stock} className="w-24 px-3 py-2 border border-gray-300 rounded-md" /><button onClick={handleAddToCart} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">Thêm vào giỏ hàng</button></div></div></div></div></div></div>; };

// --- CÁC COMPONENT TRANG CHO ADMIN ---
const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState({ userCount: 0, productCount: 0, orderCount: 0, totalRevenue: 0 });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, "users"));
                const productsSnapshot = await getDocs(collection(db, "products"));
                const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "asc"));
                const ordersSnapshot = await getDocs(ordersQuery);

                const ordersData = ordersSnapshot.docs.map(doc => doc.data() as Order);
                
                const totalRevenue = ordersData
                    .filter(order => order.status === 'completed')
                    .reduce((sum, order) => sum + order.totalAmount, 0);
                
                // Xử lý dữ liệu cho biểu đồ doanh thu
                const dailyRevenue = ordersData
                    .filter(order => order.status === 'completed')
                    .reduce((acc, order) => {
                        const date = order.createdAt.toDate().toLocaleDateString('vi-VN');
                        acc[date] = (acc[date] || 0) + order.totalAmount;
                        return acc;
                    }, {} as Record<string, number>);

                const formattedRevenueData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
                    date,
                    revenue,
                }));

                setStats({
                    userCount: usersSnapshot.size,
                    productCount: productsSnapshot.size,
                    orderCount: ordersSnapshot.size,
                    totalRevenue: totalRevenue,
                });
                setRevenueData(formattedRevenueData);

                const pendingOrders = ordersData
                    .filter(order => order.status === 'pending')
                    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                    .slice(0, 5);
                setRecentOrders(pendingOrders);

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard admin: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const StatCard = ({ title, value, icon, formatAsCurrency = false }: { title: string, value: number, icon: JSX.Element, formatAsCurrency?: boolean }) => (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">
                    {formatAsCurrency ? value.toLocaleString('vi-VN') + ' ₫' : value.toLocaleString('vi-VN')}
                </p>
            </div>
        </div>
    );
    
    const getStatusClass = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100';
        }
    };

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Tổng quan hệ thống</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Tổng Doanh thu" value={stats.totalRevenue} icon={<DollarSignIcon />} formatAsCurrency />
                <StatCard title="Tổng Số Đơn hàng" value={stats.orderCount} icon={<ClipboardListIcon />} />
                <StatCard title="Số Lượng Sản phẩm" value={stats.productCount} icon={<PackageIcon />} />
                <StatCard title="Số Lượng Đại lý" value={stats.userCount} icon={<UsersIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Biểu đồ Doanh thu</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value as number)}/>
                                <Tooltip formatter={(value) => [`${(value as number).toLocaleString('vi-VN')} ₫`, "Doanh thu"]}/>
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Doanh thu"/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Đơn hàng mới</h2>
                    <div className="space-y-4">
                        {recentOrders.length > 0 ? recentOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-gray-800">{order.userName}</p>
                                    <p className="text-xs text-gray-500">{order.createdAt.toDate().toLocaleDateString('vi-VN')}</p>
                                </div>
                                <p className="font-bold text-indigo-600">{order.totalAmount.toLocaleString('vi-VN')} ₫</p>
                            </div>
                        )) : <p className="text-center text-gray-500 py-10">Không có đơn hàng mới nào.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
const AdminProductsPage: React.FC = () => { const [products, setProducts] = useState<Product[]>([]); const [isLoading, setIsLoading] = useState(true); const [isModalOpen, setIsModalOpen] = useState(false); const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null); const [priceFields, setPriceFields] = useState<{ role: string, value: number }[]>([{ role: '', value: 0 }]); useEffect(() => { const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => { const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)); setProducts(productsData); setIsLoading(false); }); return () => unsubscribe(); }, []); const handleOpenModal = (product: Product | null = null) => { if (product) { setCurrentProduct(product); setPriceFields(Object.entries(product.price).map(([role, value]) => ({ role, value }))); } else { setCurrentProduct({ name: '', unit: '', category: '', stock: 0 }); setPriceFields([{ role: 'daily_cap_1', value: 0 }]); } setIsModalOpen(true); }; const handleCloseModal = () => { setIsModalOpen(false); setCurrentProduct(null); setPriceFields([{ role: '', value: 0 }]); }; const handlePriceChange = (index: number, field: 'role' | 'value', value: string | number) => { const newPriceFields = [...priceFields]; if (field === 'value') { newPriceFields[index][field] = Number(value); } else { newPriceFields[index][field] = String(value); } setPriceFields(newPriceFields); }; const addPriceField = () => { setPriceFields([...priceFields, { role: '', value: 0 }]); }; const removePriceField = (index: number) => { const newPriceFields = priceFields.filter((_, i) => i !== index); setPriceFields(newPriceFields); }; const handleSubmit = async (e: FormEvent) => { e.preventDefault(); if (!currentProduct) return; const priceObject = priceFields.reduce((acc, field) => { if (field.role) { acc[field.role] = field.value; } return acc; }, {} as ProductPrice); const productData = { name: currentProduct.name, unit: currentProduct.unit, category: currentProduct.category, stock: Number(currentProduct.stock), price: priceObject }; if (currentProduct.id) { const productRef = doc(db, "products", currentProduct.id); await updateDoc(productRef, productData); } else { await addDoc(collection(db, "products"), productData); } handleCloseModal(); }; const handleDelete = async (productId: string) => { if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) { await deleteDoc(doc(db, "products", productId)); } }; return (<div><div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">Quản lý Sản phẩm</h1><button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Thêm Sản phẩm mới</button></div>{isLoading ? <Spinner /> : (<div className="bg-white shadow-md rounded-lg overflow-hidden"><table className="min-w-full leading-normal"><thead><tr className="bg-gray-200 text-gray-600 uppercase text-sm"><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tên sản phẩm</th><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Danh mục</th><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tồn kho</th><th className="px-5 py-3 border-b-2 border-gray-300 text-center">Hành động</th></tr></thead><tbody>{products.map(product => (<tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100"><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{product.name}</p><p className="text-gray-600 whitespace-no-wrap text-xs">ĐVT: {product.unit}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{product.category}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{product.stock.toLocaleString()}</p></td><td className="px-5 py-4 text-sm text-center"><button onClick={() => handleOpenModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Sửa</button><button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Xóa</button></td></tr>))}</tbody></table></div>)}<FormModal isOpen={isModalOpen} onClose={handleCloseModal} title={currentProduct?.id ? "Sửa Sản phẩm" : "Thêm Sản phẩm mới"}><form onSubmit={handleSubmit}><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label><input type="text" value={currentProduct?.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700">Danh mục</label><input type="text" value={currentProduct?.category || ''} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700">Đơn vị tính</label><input type="text" value={currentProduct?.unit || ''} onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700">Số lượng tồn kho</label><input type="number" value={currentProduct?.stock || 0} onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required /></div></div><div className="border-t pt-4"><h4 className="text-md font-semibold mb-2">Thiết lập giá theo vai trò</h4>{priceFields.map((field, index) => (<div key={index} className="flex items-center gap-2 mb-2"><input type="text" placeholder="Vai trò (vd: npp, daily_cap_1)" value={field.role} onChange={e => handlePriceChange(index, 'role', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm" /><input type="number" placeholder="Giá" value={field.value} onChange={e => handlePriceChange(index, 'value', e.target.value)} className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm" /><button type="button" onClick={() => removePriceField(index)} className="px-3 py-2 bg-red-500 text-white rounded-md">&times;</button></div>))}{<button type="button" onClick={addPriceField} className="text-sm text-blue-600 hover:text-blue-800">+ Thêm mức giá</button>}</div><div className="mt-6 flex justify-end"><button type="button" onClick={handleCloseModal} className="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">Lưu</button></div></form></FormModal></div>); };
const AdminOrdersPage: React.FC = () => { type OrderStatus = 'all' | Order['status']; const [orders, setOrders] = useState<Order[]>([]); const [isLoading, setIsLoading] = useState(true); const [filterStatus, setFilterStatus] = useState<OrderStatus>('all'); useEffect(() => { const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc")); const unsubscribe = onSnapshot(ordersQuery, (snapshot) => { const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)); setOrders(ordersData); setIsLoading(false); }); return () => unsubscribe(); }, []); const handleStatusChange = async (orderId: string, newStatus: Order['status']) => { const orderRef = doc(db, "orders", orderId); try { await updateDoc(orderRef, { status: newStatus }); alert("Cập nhật trạng thái thành công!"); } catch (error) { alert("Có lỗi xảy ra khi cập nhật trạng thái."); } }; const getStatusClass = (status: Order['status']) => { switch (status) { case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'; case 'processing': return 'bg-blue-100 text-blue-800 border-blue-300'; case 'shipped': return 'bg-green-100 text-green-800 border-green-300'; case 'completed': return 'bg-gray-200 text-gray-800 border-gray-400'; case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'; default: return 'bg-gray-100 border-gray-300'; } }; const filteredOrders = orders.filter(order => filterStatus === 'all' || order.status === filterStatus); return (<div><div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">Quản lý Đơn hàng</h1><div><label htmlFor="status-filter" className="mr-2 text-sm font-medium">Lọc theo trạng thái:</label><select id="status-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as OrderStatus)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm"><option value="all">Tất cả</option><option value="pending">Chờ xử lý</option><option value="processing">Đang xử lý</option><option value="shipped">Đã giao</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option></select></div></div>{isLoading ? <Spinner /> : (<div className="bg-white shadow-md rounded-lg overflow-x-auto"><table className="min-w-full leading-normal"><thead><tr className="bg-gray-200 text-gray-600 uppercase text-sm"><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Mã ĐH</th><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tên Đại lý</th><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Ngày đặt</th><th className="px-5 py-3 border-b-2 border-gray-300 text-right">Tổng tiền</th><th className="px-5 py-3 border-b-2 border-gray-300 text-center">Trạng thái</th></tr></thead><tbody>{filteredOrders.map(order => (<tr key={order.id} className="border-b border-gray-200 hover:bg-gray-100"><td className="px-5 py-4 text-sm"><p className="font-mono text-gray-700 whitespace-no-wrap">{order.id.slice(0, 8).toUpperCase()}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{order.userName}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{order.createdAt.toDate().toLocaleDateString('vi-VN')}</p></td><td className="px-5 py-4 text-sm text-right"><p className="text-gray-900 font-semibold whitespace-no-wrap">{order.totalAmount.toLocaleString('vi-VN')} ₫</p></td><td className="px-5 py-4 text-sm text-center"><select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])} className={`px-3 py-1 border rounded-full text-xs appearance-none ${getStatusClass(order.status)}`}><option value="pending">Chờ xử lý</option><option value="processing">Đang xử lý</option><option value="shipped">Đã giao</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option></select></td></tr>))}{filteredOrders.length === 0 && (<tr><td colSpan={5}><p className="text-center text-gray-500 py-10">Không có đơn hàng nào phù hợp.</p></td></tr>)}</tbody></table></div>)}</div>); };
const AdminUsersPage: React.FC = () => { const [users, setUsers] = useState<User[]>([]); const [isLoading, setIsLoading] = useState(true); useEffect(() => { const usersQuery = query(collection(db, "users"), orderBy("name", "asc")); const unsubscribe = onSnapshot(usersQuery, (snapshot) => { const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)); setUsers(usersData); setIsLoading(false); }); return () => unsubscribe(); }, []); const handleRoleChange = async (userId: string, newRole: User['role']) => { if (confirm(`Bạn có chắc muốn đổi vai trò của người dùng này thành ${newRole}?`)) { const userRef = doc(db, "users", userId); try { await updateDoc(userRef, { role: newRole }); alert("Cập nhật vai trò thành công!"); } catch (error) { alert("Có lỗi xảy ra khi cập nhật vai trò."); } } }; const getRoleClass = (role: User['role']) => { switch (role) { case 'admin': return 'bg-red-200 text-red-800 border-red-400'; case 'npp': return 'bg-purple-200 text-purple-800 border-purple-400'; case 'daily_cap_1': return 'bg-green-200 text-green-800 border-green-400'; case 'daily_cap_2': return 'bg-blue-200 text-blue-800 border-blue-400'; default: return 'bg-gray-200 text-gray-800 border-gray-400'; } }; return (<div><div className="mb-6"><h1 className="text-3xl font-bold">Quản lý Người dùng</h1><p className="text-gray-600 mt-1">Xem và phân quyền cho các tài khoản đại lý.</p></div>{isLoading ? <Spinner /> : (<div className="bg-white shadow-md rounded-lg overflow-x-auto"><table className="min-w-full leading-normal"><thead><tr className="bg-gray-200 text-gray-600 uppercase text-sm"><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Tên người dùng</th><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Email</th><th className="px-5 py-3 border-b-2 border-gray-300 text-center">Vai trò</th></tr></thead><tbody>{users.map(user => (<tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100"><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{user.name}</p></td><td className="px-5 py-4 text-sm"><p className="text-gray-900 whitespace-no-wrap">{user.email}</p></td><td className="px-5 py-4 text-sm text-center">{user.role === 'admin' ? (<span className={`px-3 py-1 border rounded-full text-xs font-semibold ${getRoleClass(user.role)}`}>Admin</span>) : (<select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])} className={`px-3 py-1 border rounded-full text-xs appearance-none ${getRoleClass(user.role)}`}><option value="npp">Nhà Phân Phối</option><option value="daily_cap_1">Đại lý Cấp 1</option><option value="daily_cap_2">Đại lý Cấp 2</option></select>)}</td></tr>))}{users.length === 0 && (<tr><td colSpan={3}><p className="text-center text-gray-500 py-10">Không tìm thấy người dùng nào.</p></td></tr>)}</tbody></table></div>)}</div>); };
const AdminPromotionsPage: React.FC = () => { const [promotions, setPromotions] = useState<Promotion[]>([]); const [isLoading, setIsLoading] = useState(true); const [isModalOpen, setIsModalOpen] = useState(false); const [currentPromotion, setCurrentPromotion] = useState<Partial<Promotion> | null>(null); useEffect(() => { const unsubscribe = onSnapshot(collection(db, "promotions"), (snapshot) => { const promosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion)); setPromotions(promosData); setIsLoading(false); }); return () => unsubscribe(); }, []); const handleOpenModal = (promo: Promotion | null = null) => { if (promo) { setCurrentPromotion(promo); } else { setCurrentPromotion({ code: '', description: '', discountType: 'percentage', discountValue: 0, conditions: { minAmount: 0, productCategory: '', userRole: '' }, isActive: true }); } setIsModalOpen(true); }; const handleCloseModal = () => setIsModalOpen(false); const handleSubmit = async (e: FormEvent) => { e.preventDefault(); if (!currentPromotion) return; const promoData = { code: currentPromotion.code, description: currentPromotion.description, discountType: currentPromotion.discountType, discountValue: Number(currentPromotion.discountValue), conditions: { minAmount: Number(currentPromotion.conditions?.minAmount) || undefined, productCategory: currentPromotion.conditions?.productCategory || undefined, userRole: currentPromotion.conditions?.userRole || undefined }, isActive: currentPromotion.isActive, }; if (currentPromotion.id) { await updateDoc(doc(db, "promotions", currentPromotion.id), promoData); } else { await addDoc(collection(db, "promotions"), promoData); } handleCloseModal(); }; const toggleActive = async (promo: Promotion) => { await updateDoc(doc(db, "promotions", promo.id), { isActive: !promo.isActive }); }; return (<div><div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold">Quản lý Khuyến mãi</h1><button onClick={() => handleOpenModal()} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Tạo Khuyến mãi</button></div>{isLoading ? <Spinner /> : (<div className="bg-white shadow-md rounded-lg overflow-hidden"><table className="min-w-full leading-normal"><thead><tr className="bg-gray-200 text-gray-600 uppercase text-sm"><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Mã</th><th className="px-5 py-3 border-b-2 border-gray-300 text-left">Mô tả</th><th className="px-5 py-3 border-b-2 border-gray-300 text-center">Trạng thái</th><th className="px-5 py-3 border-b-2 border-gray-300 text-center">Hành động</th></tr></thead><tbody>{promotions.map(promo => (<tr key={promo.id} className="border-b border-gray-200 hover:bg-gray-100"><td className="px-5 py-4 text-sm"><p className="font-mono bg-gray-100 px-2 py-1 rounded-md inline-block">{promo.code}</p></td><td className="px-5 py-4 text-sm"><p>{promo.description}</p></td><td className="px-5 py-4 text-sm text-center"><button onClick={() => toggleActive(promo)} className={`px-3 py-1 text-xs font-semibold rounded-full ${promo.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{promo.isActive ? 'Đang chạy' : 'Tạm dừng'}</button></td><td className="px-5 py-4 text-sm text-center"><button onClick={() => handleOpenModal(promo)} className="text-indigo-600 hover:text-indigo-900">Sửa</button></td></tr>))}</tbody></table></div>)}<FormModal isOpen={isModalOpen} onClose={handleCloseModal} title={currentPromotion?.id ? "Sửa Khuyến mãi" : "Tạo Khuyến mãi mới"}>{currentPromotion && (<form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium">Mã KM (viết liền, không dấu)</label><input type="text" value={currentPromotion.code} onChange={e => setCurrentPromotion({...currentPromotion, code: e.target.value.toUpperCase()})} className="mt-1 w-full p-2 border rounded" required/></div><div><label className="block text-sm font-medium">Mô tả</label><input type="text" value={currentPromotion.description} onChange={e => setCurrentPromotion({...currentPromotion, description: e.target.value})} className="mt-1 w-full p-2 border rounded" required/></div><div><label className="block text-sm font-medium">Loại giảm giá</label><select value={currentPromotion.discountType} onChange={e => setCurrentPromotion({...currentPromotion, discountType: e.target.value as Promotion['discountType']})} className="mt-1 w-full p-2 border rounded bg-white"><option value="percentage">Theo phần trăm (%)</option><option value="fixed">Số tiền cố định (₫)</option></select></div><div><label className="block text-sm font-medium">Giá trị giảm</label><input type="number" value={currentPromotion.discountValue} onChange={e => setCurrentPromotion({...currentPromotion, discountValue: Number(e.target.value)})} className="mt-1 w-full p-2 border rounded" required/></div></div><div className="border-t pt-4"><h4 className="font-semibold">Điều kiện áp dụng (để trống nếu không cần)</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2"><div><label className="block text-sm font-medium">Giá trị đơn hàng tối thiểu</label><input type="number" value={currentPromotion.conditions?.minAmount || ''} onChange={e => setCurrentPromotion({...currentPromotion, conditions: {...currentPromotion.conditions, minAmount: Number(e.target.value)} })} className="mt-1 w-full p-2 border rounded"/></div><div><label className="block text-sm font-medium">Áp dụng cho ngành hàng</label><input type="text" placeholder="VD: Xi măng" value={currentPromotion.conditions?.productCategory || ''} onChange={e => setCurrentPromotion({...currentPromotion, conditions: {...currentPromotion.conditions, productCategory: e.target.value} })} className="mt-1 w-full p-2 border rounded"/></div><div><label className="block text-sm font-medium">Áp dụng cho vai trò</label><select value={currentPromotion.conditions?.userRole || ''} onChange={e => setCurrentPromotion({...currentPromotion, conditions: {...currentPromotion.conditions, userRole: e.target.value} })} className="mt-1 w-full p-2 border rounded bg-white"><option value="">Tất cả</option><option value="npp">Nhà phân phối</option><option value="daily_cap_1">Đại lý Cấp 1</option><option value="daily_cap_2">Đại lý Cấp 2</option></select></div></div></div><div className="mt-6 flex justify-end"><button type="button" onClick={handleCloseModal} className="mr-2 px-4 py-2 bg-gray-200 rounded-md">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md">Lưu Khuyến mãi</button></div></form>)}</FormModal></div>); };

// --- CÁC COMPONENT PORTAL ---
interface PortalProps { user: User; setNotification: React.Dispatch<React.SetStateAction<NotificationType | null>>; handleLogout: () => void; }
const UserPortal: React.FC<PortalProps> = ({ user, setNotification, handleLogout }) => { const [view, setView] = useState<UserView>({ page: 'dashboard' }); const [cartItemCount, setCartItemCount] = useState(0); useEffect(() => { if (user) { const cartCollection = collection(db, `users/${user.uid}/cart`); const unsubscribe = onSnapshot(cartCollection, (snapshot) => { setCartItemCount(snapshot.size); }); return () => unsubscribe(); } }, [user]); const renderPage = () => { switch (view.page) { case 'dashboard': return <DashboardPage user={user} />; case 'products': return <ProductsPage user={user} setNotification={setNotification} setView={setView} />; case 'productDetail': return view.detailId ? <ProductDetailPage user={user} productId={view.detailId} setView={setView} setNotification={setNotification} /> : <ProductsPage user={user} setNotification={setNotification} setView={setView} />; case 'cart': return <CartPage user={user} setNotification={setNotification} setView={setView} />; case 'orders': return <OrdersPage user={user} />; default: return <DashboardPage user={user} />; } }; const NavLink = ({ pageName, icon, label }: { pageName: UserView['page'], icon: JSX.Element, label: string }) => (<button onClick={() => setView({ page: pageName })} className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left ${view.page === pageName ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{icon}<span>{label}</span></button>); return (<div className="flex h-screen bg-gray-100 font-sans"><aside className="w-64 bg-white border-r border-gray-200 flex flex-col"><div className="h-16 flex items-center justify-center border-b"><h1 className="text-xl font-bold text-blue-600">B2B Portal</h1></div><nav className="flex-1 px-4 py-6 space-y-2"><NavLink pageName="dashboard" icon={<HomeIcon />} label="Tổng quan" /><NavLink pageName="products" icon={<PackageIcon />} label="Sản phẩm" /><NavLink pageName="orders" icon={<ClipboardListIcon />} label="Đơn hàng" /></nav><div className="px-4 py-4 border-t"><div className="flex items-center justify-between mb-4"><button onClick={() => setView({ page: 'cart' })} className="relative flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left text-gray-600 hover:bg-gray-100"><ShoppingCartIcon /><span>Giỏ hàng</span>{cartItemCount > 0 && (<span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{cartItemCount}</span>)}</button></div><div className="flex items-center p-2 rounded-md bg-gray-50"><UserIcon /><div className="ml-3"><p className="text-sm font-semibold text-gray-800">{user.name}</p><p className="text-xs text-gray-500 capitalize">{user.role.replace(/_/g, ' ')}</p></div><button onClick={handleLogout} className="ml-auto p-2 rounded-full hover:bg-gray-200"><LogOutIcon /></button></div></div></aside><main className="flex-1 overflow-y-auto">{renderPage()}</main></div>); };
const AdminPortal: React.FC<PortalProps> = ({ user, handleLogout }) => { const [view, setView] = useState<AdminView>({ page: 'adminDashboard' }); const renderPage = () => { switch (view.page) { case 'adminDashboard': return <AdminDashboardPage />; case 'adminProducts': return <AdminProductsPage />; case 'adminOrders': return <AdminOrdersPage />; case 'adminUsers': return <AdminUsersPage />; case 'adminPromotions': return <AdminPromotionsPage />; default: return <AdminDashboardPage />; } }; const NavLink = ({ pageName, icon, label }: { pageName: AdminView['page'], icon: JSX.Element, label: string }) => (<button onClick={() => setView({ page: pageName })} className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left ${view.page === pageName ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>{icon}<span>{label}</span></button>); return (<div className="flex h-screen bg-gray-100 font-sans"><aside className="w-64 bg-gray-800 text-white flex flex-col"><div className="h-16 flex items-center justify-center border-b border-gray-700"><h1 className="text-xl font-bold text-white">Admin Panel</h1></div><nav className="flex-1 px-4 py-6 space-y-2"><NavLink pageName="adminDashboard" icon={<HomeIcon />} label="Tổng quan" /><NavLink pageName="adminProducts" icon={<PackageIcon />} label="Quản lý Sản phẩm" /><NavLink pageName="adminOrders" icon={<ClipboardListIcon />} label="Quản lý Đơn hàng" /><NavLink pageName="adminUsers" icon={<UsersIcon />} label="Quản lý Người dùng" /><NavLink pageName="adminPromotions" icon={<TagIcon />} label="Quản lý Khuyến mãi" /></nav><div className="px-4 py-4 border-t border-gray-700"><div className="flex items-center p-2 rounded-md bg-gray-700"><UserIcon /><div className="ml-3"><p className="text-sm font-semibold text-white">{user.name}</p><p className="text-xs text-gray-400 capitalize">{user.role}</p></div><button onClick={handleLogout} className="ml-auto p-2 rounded-full hover:bg-gray-600"><LogOutIcon /></button></div></div></aside><main className="flex-1 overflow-y-auto p-6">{renderPage()}</main></div>); };

// --- COMPONENT CHÍNH (APP) ---
export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [notification, setNotification] = useState<NotificationType | null>(null);
    const isInitialOrderLoad = useRef(true);

    const seedData = useCallback(async () => {
        const productsCollection = collection(db, "products");
        const productsSnapshot = await getDocs(productsCollection);
        if (productsSnapshot.empty) {
            const batch = writeBatch(db);
            SAMPLE_PRODUCTS.forEach((product, index) => {
                const id = `SP${(index + 1).toString().padStart(3, '0')}`;
                const docRef = doc(db, "products", id);
                batch.set(docRef, product);
            });
            await batch.commit();
        }
        for (const sampleUser of SAMPLE_USERS) {
            const userQuery = query(collection(db, "users"), where("email", "==", sampleUser.email));
            const userSnapshot = await getDocs(userQuery);
            if (userSnapshot.empty) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, sampleUser.email, sampleUser.password);
                    const userData = { name: sampleUser.name, email: sampleUser.email, role: sampleUser.role };
                    await setDoc(doc(db, "users", userCredential.user.uid), userData);
                } catch(error: any) {
                    if (error.code !== 'auth/email-already-in-use') { console.error("Error creating sample user:", error); }
                }
            }
        }
        if(auth.currentUser && !auth.currentUser.isAnonymous) { await signOut(auth); }
    }, []);

    useEffect(() => {
        seedData();
    }, [seedData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && !firebaseUser.isAnonymous) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
                } else {
                    await signOut(auth);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!user || user.role === 'admin') return; // Admin không cần thông báo này
        const ordersQuery = query(collection(db, "orders"), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            if (isInitialOrderLoad.current) {
                isInitialOrderLoad.current = false;
                return;
            }
            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    const orderData = change.doc.data() as Omit<Order, 'id'>;
                    const orderId = change.doc.id.slice(0, 8).toUpperCase();
                    setNotification({
                        type: 'info',
                        message: `Đơn hàng #${orderId} đã cập nhật trạng thái thành: ${orderData.status}`
                    });
                }
            });
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleLogout = async () => {
        await signOut(auth);
    };

    const getNotificationBg = (type: NotificationType['type']) => {
        switch(type) {
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'info': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    }

    const renderContent = () => {
        if (!isAuthReady) {
            return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><Spinner /></div>;
        }

        if (!user) {
            return <LoginPage setNotification={setNotification} />;
        }

        if (user.role === 'admin') {
            return <AdminPortal user={user} setNotification={setNotification} handleLogout={handleLogout} />;
        }

        return <UserPortal user={user} setNotification={setNotification} handleLogout={handleLogout} />;
    };

    return (
        <>
            {renderContent()}
            {notification && (
                <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${getNotificationBg(notification.type)}`}>
                    {notification.message}
                </div>
            )}
        </>
    );
}
