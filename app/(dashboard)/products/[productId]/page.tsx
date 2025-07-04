// app/products/[productId]/page.tsx
import { getProductById } from '@/lib/actions';
import { getCurrentUser } from '@/lib/session';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AddToCartForm } from './_components/AddToCartForm';

interface ProductDetailPageProps {
  params: {
    productId: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = await getProductById(params.productId);
  const user = await getCurrentUser();

  if (!product) {
    notFound();
  }

  // Hàm xác định giá và cấp bậc để hiển thị
  const getPriceForRole = () => {
    if (!user) return null;
    switch (user.role) {
      case 'daily_cap_1':
        return { price: product.price_level_1, level: 'Giá Đại lý cấp 1' };
      case 'daily_cap_2':
        return { price: product.price_level_2, level: 'Giá Đại lý cấp 2' };
      // Admin có thể xem giá cấp 1 để tham khảo
      case 'admin':
        return { price: product.price_level_1, level: 'Giá Đại lý cấp 1 (Admin view)' };
      default:
        return null;
    }
  };

  const userPrice = getPriceForRole();

  return (
    <div className="container mx-auto py-10">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          {/* Placeholder cho Thư viện ảnh */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg w-full aspect-square flex items-center justify-center">
            <span className="text-slate-500">[Ảnh sản phẩm]</span>
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-3">
            <Badge variant={product.stock > 0 ? 'default' : 'destructive'} className={product.stock > 0 ? 'bg-green-600 text-white' : ''}>
              {product.stock > 0 ? `Còn hàng (${product.stock} ${product.unit})` : 'Hết hàng'}
            </Badge>
          </div>
          <div className="mt-6">
            <p className="text-muted-foreground">
              Đây là phần mô tả chi tiết về sản phẩm. Bạn có thể thêm các thông tin
              về thông số kỹ thuật, xuất xứ, và các đặc điểm nổi bật khác của sản phẩm ở đây.
            </p>
          </div>
          
          {userPrice ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Bảng giá</CardTitle>
                <CardDescription>Giá dành riêng cho cấp đại lý của bạn.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {userPrice.price.toLocaleString('vi-VN')} VNĐ
                </div>
                <p className="text-sm text-muted-foreground">{userPrice.level}</p>
              </CardContent>
            </Card>
          ) : (
             <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
                <p>Vui lòng đăng nhập với tài khoản đại lý để xem giá và đặt hàng.</p>
             </div>
          )}

          {/* Form Thêm vào giỏ hàng - chỉ hiển thị cho đại lý và khi còn hàng */}
          {user && (user.role === 'daily_cap_1' || user.role === 'daily_cap_2') && product.stock > 0 && (
            <AddToCartForm productId={product.id} />
          )}
        </div>
      </div>
    </div>
  );
}
