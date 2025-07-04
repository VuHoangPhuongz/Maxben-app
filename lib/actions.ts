// lib/actions.ts
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Định nghĩa schema validation với Zod
const ProductSchema = z.object({
  name: z.string().min(3, { message: 'Tên sản phẩm phải có ít nhất 3 ký tự.' }),
  unit: z.string().min(1, { message: 'Đơn vị không được để trống.' }),
  stock: z.coerce.number().int().nonnegative({ message: 'Tồn kho phải là số không âm.' }),
  price_level_1: z.coerce.number().positive({ message: 'Giá cấp 1 phải là số dương.' }),
  price_level_2: z.coerce.number().positive({ message: 'Giá cấp 2 phải là số dương.' }),
});

export type Product = z.infer<typeof ProductSchema> & { id: string };

// Hành động lấy sản phẩm theo ID
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error("Error fetching product by ID: ", error);
    return null;
  }
}

// Hành động tạo sản phẩm
export async function createProduct(formData: FormData) {
  const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await addDoc(collection(db, 'products'), {
      ...validatedFields.data,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/(dashboard)/products');
    return { success: true };
  } catch (error) {
    console.error("Error creating product: ", error);
    return { error: 'Không thể tạo sản phẩm.' };
  }
}

// Hành động cập nhật sản phẩm
export async function updateProduct(productId: string, formData: FormData) {
  const validatedFields = ProductSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...validatedFields.data,
      updatedAt: serverTimestamp(),
    });
    revalidatePath('/(dashboard)/products');
    revalidatePath(`/(dashboard)/products/edit/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating product: ", error);
    return { error: 'Không thể cập nhật sản phẩm.' };
  }
}

// ... các hàm getProducts, deleteProduct đã có
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

export async function deleteProduct(productId: string) {
  if (!productId) {
    return { error: 'Product ID is required.' };
  }
  try {
    await deleteDoc(doc(db, 'products', productId));
    revalidatePath('/(dashboard)/products');
    return { success: 'Product deleted successfully.' };
  } catch (error) {
    console.error("Error deleting product: ", error);
    return { error: 'Failed to delete product.' };
  }
}
