import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!orderId || !email) {
    return NextResponse.json({ success: false, error: "Missing order ID or email." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customerEmail: email,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      customerName: order.customerName,
      status: order.status,
      language: order.language,
      deliveryDateTime: order.deliveryDateTime,
      colorName: order.colorName,
      size: order.size,
      quantity: order.quantity,
      createdAt: order.createdAt,
      isConfirmed: order.isConfirmed,
    },
  });
}
