"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { addProductImage, deleteProductImage, getAdminProducts, getAdminComments, getConfirmedOrders, deleteOrder, deleteComment } from "@/app/actions/admin";
import { seedProducts } from "@/app/actions/seed";
import { Trash2, Plus, LogOut, Package, Image as ImageIcon, ClipboardList, Database } from "lucide-react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "comments">("orders");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newHasBadge, setNewHasBadge] = useState(false);
  const [newProductDescription, setNewProductDescription] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [deleteNotify, setDeleteNotify] = useState<Record<string, boolean>>({});
  const orderStatusOptions = [
    { value: "received", label: "Received" },
    { value: "preparing", label: "Preparing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const handleSeed = async () => {
    if (confirm("This will add the initial Maroon, Gold, and Emerald bags for your review. Proceed?")) {
      const res = await seedProducts();
      if (res.success) {
        alert(res.message);
        loadData();
      } else {
        alert(res.error || "Seed failed");
      }
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
  }, [isAuthenticated, activeTab, orderFilter]);

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
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPreviewImage(reader.result as string);
        } else {
          alert("Failed to read image file");
        }
      };
      reader.onerror = () => {
        alert("Error reading file");
      };
      reader.readAsDataURL(file);
    }
  };

    const handleUpload = async () => {
    if (!previewImage || !newProductName) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsUploading(true);
    const res = await addProductImage(newProductName, previewImage, newProductDescription, newHasBadge, newProductPrice);
    
    if (res.success) {
      setNewProductName("");
      setNewProductDescription("");
      setNewProductPrice(0);
      setNewHasBadge(false);
      setPreviewImage(null);
      setIsAddModalOpen(false);
      loadData();
    } else {
      // Show specific error message from the backend
      alert(`Upload failed: ${res.error || "Unknown error"}`);
    }
    setIsUploading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure?")) {
      const res = await deleteProductImage(id);
      if (res.success) loadData();
    }
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
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-maroon tracking-tighter italic">KONOZ BAG</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Management</p>
        </div>
        
        <nav className="space-y-2 flex-grow">
          <button 
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "orders" ? "bg-maroon/5 text-maroon font-semibold" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <ClipboardList size={20} />
            <span>Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "products" ? "bg-maroon/5 text-maroon font-semibold" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <ImageIcon size={20} />
            <span>Products</span>
          </button>
          <button 
            onClick={() => setActiveTab("comments")}
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
      <div className="flex-grow p-4 md:p-10 overflow-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 capitalize">{activeTab}</h2>
            <p className="text-gray-500">Manage your store {activeTab} here.</p>
          </div>
          
          {activeTab === "products" && (
            <div className="flex gap-4">
              <button 
                onClick={handleSeed}
                className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                <Database size={20} />
                <span>Seed Collection</span>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-maroon text-white rounded-xl font-bold shadow-lg shadow-maroon/20 hover:opacity-90 transition-all"
              >
                <Plus size={20} />
                <span>Add New Bag</span>
              </button>
            </div>
          )}
          {activeTab === "comments" && (
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">Review and remove inappropriate comments.</p>
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
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Color Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Royal Maroon"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                      <textarea 
                        placeholder="Luxury features, material details..."
                        value={newProductDescription}
                        onChange={(e) => setNewProductDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-maroon text-sm h-32 resize-none"
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
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newHasBadge}
                        onChange={(e) => setNewHasBadge(e.target.checked)}
                        className="w-4 h-4 text-maroon rounded"
                      />
                      <span className="text-sm font-medium text-gray-600">Apply "96.3% g" Badge</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Product Photo</label>
                    <div className="aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden relative border-2 border-dashed border-gray-200 flex flex-col items-center justify-center group cursor-pointer hover:bg-gray-50 transition-all">
                      {previewImage ? (
                        <Image src={previewImage} alt="Preview" fill className="object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Tap to Upload</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-grow py-4 border-2 border-gray-100 text-gray-400 rounded-xl font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isUploading || !previewImage || !newProductName}
                    onClick={handleUpload}
                    className="flex-[2] py-4 bg-maroon text-white rounded-xl font-bold luxury-gradient shadow-lg disabled:opacity-50 transition-all"
                  >
                    {isUploading ? "Uploading..." : "Save Product Color"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {activeTab === "orders" ? (
            <>
              <div className="p-6 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Orders</p>
                  <p className="text-sm text-gray-500">Filter by status and choose whether to notify customers.</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs uppercase tracking-[0.2em] text-gray-500">Filter</label>
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm"
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
                <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Variant</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Delivery</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">Notify</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Action</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Qty</th>
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
                        <div className="font-semibold text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerPhone}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{order.customerAddress}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
                            <Image 
                              src={order.colorImageBase64} 
                              alt={order.colorName} 
                              fill 
                              className="object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{order.colorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase">{order.size}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.deliveryDateTime}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <select
                            value={order.status || "received"}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
                          >
                            {orderStatusOptions.map((statusOption) => (
                              <option key={statusOption.value} value={statusOption.value}>
                                {statusOption.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleUpdateStatus(order.id, order.status || "received")}
                            disabled={statusUpdating === order.id}
                            className="px-3 py-2 bg-maroon text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
                          >
                            {statusUpdating === order.id ? "Updating..." : "Update"}
                          </button>
                        </div>
                        {order.language && (
                          <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">
                            {order.language.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <label className="inline-flex items-center gap-2 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            checked={!!deleteNotify[order.id]}
                            onChange={(e) => setDeleteNotify((prev) => ({ ...prev, [order.id]: e.target.checked }))}
                            className="w-4 h-4 rounded border border-gray-300 text-maroon focus:ring-maroon"
                          />
                          Notify
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteOrder(order.id, !!deleteNotify[order.id])}
                          disabled={statusUpdating === order.id}
                          className="px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-all"
                        >
                          {statusUpdating === order.id ? "Processing..." : "Delete"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-maroon">
                        x{order.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : activeTab === "products" ? (
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.length === 0 ? (
                <div className="col-span-full py-10 text-center text-gray-400">No products added. Add one using the button above.</div>
              ) : products.map((product) => (
                <div key={product.id} className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 transition-all hover:shadow-md">
                  <div className="aspect-square relative">
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      fill 
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    {product.hasBadge && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        96.3% g
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Color Variant</p>
                      <p className="text-xs text-maroon font-semibold mt-1">${product.price?.toFixed(2) ?? "0.00"}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "comments" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
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
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xl truncate">{comment.message}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {comment.product?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
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
    </div>
  );
}
