// app/(dashboard)/products/page.tsx
import { getProducts, Product } from '@/lib/actions';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DeleteProductButton } from './_components/actions';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Sản phẩm</h1>
        <Button asChild>
          <Link href="/dashboard/products/new">Thêm Sản phẩm</Link>
        </Button>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Tên Sản phẩm</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Giá cấp 1</TableHead>
              <TableHead>Giá cấp 2</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.price_level_1.toLocaleString('vi-VN')}đ</TableCell>
                  <TableCell>{product.price_level_2.toLocaleString('vi-VN')}đ</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                       <Link href={`/dashboard/products/edit/${product.id}`}>Sửa</Link>
                    </Button>
                    {/* Component nút xóa sẽ là Client Component */}
                    <DeleteProductButton productId={product.id} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Chưa có sản phẩm nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}