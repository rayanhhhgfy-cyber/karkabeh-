"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createOrder, verifyOTP } from "@/app/actions/orders";
import { 
  Image as ImageIcon,
  Plus, 
  Minus, 
  ChevronRight, 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  ShieldCheck,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";

export default function ProductView({ initialProducts, activeId }: { initialProducts: any[], activeId?: string }) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<any>(
    activeId === "custom" 
      ? null 
      : (initialProducts.find(p => p.id === activeId) || initialProducts[0] || null)
  );
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [orderId, setOrderId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    deliveryTime: "",
  });
  const [language, setLanguage] = useState<"en" | "ar">("en");

  const [isCustom, setIsCustom] = useState(activeId === "custom");
  const [customColorName, setCustomColorName] = useState("");
  const [customColorDescription, setCustomColorDescription] = useState("");
  const [customRefImage, setCustomRefImage] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState("");

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await createOrder({
      ...formData,
      colorName: isCustom ? `Custom: ${customColorName}` : selectedProduct.name,
      colorImage: isCustom ? null : selectedProduct.image,
      customRefImage: isCustom ? customRefImage : null,
      customDescription: isCustom ? customColorDescription : null,
      size,
      quantity,
      language,
    });

    if (res.success) {
      setOrderId(res.orderId!);
      setStep("otp");
    } else {
      setError(res.error || "Failed to create order");
    }
    setLoading(false);
  };

  const loadComments = async () => {
    if (!selectedProduct?.id) {
      setComments([]);
      return;
    }

    try {
      const response = await fetch(`/api/product-comments?productId=${selectedProduct.id}`);
      const data = await response.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (error) {
      console.error("Failed to load comments", error);
      setComments([]);
    }
  };

  useEffect(() => {
    loadComments();
  }, [selectedProduct?.id]);

  const handleCustomRefSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomRefImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim() || !selectedProduct?.id) {
      setCommentError(t(language, "commentRequired"));
      return;
    }

    setCommentLoading(true);
    setCommentError("");
    setCommentSuccess("");

    try {
      const response = await fetch("/api/product-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          authorName: commentName.trim(),
          message: commentText.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setCommentSuccess("Comment posted successfully.");
        setCommentName("");
        setCommentText("");
        loadComments();
      } else {
        setCommentError(data.error || "Could not post comment.");
      }
    } catch (error) {
      console.error(error);
      setCommentError("Could not post comment.");
    }

    setCommentLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await verifyOTP(orderId, otp);

    if (res.success) {
      setStep("success");
      document.cookie = `konoz_order_id=${orderId}; path=/; max-age=${60 * 60 * 24 * 30}`;
      document.cookie = `konoz_order_email=${encodeURIComponent(formData.email)}; path=/; max-age=${60 * 60 * 24 * 30}`;
    } else {
      setError(res.error || "Verification failed");
    }
    setLoading(false);
  };

  if (!selectedProduct && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <ImageIcon size={48} className="mb-4 opacity-20" />
        <p>No bags available yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Main Product Image Container */}
      <div className="relative aspect-[4/5] w-full bg-gray-50 overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={isCustom ? "custom-preview" : selectedProduct?.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="w-full h-full"
          >
            {isCustom && customRefImage ? (
              <Image src={customRefImage} alt="Custom Reference" fill className="object-cover" />
            ) : (
              <Image 
                src={selectedProduct?.image || "/assets/bag-maroon.png"} 
                alt={selectedProduct?.name || "Product"} 
                fill 
                className="object-cover"
                priority
              />
            )}
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute bottom-6 left-6 flex flex-col items-start gap-2">
          <span className="text-white bg-maroon px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl">
            {isCustom ? "Bespoke Request" : "In Stock"}
          </span>
          <h2 className="text-4xl font-bold text-white drop-shadow-lg tracking-tight italic">
            Konoz Bag <span className="text-gold opacity-90">{isCustom ? "Custom" : selectedProduct?.name}</span>
          </h2>
        </div>
      </div>

      {/* Product Interaction Area */}
      <div className="px-6 py-8">
        {/* Description Section */}
        {!isCustom && selectedProduct?.description && (
          <div className="mb-8">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-2">The Story</h3>
            <p className="text-sm text-gray-600 leading-relaxed italic font-serif">
              "{selectedProduct.description}"
            </p>
          </div>
        )}

        {!isCustom && selectedProduct?.price != null && (
          <div className="mb-8 flex items-center gap-3 text-sm text-gray-700">
            <span className="font-semibold uppercase tracking-[0.2em]">Price</span>
            <span className="text-maroon font-bold text-xl">${selectedProduct.price.toFixed(2)}</span>
          </div>
        )}

        {/* Color Selection */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Color Variants</h3>
            <span className="text-sm font-semibold text-maroon italic">
              {isCustom ? "Bespoke Selection" : selectedProduct?.name}
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProduct(p);
                  setIsCustom(false);
                }}
                className={`relative w-16 h-16 rounded-2xl overflow-hidden transition-all active:scale-95 ${
                  !isCustom && selectedProduct?.id === p.id 
                    ? "ring-4 ring-maroon ring-offset-2 scale-105 z-10 shadow-lg" 
                    : "ring-1 ring-gray-200 opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={p.image} alt={p.name} fill className="object-cover" />
                {p.hasBadge && (
                  <div className="absolute top-1 right-1 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                    96.3% g
                  </div>
                )}
              </button>
            ))}
            
            {/* Custom Color Button */}
            <button
              onClick={() => setIsCustom(true)}
              className={`relative w-16 h-16 rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all active:scale-95 border-2 border-dashed ${
                isCustom 
                  ? "border-maroon bg-maroon/5 ring-4 ring-maroon ring-offset-2 scale-105 z-10 shadow-lg" 
                  : "border-gray-200 text-gray-300 hover:border-maroon/30 hover:text-maroon/30"
              }`}
            >
              <Plus size={20} />
              <span className="text-[8px] font-bold uppercase mt-1">Custom</span>
            </button>
          </div>
        </div>

        {/* Custom Color Input Fields */}
        {isCustom && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-5 bg-gold/5 border border-gold/20 rounded-3xl space-y-4"
          >
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gold mb-2 block">Desired Color Name</label>
              <input 
                type="text" 
                placeholder="e.g. Midnight Navy"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gold/20 rounded-xl outline-none focus:ring-2 focus:ring-gold text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gold mb-2 block">Special Instructions / Description</label>
              <textarea 
                placeholder="Describe your vision (e.g. contrast stitching, specific interior fabric...)"
                value={customColorDescription}
                onChange={(e) => setCustomColorDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gold/20 rounded-xl outline-none focus:ring-2 focus:ring-gold text-sm font-medium h-24 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gold mb-2 block">Reference Photo (Optional)</label>
              <div className="relative h-20 bg-white border-2 border-dashed border-gold/20 rounded-xl flex items-center justify-center group overflow-hidden">
                {customRefImage ? (
                  <Image src={customRefImage} alt="Ref" fill className="object-cover" />
                ) : (
                  <div className="flex items-center gap-3">
                    <ImageIcon size={20} className="text-gold/50" />
                    <span className="text-xs font-bold text-gold/50 uppercase">Tap to upload</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCustomRefSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Size Selection */}
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Select Size</h3>
          <div className="grid grid-cols-3 gap-3">
            {["S", "M", "L"].map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`py-4 rounded-2xl font-bold transition-all border-2 text-sm ${
                  size === s 
                    ? "bg-maroon border-maroon text-white shadow-lg shadow-maroon/20" 
                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity & Buy Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-100">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-maroon transition-colors"
            >
              <Minus size={18} />
            </button>
            <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-maroon transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-grow luxury-gradient text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-maroon/20 active:scale-[0.98] transition-all"
          >
            <ShoppingBag size={20} />
            <span>Express Checkout</span>
            <ChevronRight size={18} className="opacity-50" />
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-gray-50 pt-10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Premium Quality</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Handpicked materials for luxury durability.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">Fast Delivery</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Dispatched within 24 hours of verification.</p>
            </div>
          </div>
        </div>

        {selectedProduct && (
          <div className="mt-10 border-t border-gray-100 pt-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900">{t(language, "comments")}</h3>
                <p className="text-xs text-gray-500 mt-1">{comments.length} {comments.length === 1 ? "comment" : "comments"}</p>
              </div>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="rounded-3xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                  {t(language, "noComments")}
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="font-semibold text-gray-900">{comment.authorName}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">{new Date(comment.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{comment.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmitComment} className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t(language, "yourName")}</label>
                  <input
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-maroon"
                    placeholder={language === "ar" ? "اسمك" : "Your name"}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t(language, "yourComment")}</label>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={4}
                    className="w-full mt-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-maroon"
                    placeholder={language === "ar" ? "اكتب تعليقك هنا" : "Write your comment here"}
                  />
                </div>
              </div>

              {commentError && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{commentError}</div>
              )}
              {commentSuccess && (
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">{commentSuccess}</div>
              )}

              <button
                type="submit"
                disabled={commentLoading}
                className="w-full rounded-2xl bg-maroon px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-maroon/20 hover:opacity-90 transition-all"
              >
                {commentLoading ? t(language, "loading") : t(language, "submitComment")}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="luxury-gradient px-8 py-10 text-white relative">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <Package size={24} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight italic">Checkout</h3>
                    <p className="text-white/60 text-xs">Complete your luxury order</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                {step === "form" && (
                  <form onSubmit={handleCreateOrder} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t(language, "name")}</label>
                        <input 
                          required 
                          placeholder={language === "ar" ? "الاسم الكامل" : "Your full name"}
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-maroon outline-none text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t(language, "email")}</label>
                        <input 
                          required 
                          type="email"
                          placeholder={language === "ar" ? "لائحة التحقق عبر البريد" : "For OTP verification"}
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-maroon outline-none text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t(language, "language")}</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as "en" | "ar")}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-maroon outline-none text-sm transition-all"
                        >
                          <option value="en">{t(language, "english")}</option>
                          <option value="ar">{t(language, "arabic")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t(language, "phone")}</label>
                        <input 
                          required 
                          placeholder={language === "ar" ? "+212 ..." : "+212 ..."}
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-maroon outline-none text-sm transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t(language, "deliveryTime")}</label>
                        <input 
                          required 
                          placeholder={language === "ar" ? "مثال: الاثنين صباحًا" : "e.g. Next Monday AM"}
                          value={formData.deliveryTime}
                          onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-maroon outline-none text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t(language, "address")}</label>
                      <textarea 
                        required 
                        rows={2}
                        placeholder={language === "ar" ? "عنوان الشحن الكامل" : "Complete shipping address"}
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-maroon outline-none text-sm transition-all"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle size={14} />
                        {error}
                      </div>
                    )}

                    <div className="pt-4">
                      <button 
                        disabled={loading}
                        className="w-full luxury-gradient text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        {loading ? t(language, "loading") : t(language, "orderNow")}
                      </button>
                      <p className="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-widest">{t(language, "otpSent")}</p>
                    </div>
                  </form>
                )}

                {step === "otp" && (
                  <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2 italic">Verify Your Identity</h4>
                      <p className="text-gray-500 text-sm">Enter the 6-digit code sent to <span className="font-bold text-maroon">{formData.email}</span></p>
                    </div>

                    <div className="flex justify-center">
                      <input 
                        required
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="w-full max-w-[200px] text-center tracking-[0.5em] text-3xl font-black text-maroon border-b-4 border-gold py-2 outline-none"
                        placeholder="000000"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-lg text-xs inline-flex items-center gap-2">
                        <AlertCircle size={14} />
                        {error}
                      </div>
                    )}

                    <div className="pt-4">
                      <button 
                        disabled={loading}
                        className="w-full luxury-gradient text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                      >
                        {loading ? "Verifying..." : "Confirm Final Order"}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStep("form")}
                        className="text-xs text-gray-400 mt-4 underline font-medium"
                      >
                        Change details or email
                      </button>
                    </div>
                  </form>
                )}

                {step === "success" && (
                  <div className="py-10 text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                      <CheckCircle2 size={40} className="animate-bounce" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2 italic">
                      {language === "ar" ? "تم تأكيد الطلب!" : "Order Confirmed!"}
                    </h4>
                    <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                      {language === "ar"
                        ? "شكرًا لاختيارك Konoz Bag. لقد استلمنا طلبك وسنتصل بك قريبًا لإتمام التوصيل."
                        : "Thank you for choosing Konoz Bag. We have received your order and will contact you shortly for delivery."}
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-10 py-4 border-2 border-maroon text-maroon rounded-xl font-bold hover:bg-maroon hover:text-white transition-all active:scale-95"
                      >
                        Close
                      </button>
                      <a
                        href="/track"
                        className="px-10 py-4 bg-maroon text-white rounded-xl font-bold hover:opacity-90 transition-all"
                      >
                        Track Order
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
