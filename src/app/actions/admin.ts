"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getConfirmedOrders, deleteOrder } from "@/app/actions/orders";

export { getConfirmedOrders, deleteOrder };

export async function addProductImage(name: string, image: string, description: string = "", hasBadge: boolean = false, price: number = 0) {
  try {
    console.log("Adding product:", { name, imageLength: image.length, description, hasBadge, price });
    
    // Check if image data is unreasonably large (over 10MB base64)
    if (image.length > 10 * 1024 * 1024) {
      console.error("Image data too large:", image.length);
      return { success: false, error: "Image data too large. Please try a smaller image." };
    }
    
    await prisma.productImage.create({
      data: {
        name,
        image,
        description,
        hasBadge,
        price,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding product image:", error);
    // Return more specific error in development
    if (process.env.NODE_ENV === "development") {
      return { success: false, error: `Failed to add product image: ${error instanceof Error ? error.message : String(error)}` };
    }
    return { success: false, error: "Failed to add product image" };
  }
}

export async function deleteProductImage(id: string) {
  try {
    await prisma.productImage.delete({
      where: { id },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product image:", error);
    return { success: false, error: "Failed to delete product image" };
  }
}

export async function getAdminProducts() {
  return await prisma.productImage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminComments() {
  return await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
}

export async function deleteComment(id: string) {
  try {
    await prisma.comment.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Failed to delete comment." };
  }
}
