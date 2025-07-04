// app/(dashboard)/products/edit/[id]/page.tsx
import { getProductById } from '@/lib/actions';
import { ProductForm } from '../../_components/ProductForm';
import { notFound } from 'next/navigation';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <ProductForm initialData={product} />
    </div>
  );
}
