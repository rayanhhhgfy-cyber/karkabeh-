import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/app/actions/orders";

export async function POST(request: Request) {
  const body = await request.json();
  const orderId = String(body.orderId || "").trim();
  const status = String(body.status || "").trim();

  if (!orderId || !status) {
    return NextResponse.json({ success: false, error: "Missing order ID or status." }, { status: 400 });
  }

  const result = await updateOrderStatus(orderId, status);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || "Failed to update status." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
