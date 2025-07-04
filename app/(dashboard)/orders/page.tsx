// app/(dashboard)/orders/page.tsx
import { getOrders, Order } from '@/lib/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UpdateStatusDropdown } from './_components/actions';

// Hàm để định dạng màu cho từng trạng thái
const getStatusBadgeVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'shipped':
      return 'outline';
    case 'completed':
      return 'default'; // Should be a success variant, e.g., green
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Hàm định dạng ngày
const formatDate = (timestamp: { seconds: number }) => {
  return new Date(timestamp.seconds * 1000).toLocaleDateString('vi-VN');
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Đơn hàng</h1>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Mã Đơn hàng</TableHead>
              <TableHead>Người đặt</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Cập nhật Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{order.userName}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{order.totalAmount.toLocaleString('vi-VN')}đ</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className={order.status === 'completed' ? 'bg-green-600' : ''}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Component để cập nhật trạng thái */}
                    <UpdateStatusDropdown orderId={order.id} currentStatus={order.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Chưa có đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
