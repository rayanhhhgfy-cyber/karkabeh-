import { getPublicProducts } from "@/app/actions/orders";
import ProductView from "@/components/ProductView";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const products = await getPublicProducts();
  const { id } = await params;

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-maroon hover:text-gold transition-colors">
          <ChevronLeft size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">The Collection</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/track"
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
          >
            Track
          </Link>
          <Link 
            href="/admin" 
            className="w-10 h-10 rounded-full luxury-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg"
          >
            K
          </Link>
        </div>
      </header>

      <div className="max-w-[500px] mx-auto pb-20">
        <ProductView initialProducts={products} activeId={id} />
      </div>

      {/* Footer Branding */}
      <footer className="py-12 px-6 bg-gray-50 border-t border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-maroon italic mb-2 tracking-tighter">KONOZ BAG</h2>
        <p className="text-gray-400 text-sm max-w-[300px] mx-auto leading-relaxed">
          Exquisite craftsmanship for the modern wanderer. Hand-finished details, premium materials.
        </p>
      </footer>
    </main>
  );
}
