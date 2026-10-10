import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cars, getCar } from "@/lib/cars";
import { carSubtitle, carTitle, formatPrice } from "@/lib/format";

// Routes set metadata only; the listing itself is drawn by <Experience /> in the root layout.
export const dynamicParams = false;

export function generateStaticParams() {
  return cars.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const car = getCar((await params).slug);
  if (!car) return {};
  return {
    title: carTitle(car),
    description: `${carTitle(car)}, ${carSubtitle(car)}. ${car.colors.paint.name} over ${car.colors.interior.name.toLowerCase()}, ${car.location}. ${formatPrice(car.priceUsd)}. A fictional listing in Arcade, a showroom for modern classics.`,
  };
}

export default async function CarPage({ params }: PageProps<"/cars/[slug]">) {
  if (!getCar((await params).slug)) notFound();
  return null;
}
