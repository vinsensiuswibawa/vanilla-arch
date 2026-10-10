// Section D's price data (docs/overhaul.md step 5): reads the committed `content/comparables.json` (built by
// `scripts/comparables.mjs`, never regenerated at runtime) and derives what the charts need. The verdict rule
// mirrors the generator's own `verdictFor` exactly, so the page and the script that checked the data agree.
import data from "@/content/comparables.json";
import { formatPrice } from "@/lib/format";

export interface Listing {
  marketplace: string;
  year: number;
  mileageMi: number;
  condition: string;
  location: string;
  priceUsd: number;
}
export interface HistoryPoint {
  quarter: string;
  medianUsd: number;
}
export interface Marketplace {
  id: string;
  name: string;
  kind: string;
}
interface ComparablesFile {
  marketplaces: Marketplace[];
  cars: Record<string, { listings: Listing[]; history: HistoryPoint[] }>;
}

const file = data as unknown as ComparablesFile;

export const marketplaces = file.marketplaces;
export const marketplaceName = (id: string) => marketplaces.find((m) => m.id === id)?.name ?? id;

export function getComparables(slug: string) {
  const entry = file.cars[slug];
  if (!entry) throw new Error(`comparables: no entry for "${slug}"`);
  return entry;
}

export type Verdict = "good" | "fair" | "above";
export const VERDICT_LABEL: Record<Verdict, string> = { good: "Good value", fair: "Fair price", above: "Above market" };

/** scripts/comparables.mjs's own rule, reused so the page and its generator's check agree: the share of
 * listings priced above (or below) the car decides the verdict. Words carry the meaning, never colour alone. */
export function verdictFor(price: number, prices: number[]): Verdict {
  const cheaper = prices.filter((p) => p > price).length / prices.length;
  const dearer = prices.filter((p) => p < price).length / prices.length;
  return cheaper >= 0.6 ? "good" : dearer >= 0.7 ? "above" : "fair";
}

/** The share of comparables priced above this car (what "cheaper than N%" reports). */
export const cheaperThanShare = (price: number, prices: number[]) => prices.filter((p) => p > price).length / prices.length;

/** Step 5's bucket rule, scaled to the car's own price tier. */
export const bucketStep = (price: number) => (price < 20_000 ? 500 : price > 200_000 ? 5_000 : 1_000);

export interface Bucket {
  mid: number;
  count: number;
  listings: Listing[];
}
/** Groups listings into fixed-width price steps, each dot's area (not radius) proportional to its count —
 * the area/count mapping lives in the chart component, next to the scale it draws with. */
export function priceBuckets(listings: Listing[], step: number): Bucket[] {
  const groups = new Map<number, Listing[]>();
  for (const l of listings) {
    const mid = Math.floor(l.priceUsd / step) * step + step / 2;
    const group = groups.get(mid);
    if (group) group.push(l);
    else groups.set(mid, [l]);
  }
  return Array.from(groups.entries())
    .map(([mid, ls]) => ({ mid, count: ls.length, listings: ls }))
    .sort((a, b) => a.mid - b.mid);
}

/** Ordinary least squares, mileage (x) to asking price (y), for the scatter's trend line. Guarded against the
 * degenerate case (fewer than two listings, or every listing at the same mileage) where the OLS denominator
 * is zero: a flat line through the mean price, rather than the NaN that would otherwise feed an invalid SVG
 * path `d` (found live-testing: one run of the strip/scatter linked-hover state produced `"M8,NaNL556,NaN"`). */
export function trendLine(listings: Listing[]): { slope: number; intercept: number } {
  const n = listings.length;
  const sx = listings.reduce((s, l) => s + l.mileageMi, 0);
  const sxx = listings.reduce((s, l) => s + l.mileageMi * l.mileageMi, 0);
  const denominator = n * sxx - sx * sx;
  if (n < 2 || denominator === 0) {
    const sy = listings.reduce((s, l) => s + l.priceUsd, 0);
    return { slope: 0, intercept: n ? sy / n : 0 };
  }
  const sy = listings.reduce((s, l) => s + l.priceUsd, 0);
  const sxy = listings.reduce((s, l) => s + l.mileageMi * l.priceUsd, 0);
  const slope = (n * sxy - sx * sy) / denominator;
  return { slope, intercept: (sy - slope * sx) / n };
}
export const trendAt = (trend: { slope: number; intercept: number }, mileageMi: number) => trend.slope * mileageMi + trend.intercept;

/** "Halden, Torquewell and Lot Twelve" from whichever marketplaces actually appear among these listings. */
export function marketplaceList(listings: Listing[]): string {
  const names = Array.from(new Set(listings.map((l) => l.marketplace))).map(marketplaceName);
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** The strip's one-line explanation (step 5): "Compared with 58 similar listings across Halden, Torquewell
 * and Lot Twelve." */
export const comparisonLine = (listings: Listing[]) => `Compared with ${listings.length} similar listings across ${marketplaceList(listings)}.`;

/** The strip's screen-reader summary (step 5's example): "This car is priced at $245,000, cheaper than 64%
 * of 58 comparable listings: good value." */
export function stripSummary(price: number, listings: Listing[]): string {
  const prices = listings.map((l) => l.priceUsd);
  const pct = Math.round(cheaperThanShare(price, prices) * 100);
  const verdict = verdictFor(price, prices);
  return `This car is priced at ${formatPrice(price)}, cheaper than ${pct}% of ${listings.length} comparable listings: ${VERDICT_LABEL[verdict].toLowerCase()}.`;
}

/** The mileage/price scatter's one-line takeaway (step 5's example): "$12,400 below the trend for its
 * mileage." */
export function mileageTakeaway(price: number, mileageMi: number, trend: { slope: number; intercept: number }): string {
  const expected = trendAt(trend, mileageMi);
  const diff = Math.round(Math.abs(price - expected));
  if (diff < 500) return "Priced right on the trend for its mileage.";
  return `${formatPrice(diff)} ${price < expected ? "below" : "above"} the trend for its mileage.`;
}

/** The asking-price history's one-line takeaway (step 5's example): "Asking prices for the 930 rose 18% in
 * five years." */
export function historyTakeaway(modelLabel: string, history: HistoryPoint[]): string {
  const first = history[0].medianUsd;
  const last = history.at(-1)!.medianUsd;
  const pct = Math.round((Math.abs(last - first) / first) * 100);
  if (pct < 2) return `Asking prices for the ${modelLabel} have held flat over five years.`;
  return `Asking prices for the ${modelLabel} ${last >= first ? "rose" : "fell"} ${pct}% in five years.`;
}
