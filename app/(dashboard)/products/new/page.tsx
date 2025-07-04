// app/(dashboard)/products/new/page.tsx
import { ProductForm } from '../_components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="container mx-auto py-10">
      <ProductForm />
    </div>
  );
}
