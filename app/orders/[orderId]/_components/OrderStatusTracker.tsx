// app/orders/[orderId]/_components/OrderStatusTracker.tsx
'use client';

import { CheckCircle, Circle, Loader, Truck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Giả sử bạn có hàm cn từ shadcn/ui

interface OrderStatusTrackerProps {
  currentStatus: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
}

const statusSteps = [
  { id: 'pending', label: 'Chờ xử lý', icon: Circle },
  { id: 'processing', label: 'Đang xử lý', icon: Loader },
  { id: 'shipped', label: 'Đang giao hàng', icon: Truck },
  { id: 'completed', label: 'Hoàn thành', icon: CheckCircle },
];

export function OrderStatusTracker({ currentStatus }: OrderStatusTrackerProps) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
        <XCircle className="w-6 h-6 text-red-500 mr-3" />
        <span className="font-semibold text-red-600">Đơn hàng đã bị hủy</span>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(step => step.id === currentStatus);

  return (
    <div className="flex justify-between items-center w-full">
      {statusSteps.map((step, index) => {
        const isActive = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex-1 flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className={cn('w-6 h-6', isCurrent && step.id === 'processing' && 'animate-spin')} />
              </div>
              <p className={cn('mt-2 text-sm text-center', isActive ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                {step.label}
              </p>
            </div>
            {index < statusSteps.length - 1 && (
              <div className={cn('flex-1 h-1 mx-2', isActive ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
