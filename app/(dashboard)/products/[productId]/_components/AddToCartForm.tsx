// app/products/[productId]/_components/AddToCartForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToCart } from '@/lib/actions';

interface AddToCartFormProps {
  productId: string;
}

export function AddToCartForm({ productId }: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = () => {
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
      
      if (result?.success) {
        toast.success(result.success);
      } else if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-4 mt-8">
      <Input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-24"
        disabled={isPending}
      />
      <Button onClick={handleAddToCart} disabled={isPending} size="lg" className="flex-grow">
        {isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
      </Button>
    </div>
  );
}
