import Image from "next/image";
import Link from "next/link";
import { getPublicProducts } from "@/app/actions/orders";
import ProductView from "@/components/ProductView";
import { Plus } from "lucide-react";

export default async function HomePage() {
  const products = await getPublicProducts();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-maroon tracking-tighter italic">KONOZ BAG</h1>
          <span className="text-[10px] text-gold uppercase tracking-[0.2em] font-semibold">Luxury Collection</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/track"
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
          >
            Track
          </Link>
          <Link 
            href="/admin" 
            className="w-10 h-10 rounded-full luxury-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform"
          >
            K
          </Link>
        </div>
      </header>

      {/* Hero Wallpaper Section */}
      <section className="relative w-full h-[400px] md:h-[600px] overflow-hidden">
        <Image 
          src="/assets/hero-wallpaper.png" 
          alt="Luxury Wallpaper" 
          fill 
          className="object-cover"
          priority
        />
        {/* Stronger overlay for white wallpaper visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-white"></div>
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 ease-out">
            <h2 className="text-5xl md:text-8xl font-bold tracking-tighter italic text-gold drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] mb-6">
              Elevate Your Presence
            </h2>
            <p className="text-white text-lg md:text-2xl font-medium tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] max-w-3xl leading-relaxed">
              Hand-crafted Italian leather for the discerning explorer. 
              <br className="hidden md:block" />
              Pure elegance, hand-stitched for a lifetime.
            </p>
          </div>
        </div>
      </section>

      {/* The Collection Grid */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center mb-16">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gold mb-4 text-center">The 2026 Collection</h3>
            <div className="w-12 h-[1px] bg-gold mb-6"></div>
            <h2 className="text-4xl font-bold text-maroon italic text-center tracking-tight">Our Curated Masterpieces</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => (
              <Link 
                key={product.id}
                href={`/product/${product.id}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 border border-gray-100">
                  <Image 
                    src={product.image} 
                    alt={product.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                    <span className="text-gold text-[10px] font-black uppercase tracking-widest mb-1">View Details</span>
                    <h4 className="text-white text-2xl font-bold italic tracking-tight">{product.name}</h4>
                  </div>
                  {product.hasBadge && (
                    <div className="absolute top-6 right-6 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20">
                      96.3% g
                    </div>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-maroon transition-colors">{product.name}</h4>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Limited Edition</p>
                </div>
              </Link>
            ))}

            {/* Custom Choice Card */}
            <Link 
              href="/product/custom"
              className="group block"
            >
              <div className="relative aspect-[4/5] bg-maroon rounded-3xl overflow-hidden shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2 flex flex-col items-center justify-center p-10 text-center border-4 border-gold/20">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6 group-hover:scale-110 transition-transform">
                  <Plus size={40} />
                </div>
                <h4 className="text-white text-3xl font-bold italic tracking-tight mb-4">Bespoke Choice</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Design your own legacy. Tell us your vision, and our artisans will bring it to life.
                </p>
                <div className="mt-10 px-6 py-2 border border-gold text-gold text-xs font-black uppercase tracking-widest group-hover:bg-gold group-hover:text-maroon transition-all">
                  Get Started
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 px-6 bg-gray-50 border-t border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-maroon italic mb-2 tracking-tighter">KONOZ BAG</h2>
        <p className="text-gray-400 text-sm max-w-[300px] mx-auto leading-relaxed">
          Exquisite craftsmanship for the modern wanderer. Hand-finished details, premium materials.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <div className="w-8 h-[1px] bg-gold self-center"></div>
          <p className="text-[10px] text-gold uppercase tracking-widest font-bold">Verified Luxury</p>
          <div className="w-8 h-[1px] bg-gold self-center"></div>
        </div>
      </footer>
    </main>
  );
}
