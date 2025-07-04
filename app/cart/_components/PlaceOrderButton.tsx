'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { createOrderFromCart } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function PlaceOrderButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handlePlaceOrder = () => {
        startTransition(async () => {
            const result = await createOrderFromCart();
            if (result.success) {
                toast.success('Đã đặt hàng thành công!');
                // Chuyển hướng đến trang chi tiết đơn hàng hoặc trang cảm ơn
                router.push(`/orders/${result.orderId}`);
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Button className="w-full mt-4" size="lg" onClick={handlePlaceOrder} disabled={isPending}>
            {isPending ? 'Đang xử lý...' : 'Tiến hành Đặt hàng'}
        </Button>
    );
}
