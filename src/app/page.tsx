import { getPublicProducts } from "@/app/actions/orders";
import HomeClient from "@/components/HomeClient";

export default async function HomePage() {
  const products = await getPublicProducts();

  return <HomeClient products={products} />;
}

