import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Studio } from "@/components/studio/Studio";
import { getCar } from "@/lib/cars";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Dev-only asset QA and the source of the stills (scripts/stills.mjs). Production builds
// return 404 unless ARCADE_STUDIO=1 is set.
export default async function StudioPage({ params, searchParams }: PageProps<"/studio/[slug]">) {
  if (process.env.NODE_ENV === "production" && process.env.ARCADE_STUDIO !== "1") notFound();
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) notFound();
  const { still } = await searchParams;
  return <Studio car={car} still={still === "og"} />;
}
