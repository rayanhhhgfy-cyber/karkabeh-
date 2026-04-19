import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("Failed to load comments:", error);
    return NextResponse.json({ success: false, error: "Unable to load comments." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const authorName = String(body.authorName || "").trim();
    const message = String(body.message || "").trim();

    if (!productId || !authorName || !message) {
      return NextResponse.json({ success: false, error: "Product ID, name, and comment are required." }, { status: 400 });
    }

    await prisma.comment.create({
      data: {
        productId,
        authorName,
        message,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit comment:", error);
    return NextResponse.json({ success: false, error: "Unable to submit comment." }, { status: 500 });
  }
}
