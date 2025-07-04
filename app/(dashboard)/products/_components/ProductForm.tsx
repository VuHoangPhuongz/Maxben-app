// app/(dashboard)/products/_components/ProductForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createProduct, updateProduct } from '@/lib/actions';
import { Product } from '@/lib/actions'; // Import Product type

const ProductFormSchema = z.object({
  name: z.string().min(3, { message: 'Tên sản phẩm phải có ít nhất 3 ký tự.' }),
  unit: z.string().min(1, { message: 'Đơn vị không được để trống.' }),
  stock: z.coerce.number().int().nonnegative({ message: 'Tồn kho phải là số không âm.' }),
  price_level_1: z.coerce.number().positive({ message: 'Giá cấp 1 phải là số dương.' }),
  price_level_2: z.coerce.number().positive({ message: 'Giá cấp 2 phải là số dương.' }),
});

type ProductFormData = z.infer<typeof ProductFormSchema>;

interface ProductFormProps {
  initialData?: Product | null;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: initialData || {
      name: '',
      unit: '',
      stock: 0,
      price_level_1: 0,
      price_level_2: 0,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ProductFormData) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const action = isEditMode
      ? updateProduct.bind(null, initialData!.id)
      : createProduct;

    const result = await action(formData);

    if (result?.success) {
      toast.success(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!');
      router.push('/dashboard/products');
    } else if (result?.error) {
      toast.error(result.error);
    } else {
       toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Chỉnh sửa Sản phẩm' : 'Tạo Sản phẩm mới'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên sản phẩm</FormLabel>
                  <FormControl>
                    <Input placeholder="Xi măng Hà Tiên" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Đơn vị</FormLabel>
                    <FormControl>
                        <Input placeholder="Bao" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tồn kho</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="price_level_1"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Giá đại lý cấp 1 (VNĐ)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="price_level_2"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Giá đại lý cấp 2 (VNĐ)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm')}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
