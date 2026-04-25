"use client";
// Pushing latest updates to GitHub

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  addProduct, 
  deleteProduct,
  updateProduct,
  addProductImage, 
  deleteProductImage, 
  addProductColor, 
  deleteProductColor, 
  getAdminProducts, 
  getAdminComments, 
  getConfirmedOrders, 
  deleteOrder, 
  deleteComment 
} from "@/app/actions/admin";
import { Trash2, Plus, LogOut, Package, Image as ImageIcon, ClipboardList, Database, Palette, Camera, X, Menu, Pencil } from "lucide-react";


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "comments">("orders");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProductNameEn, setNewProductNameEn] = useState("");
  const [newProductNameAr, setNewProductNameAr] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newHasBadge, setNewHasBadge] = useState(false);
  const [newProductDescriptionEn, setNewProductDescriptionEn] = useState("");
  const [newProductDescriptionAr, setNewProductDescriptionAr] = useState("");
  const [newProductSizes, setNewProductSizes] = useState("S, M, L");

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [selectedRefImage, setSelectedRefImage] = useState<string | null>(null);
  const [deleteNotify, setDeleteNotify] = useState<Record<string, boolean>>({});
  
  // Mobile Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProductData, setEditProductData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Color Modal States
  const [isAddColorModalOpen, setIsAddColorModalOpen] = useState(false);
  const [colorTargetProductId, setColorTargetProductId] = useState<string | null>(null);
  const [newColorNameEn, setNewColorNameEn] = useState("");
  const [newColorNameAr, setNewColorNameAr] = useState("");
  const [newColorImage, setNewColorImage] = useState<string | null>(null);
  const [isColorUploading, setIsColorUploading] = useState(false);

  // Initial Product Colors State
  const [newProductColors, setNewProductColors] = useState<{nameEn: string, nameAr: string, image: string | null}[]>([]);
  const [tempColorNameEn, setTempColorNameEn] = useState("");
  const [tempColorNameAr, setTempColorNameAr] = useState("");
  const [tempColorImage, setTempColorImage] = useState<string | null>(null);

  const orderStatusOptions = [
    { value: "received", label: "Received" },
    { value: "preparing", label: "Preparing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const loadData = async () => {
    if (activeTab === "products") {
      const data = await getAdminProducts();
      setProducts(data);
    } else if (activeTab === "comments") {
      const data = await getAdminComments();
      setComments(data);
    } else {
      const data = await getConfirmedOrders(orderFilter);
      setOrders(data);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "konozbag/rama") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Invalid password");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, activeTab, orderFilter]); // Removed loadData from dependency to avoid infinite loop

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (!orderId || !status) return;
    setStatusUpdating(orderId);

    try {
      const response = await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await response.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || "Failed to update order status.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to update status. Please try again.");
    }

    setStatusUpdating(null);
  };

  const handleDeleteOrder = async (orderId: string, notifyCustomer: boolean) => {
    if (!orderId) return;
    const shouldDelete = confirm(
      `Are you sure you want to delete this order? ${
        notifyCustomer ? "The customer will be notified." : "The customer will not be notified."
      }`
    );
    if (!shouldDelete) return;

    setStatusUpdating(orderId);
    try {
      const result = await deleteOrder(orderId, notifyCustomer);
      if (result.success) {
        await loadData();
      } else {
        alert(result.error || "Failed to delete order.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to delete order. Please try again.");
    }
    setStatusUpdating(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" exceeds 5MB limit and was skipped.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPreviewImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!newProductNameEn || !newProductNameAr) {
      alert("Please fill in both English and Arabic names.");
      return;
    }

    setIsUploading(true);
    try {
      const res = await addProduct(
        newProductNameEn, 
        newProductNameAr, 
        newProductPrice, 
        newProductDescriptionEn, 
        newProductDescriptionAr, 
        newHasBadge,
        newProductSizes
      );
      
      if (res.success && res.productId) {
        if (previewImages.length > 0) {
          for (const img of previewImages) {
            const imgRes = await addProductImage(res.productId, img);
            if (!imgRes.success) {
              console.error(`Product created but an image upload failed: ${imgRes.error}`);
            }
          }
        }
        if (newProductColors.length > 0) {
          for (const color of newProductColors) {
            await addProductColor({
              productId: res.productId, 
              nameEn: color.nameEn, 
              nameAr: color.nameAr, 
              image: color.image || undefined
            });
          }
        }
        setNewProductNameEn("");
        setNewProductNameAr("");
        setNewProductDescriptionEn("");
        setNewProductDescriptionAr("");
        setNewProductPrice(0);
        setNewHasBadge(false);
        setNewProductSizes("S, M, L");
        setPreviewImages([]);
        setNewProductColors([]);
        setIsAddModalOpen(false);
        await loadData();
        alert("Product successfully added!");
      } else {
        alert(`Upload failed: ${res.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const openEditModal = (product: any) => {
    setEditProductData({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      descriptionEn: product.descriptionEn || "",
      descriptionAr: product.descriptionAr || "",
      hasBadge: product.hasBadge || false,
      sizes: product.sizes || "S, M, L"
    });
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async () => {
    if (!editProductData) return;
    setIsEditing(true);
    try {
      const res = await updateProduct(editProductData.id, {
        nameEn: editProductData.nameEn,
        nameAr: editProductData.nameAr,
        price: editProductData.price,
        descriptionEn: editProductData.descriptionEn,
        descriptionAr: editProductData.descriptionAr,
        hasBadge: editProductData.hasBadge,
        sizes: editProductData.sizes
      });
      if (res.success) {
        setIsEditModalOpen(false);
        await loadData();
        alert("Product successfully updated!");
      } else {
        alert(`Update failed: ${res.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during update.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Delete this bag and all its variants/photos?")) {
      const res = await deleteProduct(id);
      if (res.success) loadData();
    }
  };

  const handleAddImage = async (productId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const res = await addProductImage(productId, reader.result as string);
          if (res.success) loadData();
          else alert(res.error);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Color Modal Logic
  const openColorModal = (productId: string) => {
    setColorTargetProductId(productId);
    setNewColorNameEn("");
    setNewColorNameAr("");
    setNewColorImage(null);
    setIsAddColorModalOpen(true);
  };

  const handleColorImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image exceeds 5MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewColorImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitColor = async () => {
    if (!colorTargetProductId || !newColorNameEn || !newColorNameAr) return;
    setIsColorUploading(true);
    const res = await addProductColor({
      productId: colorTargetProductId, 
      nameEn: newColorNameEn, 
      nameAr: newColorNameAr, 
      image: newColorImage || undefined
    });
    if (res.success) {
      loadData();
      setIsAddColorModalOpen(false);
    } else {
      alert(res.error);
    }
    setIsColorUploading(false);
  };

  const handleDeleteComment = async (id: string) => {
    if (!id) return;
    if (!confirm("Delete this comment permanently?")) return;
    const res = await deleteComment(id);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || "Failed to delete comment.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="luxury-gradient p-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-widest uppercase">Konoz Bag</h1>
            <p className="text-gray-200 mt-2">Admin Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-maroon focus:border-transparent transition-all outline-none"
                placeholder="Enter admin password"
              />
            </div>
            <button 
              type="submit"
              className="w-full luxury-gradient text-white py-3 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <h1 className="text-xl font-bold text-maroon tracking-tighter italic">KONOZ BAG</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 bg-gray-100 rounded-lg">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 p-6 flex flex-col 
        transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="mb-10 hidden md:block">
          <h1 className="text-2xl font-bold text-maroon tracking-tighter italic">KONOZ BAG</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Management</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <button 
            onClick={() => { setActiveTab("orders"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "orders" ? "bg-maroon/5 text-maroon font-semibold" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <ClipboardList size={20} />
            <span>Orders</span>
          </button>
          <button 
            onClick={() => { setActiveTab("products"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "products" ? "bg-maroon/5 text-maroon font-semibold" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <ImageIcon size={20} />
            <span>Products</span>
          </button>
          <button 
            onClick={() => { setActiveTab("comments"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "comments" ? "bg-maroon/5 text-maroon font-semibold" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <Database size={20} />
            <span>Comments</span>
          </button>
        </nav>

        <button 
          onClick={() => {
            sessionStorage.removeItem("admin_auth");
            setIsAuthenticated(false);
          }}
          className="mt-10 flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow p-4 md:p-10 overflow-auto w-full max-w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 capitalize">{activeTab}</h2>
            <p className="text-gray-500">Manage your store {activeTab} here.</p>
          </div>
          
          {activeTab === "products" && (
            <div className="flex gap-4">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-maroon text-white rounded-xl font-bold shadow-lg shadow-maroon/20 hover:opacity-90 transition-all"
              >
                <Plus size={20} />
                <span>Add New Bag</span>
              </button>
            </div>
          )}
        </header>

        {/* Add Product Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="luxury-gradient px-8 py-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-bold italic">Add New Luxury Bag</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-white/60 hover:text-white"><LogOut size={20} className="rotate-90" /></button>
              </div>
              
              <div className="p-4 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Bag Name (EN)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Royal Maroon"
                        value={newProductNameEn}
                        onChange={(e) => setNewProductNameEn(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Bag Name (AR)</label>
                      <input 
                        type="text" 
                        placeholder="مثال: الحقيبة الملكية"
                        value={newProductNameAr}
                        onChange={(e) => setNewProductNameAr(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm text-right"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Price Tag</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Available Sizes</label>
                      <input 
                        type="text" 
                        value={newProductSizes}
                        onChange={(e) => setNewProductSizes(e.target.value)}
                        placeholder="e.g. S, M, L, XL"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description (EN)</label>
                      <textarea 
                        placeholder="Luxury features..."
                        value={newProductDescriptionEn}
                        onChange={(e) => setNewProductDescriptionEn(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm h-24 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description (AR)</label>
                      <textarea 
                        placeholder="وصف الحقيبة..."
                        value={newProductDescriptionAr}
                        onChange={(e) => setNewProductDescriptionAr(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm h-24 resize-none text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <input 
                    type="checkbox" 
                    checked={newHasBadge}
                    onChange={(e) => setNewHasBadge(e.target.checked)}
                    className="w-5 h-5 text-maroon rounded border-gray-300 focus:ring-maroon"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-700">Apply "96.3% g" Badge</p>
                    <p className="text-[10px] text-gray-400 uppercase">Verification mark for high-grade beads</p>
                  </div>
                </div>

                {/* Product Colors Upload */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Color Variants</label>
                  
                  {newProductColors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {newProductColors.map((c, idx) => (
                        <div key={idx} className="pr-1 pl-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2 shadow-sm">
                          {c.image && (
                            <div className="w-5 h-5 rounded-md overflow-hidden relative border border-gray-100 flex-shrink-0">
                              <Image src={c.image} alt={c.nameEn} fill className="object-cover" />
                            </div>
                          )}
                          <span>{c.nameEn} | {c.nameAr}</span>
                          <button 
                            onClick={() => setNewProductColors(prev => prev.filter((_, i) => i !== idx))} 
                            className="text-gray-300 hover:text-red-500 p-1 ml-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input 
                      type="text" placeholder="Color Name (EN)" 
                      value={tempColorNameEn} onChange={e => setTempColorNameEn(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm"
                    />
                    <input 
                      type="text" placeholder="Color Name (AR)" 
                      value={tempColorNameAr} onChange={e => setTempColorNameAr(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm text-right" dir="rtl"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {tempColorImage ? (
                       <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group">
                         <Image src={tempColorImage} alt="Color" fill className="object-cover" />
                         <button onClick={() => setTempColorImage(null)} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                       </div>
                    ) : (
                      <label className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl cursor-pointer hover:bg-gray-100 flex items-center gap-2 shadow-sm">
                        <Camera size={14} /> Add Color Photo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) return alert("Image exceeds 5MB limit.");
                            const r = new FileReader();
                            r.onloadend = () => setTempColorImage(r.result as string);
                            r.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    )}
                    
                    <button 
                      onClick={() => {
                        if (!tempColorNameEn || !tempColorNameAr) return alert("Please provide both EN and AR color names.");
                        setNewProductColors(prev => [...prev, { nameEn: tempColorNameEn, nameAr: tempColorNameAr, image: tempColorImage }]);
                        setTempColorNameEn("");
                        setTempColorNameAr("");
                        setTempColorImage(null);
                      }}
                      className="ml-auto text-xs font-bold text-white bg-maroon px-4 py-2 rounded-xl hover:opacity-90 shadow-sm"
                    >
                      + Add Variant
                    </button>
                  </div>
                </div>

                {/* Product Images Upload */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Product Photos ({previewImages.length})</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {previewImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                        <Image src={img} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                        <button 
                          onClick={() => setPreviewImages((prev) => prev.filter((_, i) => i !== idx))} 
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-maroon/30 transition-all bg-gray-50">
                      <Camera size={18} className="text-gray-300 mb-1" />
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Add</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={handleFileSelect} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-300">Max 5MB each • JPG, PNG, WebP • Select multiple at once</p>
                </div>

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-grow py-4 border-2 border-gray-100 text-gray-400 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isUploading || !newProductNameEn || !newProductNameAr}
                    onClick={handleUpload}
                    className="flex-[2] py-4 bg-maroon text-white rounded-xl font-bold luxury-gradient shadow-lg disabled:opacity-50 transition-all"
                  >
                    {isUploading ? "Processing..." : "Create Bag Listing"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {isEditModalOpen && editProductData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="luxury-gradient px-6 py-5 text-white flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-bold italic">Edit Luxury Bag</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-white/60 hover:text-white"><LogOut size={20} className="rotate-90" /></button>
              </div>
              
              <div className="p-4 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Bag Name (EN)</label>
                      <input 
                        type="text" 
                        value={editProductData.nameEn}
                        onChange={(e) => setEditProductData({...editProductData, nameEn: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Bag Name (AR)</label>
                      <input 
                        type="text" 
                        value={editProductData.nameAr}
                        onChange={(e) => setEditProductData({...editProductData, nameAr: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-right"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Price Tag</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editProductData.price}
                        onChange={(e) => setEditProductData({...editProductData, price: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Available Sizes</label>
                      <input 
                        type="text" 
                        value={editProductData.sizes}
                        onChange={(e) => setEditProductData({...editProductData, sizes: e.target.value})}
                        placeholder="e.g. S, M, L, XL"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description (EN)</label>
                      <textarea 
                        value={editProductData.descriptionEn}
                        onChange={(e) => setEditProductData({...editProductData, descriptionEn: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description (AR)</label>
                      <textarea 
                        value={editProductData.descriptionAr}
                        onChange={(e) => setEditProductData({...editProductData, descriptionAr: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <input 
                    type="checkbox" 
                    checked={editProductData.hasBadge}
                    onChange={(e) => setEditProductData({...editProductData, hasBadge: e.target.checked})}
                    className="w-5 h-5 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-700">Apply "96.3% g" Badge</p>
                    <p className="text-[10px] text-gray-400 uppercase">Verification mark for high-grade beads</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8 mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Current Photos</h4>
                      <button 
                        onClick={() => handleAddImage(editProductData.id)}
                        className="text-[10px] font-black uppercase bg-maroon/5 text-maroon px-3 py-1.5 rounded-lg hover:bg-maroon/10 transition-all"
                      >
                        + Upload Photo
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {products.find(p => p.id === editProductData.id)?.images?.map((img: any) => (
                        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                          <Image src={img.image} alt="Bag" fill className="object-cover" />
                          <button 
                            onClick={() => deleteProductImage(img.id).then(loadData)}
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Color Variants</h4>
                      <button 
                        onClick={() => openColorModal(editProductData.id)}
                        className="text-[10px] font-black uppercase bg-maroon/5 text-maroon px-3 py-1.5 rounded-lg hover:bg-maroon/10 transition-all"
                      >
                        + New Color
                      </button>
                    </div>
                    <div className="space-y-2">
                      {products.find(p => p.id === editProductData.id)?.colors?.map((color: any) => (
                        <div key={color.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 relative rounded-lg overflow-hidden border border-gray-200 bg-white">
                              {color.image ? (
                                <Image src={color.image} alt={color.nameEn} fill className="object-cover" />
                              ) : (
                                <Palette size={16} className="m-auto mt-2.5 text-gray-300" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-700">{color.nameEn}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{color.nameAr}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteProductColor(color.id).then(loadData)}
                            className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-8 sticky bottom-0 bg-white border-t border-gray-100 mt-8">
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-grow py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isEditing || !editProductData.nameEn || !editProductData.nameAr}
                    onClick={handleEditProduct}
                    className="flex-[2] py-4 bg-maroon text-white rounded-2xl font-bold shadow-xl shadow-maroon/20 disabled:opacity-50 transition-all luxury-gradient"
                  >
                    {isEditing ? "Processing..." : "Save Product Details"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Color Modal */}
        {isAddColorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddColorModalOpen(false)} />
            <div className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
              <div className="luxury-gradient px-6 py-5 text-white flex justify-between items-center">
                <h3 className="text-lg font-bold italic flex items-center gap-2">
                  <Palette size={20} /> Add Color Variant
                </h3>
                <button onClick={() => setIsAddColorModalOpen(false)} className="text-white/60 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Color Name (EN)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Midnight Navy"
                    value={newColorNameEn}
                    onChange={(e) => setNewColorNameEn(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Color Name (AR)</label>
                  <input 
                    type="text" 
                    placeholder="مثال: أزرق داكن"
                    value={newColorNameAr}
                    onChange={(e) => setNewColorNameAr(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm text-right"
                    dir="rtl"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Color Photo (Optional)</label>
                  <div className="flex items-center gap-4">
                    {newColorImage ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        <Image src={newColorImage} alt="Color Preview" fill className="object-cover" />
                        <button 
                          onClick={() => setNewColorImage(null)} 
                          className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-maroon/30 transition-all bg-gray-50">
                        <Camera size={18} className="text-gray-300 mb-1" />
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Upload</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleColorImageSelect} 
                          className="hidden" 
                        />
                      </label>
                    )}
                    <p className="text-xs text-gray-400 flex-1">
                      Upload an image specifically showing this color variant.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddColorModalOpen(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isColorUploading || !newColorNameEn || !newColorNameAr}
                    onClick={submitColor}
                    className="flex-[2] py-3 bg-maroon text-white rounded-xl font-bold luxury-gradient shadow-md disabled:opacity-50 transition-all"
                  >
                    {isColorUploading ? "Saving..." : "Add Color"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {activeTab === "orders" ? (
            <>
              <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Orders</p>
                  <p className="text-sm text-gray-500">Filter by status and choose whether to notify customers.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <label className="text-xs uppercase tracking-[0.2em] text-gray-500 hidden md:block">Filter</label>
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm w-full md:w-auto"
                  >
                    <option value="all">All Statuses</option>
                    {orderStatusOptions.map((statusOption) => (
                      <option key={statusOption.value} value={statusOption.value}>
                        {statusOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Ordered Product & Descr.</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Reference Image</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Delivery</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Notify</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Qty & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-400">No confirmed orders yet.</td>
                    </tr>
                  ) : orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-gray-900">{order.customerName}</div>
                          <div className="text-xs text-gray-500">{order.customerPhone}</div>
                          <div className="text-[10px] text-gray-400 max-w-[150px] whitespace-pre-wrap">{order.customerAddress}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 relative rounded-lg bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
                              {order.colorImageBase64 ? (
                                <Image 
                                  src={order.colorImageBase64} 
                                  alt={order.colorName} 
                                  fill 
                                  className="object-cover"
                                />
                              ) : (
                                <ImageIcon className="text-gray-300 m-auto mt-3" size={20} />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-700">{order.colorName}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-bold w-fit mt-1">{order.size}</span>
                            </div>
                          </div>
                          {order.customDescription && (
                            <div className="text-[10px] bg-gold/5 border border-gold/10 p-2 rounded-lg text-gray-600 italic">
                              " {order.customDescription} "
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.customRefImage ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gold/20 shadow-sm group">
                            <Image src={order.customRefImage} alt="Ref" fill className="object-cover" />
                            <button 
                              onClick={() => setSelectedRefImage(order.customRefImage)} 
                              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-bold"
                            >
                              VIEW FULL
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic">No ref image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-700">{order.deliveryMethod === 'pickup' ? 'PICK UP' : 'DELIVERY'}</span>
                          <span className="text-[10px] text-gray-400">{order.deliveryDateTime}</span>
                          <span className="text-[9px] text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <select
                            value={order.status || "received"}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className={`px-3 py-2 border rounded-xl text-xs font-bold ${
                              order.status === 'delivered' ? 'border-green-200 bg-green-50 text-green-700' :
                              order.status === 'cancelled' ? 'border-red-200 bg-red-50 text-red-700' :
                              'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            {orderStatusOptions.map((statusOption) => (
                              <option key={statusOption.value} value={statusOption.value}>
                                {statusOption.label}
                              </option>
                            ))}
                          </select>
                          {order.language && (
                            <div className="text-[9px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1">
                              <Database size={8} /> {order.language}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <label className="inline-flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-maroon transition-colors">
                          <input
                            type="checkbox"
                            checked={!!deleteNotify[order.id]}
                            onChange={(e) => setDeleteNotify((prev) => ({ ...prev, [order.id]: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-300 text-maroon focus:ring-maroon"
                          />
                          Notify
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <div className="text-right">
                            <div className="text-xs font-black text-maroon">x{order.quantity}</div>
                            <div className="text-[9px] text-gray-400 font-bold">QTY</div>
                          </div>
                          <button
                            onClick={() => handleDeleteOrder(order.id, !!deleteNotify[order.id])}
                            disabled={statusUpdating === order.id}
                            className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : activeTab === "products" ? (
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
              {products.length === 0 ? (
                <div className="col-span-full py-20 text-center text-gray-400">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No products added yet. Start by adding your first luxury bag.</p>
                </div>
              ) : products.map((product) => (
                <div key={product.id} className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 flex flex-col shadow-sm hover:shadow-md transition-all h-full">
                  <div className="p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="pr-2 flex-grow">
                        <h4 className="font-bold text-gray-900 text-lg italic whitespace-normal">{product.nameEn}</h4>
                        <p className="text-sm text-gray-400 font-medium text-right whitespace-normal" dir="rtl">{product.nameAr}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white rounded-xl transition-all shadow-sm flex-shrink-0"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm flex-shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-maroon font-black uppercase tracking-widest">${product.price.toFixed(2)}</p>
                  </div>

                  {/* Images Section */}
                  <div className="p-6 space-y-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Camera size={12} />
                        Photos ({product.images?.length || 0})
                      </h5>
                      <button 
                        onClick={() => handleAddImage(product.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-maroon hover:underline px-2 py-1 bg-maroon/5 rounded-lg"
                      >
                        + Add Photo
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {product.images?.map((img: any) => (
                        <div key={img.id} className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 group">
                          <Image src={img.image} alt="Product" fill className="object-cover" />
                          <button 
                            onClick={() => deleteProductImage(img.id).then(loadData)}
                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(!product.images || product.images.length === 0) && (
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-200 flex-shrink-0">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Colors Section */}
                  <div className="p-6 bg-white/50 border-t border-gray-100 space-y-4 mt-auto flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Palette size={12} />
                        Colors ({product.colors?.length || 0})
                      </h5>
                      <button 
                        onClick={() => openColorModal(product.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-maroon hover:underline px-2 py-1 bg-maroon/5 rounded-lg"
                      >
                        + Add Color
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.colors?.map((color: any) => (
                        <div key={color.id} className="pr-1 pl-3 py-1 bg-white border border-gray-100 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-2 group shadow-sm">
                          {color.image && (
                            <div className="w-5 h-5 rounded-md overflow-hidden relative border border-gray-200 flex-shrink-0">
                              <Image src={color.image} alt={color.nameEn} fill className="object-cover" />
                            </div>
                          )}
                          <span className="truncate max-w-[100px]">{color.nameEn}</span>
                          <button 
                            onClick={() => deleteProductColor(color.id).then(loadData)}
                            className="text-gray-300 hover:text-red-500 p-1 ml-auto"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(!product.colors || product.colors.length === 0) && (
                        <p className="text-[10px] text-gray-400 italic">No color variants added.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : activeTab === "comments" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Author</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Comment</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {comments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No comments yet.</td>
                    </tr>
                  ) : comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{comment.authorName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate">{comment.message}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {comment.product?.nameEn || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedRefImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedRefImage(null)} />
          <div className="relative max-w-4xl w-full h-[80vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Reference Image Preview</h3>
              <button onClick={() => setSelectedRefImage(null)} className="p-2 hover:bg-white rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow relative p-4 bg-gray-100">
              <Image src={selectedRefImage} alt="Ref Preview" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
