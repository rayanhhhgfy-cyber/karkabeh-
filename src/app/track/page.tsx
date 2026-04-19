"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t, LOCALES, translations, STATUS_LABELS, Locale } from "@/lib/i18n";
import { ArrowLeft } from "lucide-react";

function getCookie(name: string) {
  return document.cookie.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))?.split("=")[1] || "";
}

export default function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [language, setLanguage] = useState<Locale>("en");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedOrderId = getCookie("konoz_order_id");
    const savedEmail = getCookie("konoz_order_email");
    if (savedOrderId) setOrderId(savedOrderId);
    if (savedEmail) setEmail(savedEmail);
    if (savedOrderId && savedEmail) {
      fetchStatus(savedOrderId, savedEmail);
    }
  }, []);

  const fetchStatus = async (id: string, emailAddress: string) => {
    if (!id || !emailAddress) return;
    setLoading(true);
    setMessage("");
    setStatus(null);
    try {
      const response = await fetch(`/api/order-status?orderId=${encodeURIComponent(id)}&email=${encodeURIComponent(emailAddress)}`);
      const data = await response.json();
      if (data.success && data.order) {
        setStatus(data.order.status || "pending");
        setLanguage(data.order.language || "en");
        setMessage(t(data.order.language || "en", "orderConfirmed"));
      } else {
        setMessage(t(language, "noOrderFound"));
      }
    } catch (error) {
      setMessage("Unable to load order status.");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchStatus(orderId, email);
  };

  const handleSaveCookie = () => {
    document.cookie = `konoz_order_id=${orderId}; path=/; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `konoz_order_email=${encodeURIComponent(email)}; path=/; max-age=${60 * 60 * 24 * 30}`;
    alert("Tracking cookie saved. Return anytime to view status.");
  };

  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-maroon hover:text-gold transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-bold uppercase tracking-widest">Back</span>
        </Link>
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">{t(language, "tracking")}</span>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-maroon mb-4 tracking-tight">{t(language, "trackYourOrder")}</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">{t(language, "orderTrackingHelp")}</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 block mb-2">{t(language, "orderId")}</label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={t(language, "enterOrderId")}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-maroon"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 block mb-2">{t(language, "email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t(language, "enterEmail")}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-maroon"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-maroon text-white rounded-2xl font-semibold hover:opacity-90 transition-all"
            >
              {loading ? t(language, "loading") : t(language, "trackYourOrder")}
            </button>
            <button
              type="button"
              onClick={handleSaveCookie}
              className="px-6 py-3 border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all"
            >
              {t(language, "saveCookie")}
            </button>
          </div>
        </form>

        <div className="mt-10 bg-gray-50 rounded-3xl border border-gray-200 p-8">
          {loading ? (
            <p className="text-gray-500">{t(language, "loading")}</p>
          ) : (
            <>
              {status ? (
                <div className="space-y-5">
                  <div className="text-sm uppercase tracking-[0.3em] text-gray-400">{t(language, "currentStatus")}</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-3 bg-maroon text-white rounded-full font-bold">{STATUS_LABELS[language][status] ?? status}</span>
                    <span className="text-sm text-gray-500">{message}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">{message || t(language, "orderPending")}</p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
