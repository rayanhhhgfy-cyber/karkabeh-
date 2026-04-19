"use server";

import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

export async function seedProducts() {
  try {
    // Check if products already exist to avoid duplicates
    const count = await prisma.productImage.count();
    if (count > 0) return { success: true, message: "Products already seeded" };

    const assetsPath = path.join(process.cwd(), "public", "assets");
    
    const seedData = [
      {
        name: "Royal Maroon",
        description: "The signature Konoz aesthetic. Deep maroon Italian leather with hand-stitched gold accents. A timeless statement of elegance.",
        fileName: "bag-maroon.png",
        hasBadge: true,
        price: 850
      },
      {
        name: "Imperial Gold",
        description: "A radiant masterpiece. Sunkissed gold leather that captures the light, perfect for high-profile evenings and luxury galas.",
        fileName: "bag-gold.png",
        hasBadge: false,
        price: 920
      },
      {
        name: "Emerald Palace",
        description: "Deep, mysterious, and sophisticated. The Emerald Palace variant features a unique textured finish that feels as rich as it looks.",
        fileName: "bag-emerald.png",
        hasBadge: false,
        price: 780
      }
    ];

    for (const item of seedData) {
      const filePath = path.join(assetsPath, item.fileName);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Image = `data:image/png;base64,${fileBuffer.toString("base64")}`;

        await prisma.productImage.create({
          data: {
            name: item.name,
            description: item.description,
            image: base64Image,
            hasBadge: item.hasBadge,
            price: item.price || 0,
          }
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Successfully seeded luxury collection" };
  } catch (error) {
    console.error("Seeding error:", error);
    return { success: false, error: "Failed to seed products" };
  }
}
