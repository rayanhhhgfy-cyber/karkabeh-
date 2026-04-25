"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getConfirmedOrders, deleteOrder } from "@/app/actions/orders";

export { getConfirmedOrders, deleteOrder };

export async function addProduct(
  nameEn: string, 
  nameAr: string, 
  price: number, 
  descriptionEn: string = "", 
  descriptionAr: string = "", 
  hasBadge: boolean = false,
  sizes: string = "S, M, L"
) {
  try {
    const product = await prisma.product.create({
      data: {
        nameEn,
        nameAr,
        price,
        descriptionEn,
        descriptionAr,
        hasBadge,
        sizes,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true, productId: product.id };
  } catch (error) {
    console.error("ADMIN_ACTION_ERROR (addProduct):", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to add product" };
  }
}

export async function addProductImage(productId: string, image: string) {
  try {
    if (image.length > 10 * 1024 * 1024) {
      return { success: false, error: "Image data too large." };
    }
    await prisma.productImage.create({
      data: { productId, image },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding product image:", error);
    return { success: false, error: "Failed to add product image" };
  }
}

export async function addProductColor(input: { productId: string, nameEn: string, nameAr: string, image?: string }) {
  try {
    const { productId, nameEn, nameAr, image } = input;
    await prisma.productColor.create({
      data: { productId, nameEn, nameAr, image },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("ADMIN_ACTION_ERROR (addProductColor):", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to add product color" };
  }
}

export async function updateProduct(
  id: string,
  data: {
    nameEn?: string;
    nameAr?: string;
    price?: number;
    descriptionEn?: string;
    descriptionAr?: string;
    hasBadge?: boolean;
    sizes?: string;
  }
) {
  try {
    // Ensure price is a float
    if (data.price !== undefined) {
      data.price = parseFloat(data.price as any);
    }
    
    await prisma.product.update({
      where: { id },
      data,
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("ADMIN_ACTION_ERROR (updateProduct):", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function deleteProductImage(id: string) {
  try {
    await prisma.productImage.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete image" };
  }
}

export async function deleteProductColor(id: string) {
  try {
    await prisma.productColor.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete color" };
  }
}

export async function getAdminProducts() {
  return await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      images: true,
      colors: true
    }
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

