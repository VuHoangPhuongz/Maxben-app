// app/orders/[orderId]/page.tsx
import { getOrderForUser, Order } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OrderStatusTracker } from "./_components/OrderStatusTracker";

interface OrderDetailPageProps {
  params: {
    orderId: string;
  };
}

// Hàm để định dạng màu cho từng trạng thái
const getStatusBadgeVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'processing': return 'default';
    case 'shipped': return 'outline';
    case 'completed': return 'default';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const order = await getOrderForUser(params.orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Chi tiết Đơn hàng</CardTitle>
              <CardDescription>
                Mã đơn hàng: <span className="font-mono">{order.id}</span>
              </CardDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(order.status)} className={`capitalize text-base ${order.status === 'completed' ? 'bg-green-600 text-white' : ''}`}>
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
             <OrderStatusTracker currentStatus={order.status} />
          </div>
          <Separator />
          <div className="my-6">
            <h3 className="text-lg font-semibold mb-4">Các sản phẩm đã đặt</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Số lượng: {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <p className="font-semibold">
                    {(item.quantity * item.price).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="mt-6 space-y-2 text-right">
            <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Tạm tính:</span>
                <span className="w-32 font-medium">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
             <div className="flex justify-end gap-4">
                <span className="text-muted-foreground">Khuyến mãi:</span>
                <span className="w-32 font-medium">0đ</span>
            </div>
            <div className="flex justify-end gap-4 text-xl font-bold">
                <span className="">Tổng cộng:</span>
                <span className="w-32">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
