'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { CartItem, updateCartItemQuantity, removeCartItem } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const [isPending, startTransition] = useTransition();
  
  const handleQuantityChange = (newQuantity: number) => {
    startTransition(async () => {
      const result = await updateCartItemQuantity(item.id, newQuantity);
      if (result?.error) toast.error(result.error);
    });
  };

  const handleRemoveItem = () => {
    startTransition(async () => {
      const result = await removeCartItem(item.id);
      if (result?.success) toast.success(result.success);
      if (result?.error) toast.error(result.error);
    });
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="w-20 h-20 bg-slate-100 rounded-md flex-shrink-0">
          {/* Placeholder ảnh */}
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.price.toLocaleString('vi-VN')}đ / {item.unit}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.quantity - 1)} disabled={isPending}>
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            className="h-8 w-14 text-center"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(Number(e.target.value))}
            disabled={isPending}
          />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.quantity + 1)} disabled={isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="font-semibold w-28 text-right">
          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
        </div>
        <Button variant="ghost" size="icon" onClick={handleRemoveItem} disabled={isPending}>
          <Trash2 className="h-5 w-5 text-red-500" />
        </Button>
      </CardContent>
    </Card>
  );
}