// app/cart/page.tsx
import { getCartItems } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CartItemCard } from "./_components/CartItemCard"; // Quan trọng: Import component này
import { PlaceOrderButton } from "./_components/PlaceOrderButton";

export default async function CartPage() {
  const cartItems = await getCartItems();
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Giỏ hàng của bạn</h1>
      {cartItems.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {/* Quan trọng: Đảm bảo bạn đang dùng CartItemCard ở đây */}
            {cartItems.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </div>
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng</span>
                  <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <PlaceOrderButton />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">Giỏ hàng của bạn đang trống</h2>
          <p className="text-muted-foreground mt-2">Hãy bắt đầu mua sắm nào!</p>
          <Button asChild className="mt-4">
            <Link href="/">Quay về trang chủ</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
