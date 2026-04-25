"use server";

import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { revalidatePath, unstable_noStore } from "next/cache";
import crypto from "crypto";
import { LOCALES, STATUS_LABELS } from "@/lib/i18n";

// Helper to escape HTML and prevent XSS in emails
const escapeHTML = (str: any) => 
  String(str || "").replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));

// Helper for HTML attributes (prevents quotes from breaking tags)
const escapeAttr = (str: any) => 
  String(str || "").replace(/"/g, '&quot;');

const normalizeLocale = (locale: string | undefined) => {
  const normalized = String(locale || "").toLowerCase();
  return LOCALES.includes(normalized as any) ? (normalized as typeof LOCALES[number]) : "en";
};

const validStatusValues = ["pending", "received", "preparing", "shipped", "delivered", "cancelled"];

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Konoz Bag <onboarding@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const getStatusLabel = (status: string, locale: string) => {
  return STATUS_LABELS[normalizeLocale(locale)][status] || status;
};

async function sendOrderStatusEmail(order: any, status: string, locale: string) {
  if (!resend) throw new Error("Email service not configured. Please check your API key.");

  const customerName = order.customerName || "Customer";
  const statusLabel = getStatusLabel(status, locale);
  const isArabic = locale === "ar";
  const subject = isArabic
    ? `حالة طلبك: ${statusLabel}`
    : `Your order is now ${statusLabel}`;

  const intro = isArabic
    ? `مرحبًا ${escapeHTML(customerName)},<br /><br />لقد تم تحديث حالة طلبك إلى <strong>${escapeHTML(statusLabel)}</strong>.`
    : `Hello ${escapeHTML(customerName)},<br /><br />Your order status has been updated to <strong>${escapeHTML(statusLabel)}</strong>.`;

  const nextStep = isArabic
    ? `سوف نتواصل معك عندما يكون هناك تحديث جديد.`
    : `We will notify you again with the next update.`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: order.customerEmail,
    subject,
    html: `
      <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-top: 8px solid #731818;">
        <h1 style="color: #731818; text-align: center; letter-spacing: 4px;">KONOZ BAG</h1>
        <p style="font-size: 16px; color: #333; line-height: 1.7;">${intro}</p>
        <div style="background: #f9f9f9; padding: 25px; margin: 25px 0; border-radius: 12px;">
          <p style="margin: 0; font-size: 16px; color: #555;">${isArabic ? "الحالة الحالية:" : "Current status:"} <strong>${escapeHTML(statusLabel)}</strong></p>
          <p style="margin-top: 12px; font-size: 14px; color: #777;">${nextStep}</p>
        </div>
        <p style="font-size: 14px; color: #999; text-align: center;">Order ID: ${escapeHTML(order.id)}</p>
      </div>
    `,
  });
}

export async function createOrder(formData: any) {
  try {
    if (!resend) throw new Error("Email service not configured. Please check your API key.");

    const customerNameRaw = String(formData.name || "").trim() || "Guest";
    const customerEmail = String(formData.email || "").trim().toLowerCase();
    const quantity = Math.max(1, Math.floor(parseInt(String(formData.quantity || 1), 10)));

    if (!customerEmail) throw new Error("Customer email is required");

    // Bug 2: Correct range (100000 to 1000000) so 999999 is possible
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    
    const language = normalizeLocale(String(formData.language || "en"));
    const order = await prisma.order.create({
      data: {
        customerName: customerNameRaw, // Store RAW
        customerEmail,
        customerPhone: String(formData.phone || ""),
        customerAddress: String(formData.address || ""),
        deliveryDateTime: String(formData.deliveryTime || "TBD"),
        colorName: String(formData.colorName || "Standard"),
        colorImageBase64: formData.colorImage || null,
        customRefImage: formData.customRefImage || null,
        customDescription: formData.customDescription || null,
        size: String(formData.size || "M"),
        quantity,
        deliveryMethod: String(formData.deliveryMethod || "delivery"),
        otpCode,
        isConfirmed: false,
        status: "pending",
        language,
      },
    });

    const locale = normalizeLocale(String(formData.language || "en"));
    const otpSubject = locale === "ar" ? "رمز التحقق من Konoz Bag" : "Your Konoz Bag Verification Code";
    const otpIntro = locale === "ar"
      ? `مرحبًا ${escapeHTML(customerNameRaw)},<br /><br />شكرًا لطلبك من Konoz Bag. لإكمال طلبك، استخدم رمز التحقق التالي:`
      : `Hello ${escapeHTML(customerNameRaw)},<br /><br />Thank you for your interest in Konoz Bag. To complete your order, please use the following verification code:`;
    const otpFooter = locale === "ar"
      ? `سيكون هذا الرمز صالحًا لفترة قصيرة. إذا لم تطلب هذا، يرجى تجاهل هذه الرسالة.`
      : `This code will expire shortly. If you did not request this, please ignore this email.`;

    // Send OTP Email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: otpSubject,
      html: `
        <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-top: 8px solid #731818;">
          <h1 style="color: #731818; text-align: center; letter-spacing: 4px;">KONOZ BAG</h1>
          <p style="font-size: 18px; color: #333; line-height: 1.6;">${otpIntro}</p>
          <div style="background: #f9f9f9; padding: 30px; text-align: center; margin: 30px 0; border-radius: 12px;">
            <span style="font-size: 36px; font-weight: bold; color: #731818; letter-spacing: 10px;">${otpCode}</span>
          </div>
          <p style="font-size: 14px; color: #999; text-align: center;">${otpFooter}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} Konoz Bag Luxury. All rights reserved.</p>
        </div>
      `,
    });

    await revalidatePath("/admin");
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("Error creating order:", error);
    const displayError = error.message?.includes("Prisma") || error.message?.includes("database") 
      ? "Database synchronization failed. Please try again."
      : error.message || "Failed to process order";
    return { success: false, error: displayError };
  }
}

export async function verifyOTP(orderId: string, otpInput: string) {
  try {
    if (!resend) throw new Error("Email service not configured");

    const otp = String(otpInput || "").trim();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.isConfirmed || order.otpCode !== otp) {
      return { success: false, error: "Invalid or already used verification code" };
    }

    // Bug 3: Send ADMIN NOTIFICATION FIRST. 
    // This prevents bricking the session if Resend fails.
    // If it fails, the catch block triggers, and the customer can retry the OTP.
    await resend.emails.send({
      from: FROM_EMAIL,
      to: process.env.ADMIN_NOTIFICATION_EMAIL || "admin@konozbag.com",
      subject: `NEW ORDER: ${order.customerName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 2px solid #731818; border-radius: 10px;">
          <h2 style="color: #731818; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Full Order Details</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
            <p><strong>Phone:</strong> ${escapeHTML(order.customerPhone)}</p>
            <p><strong>Email:</strong> ${escapeHTML(order.customerEmail)}</p>
            <p><strong>Address:</strong><br>${escapeHTML(order.customerAddress).replace(/\n/g, '<br>')}</p>
            <p><strong>Method:</strong> ${order.deliveryMethod === 'pickup' ? 'PICK UP' : 'DELIVERY'}</p>
            <p><strong>Delivery/Pickup Info:</strong> ${escapeHTML(order.deliveryDateTime)}</p>
          </div>

          <div style="background: #fdf2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #731818; margin-top: 0;">Order Summary</h3>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td width="100" style="vertical-align: top;">
                  <div style="width: 100px; height: 100px; overflow: hidden; border-radius: 5px; border: 1px solid #731818; background: #eee;">
                     ${(order.colorImageBase64 || order.customRefImage) ? `
                       <img src="${order.colorImageBase64 || order.customRefImage}" alt="${escapeAttr(order.colorName)}" style="width:100%; height:100%; object-fit:cover;">
                     ` : `
                       <div style="text-align:center; padding-top:40px; color:#999; font-size:10px;">NO IMAGE</div>
                     `}
                  </div>
                </td>
                <td style="padding-left: 20px; vertical-align: top;">
                  <p style="margin: 5px 0;"><strong>Color:</strong> ${escapeHTML(order.colorName)} ${order.customRefImage ? '(Custom Reference Provided)' : ''}</p>
                  ${order.customDescription ? `<p style="margin: 5px 0;"><strong>Bespoke Instructions:</strong> ${escapeHTML(order.customDescription)}</p>` : ''}
                  <p style="margin: 5px 0;"><strong>Size:</strong> ${escapeHTML(order.size)}</p>
                  <p style="margin: 5px 0;"><strong>Quantity:</strong> ${order.quantity}</p>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${BASE_URL}/admin" style="background: #731818; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View in Admin Dashboard
            </a>
          </div>

          <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            Order ID: ${order.id} | Timestamp: ${new Date().toLocaleString()}
          </div>
        </div>
      `,
    });

    // Finalize the order in the database ONLY after successful email delivery
    await prisma.order.update({
      where: { id: orderId },
      data: { isConfirmed: true, status: "received" },
    });
    await sendOrderStatusEmail(order, "received", normalizeLocale((order as any).language || "en"));

    await revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return { success: false, error: "Verification failed. Please check your internet and try again." };
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const normalizedStatus = validStatusValues.includes(status) ? status : "preparing";
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "Order not found." };
    }
    if (!order.isConfirmed) {
      return { success: false, error: "Order has not been confirmed yet." };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: normalizedStatus },
    });

    await sendOrderStatusEmail(updatedOrder, normalizedStatus, normalizeLocale((order as any).language || "en"));
    await revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return { success: false, error: error.message || "Failed to update order status." };
  }
}

export async function deleteOrder(orderId: string, notifyCustomer: boolean = false) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (notifyCustomer && resend && order.customerEmail) {
      const locale = normalizeLocale((order as any).language || "en");
      const isArabic = locale === "ar";
      const subject = isArabic ? "تم إلغاء طلبك" : "Your order has been cancelled";
      const message = isArabic
        ? `مرحبًا ${escapeHTML(order.customerName)},<br /><br />نأسف لإعلامك أن طلبك رقم <strong>${escapeHTML(order.id)}</strong> قد تم إلغاؤه. إذا كانت لديك أي أسئلة، يرجى الرد على هذا البريد.`
        : `Hello ${escapeHTML(order.customerName)},<br /><br />We’re sorry to let you know that your order <strong>${escapeHTML(order.id)}</strong> has been cancelled. If you have any questions, reply to this email.`;

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: order.customerEmail,
          subject,
          html: `
            <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-top: 8px solid #731818;">
              <h1 style="color: #731818; text-align: center; letter-spacing: 4px;">KONOZ BAG</h1>
              <p style="font-size: 16px; color: #333; line-height: 1.7;">${message}</p>
              <p style="font-size: 14px; color: #999; text-align: center; margin-top: 20px;">Order ID: ${escapeHTML(order.id)}</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to notify customer for deleted order:", emailError);
      }
    }

    await prisma.order.delete({ where: { id: orderId } });
    await revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return { success: false, error: error.message || "Failed to delete order." };
  }
}

export async function getConfirmedOrders(statusFilter?: string) {
  const where: any = { isConfirmed: true };
  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  return await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublicProducts() {
  // Ensure we bypass build-time cache
  unstable_noStore();
  try {
    return await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: true,
        colors: true
      }
    });
  } catch (error) {
    console.error("Critical: Failed to fetch products:", error);
    return [];
  }
}

