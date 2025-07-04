// app/(dashboard)/orders/_components/actions.tsx
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { updateOrderStatus, ORDER_STATUSES, Order } from '@/lib/actions';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UpdateStatusDropdownProps {
  orderId: string;
  currentStatus: Order['status'];
}

export function UpdateStatusDropdown({ orderId, currentStatus }: UpdateStatusDropdownProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: Order['status']) => {
    if (status === currentStatus) return;

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (result.success) {
        toast.success(result.success);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? 'Đang cập nhật...' : 'Thay đổi'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ORDER_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            disabled={status === currentStatus || isPending}
            onClick={() => handleStatusChange(status)}
            className="capitalize"
          >
            {status}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
