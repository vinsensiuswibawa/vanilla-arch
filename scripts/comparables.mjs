// Generates content/comparables.json: the fictional comparable listings and price history behind the
// detail page's price charts (docs/overhaul.md, step 5, section D). Deterministic: every random draw is
// seeded by the car's slug, so regenerating gives the same numbers, and the file is committed.
//
//   node scripts/comparables.mjs           generate, then check
//   node scripts/comparables.mjs --check   check the committed file only
//
// Prices, years and mileage of the cars themselves are read from lib/cars.ts, so the charts stay in step
// with the listings. Everything about the comparables is invented; the charts say so in their captions.
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "content/comparables.json";
const QUARTERS = 20; // 2021-Q4 to 2026-Q3
const FIRST_QUARTER = { year: 2021, q: 4 };

// Three fictional marketplaces (a web search on 2026-10-08 found no car business under any of the names).
const MARKETPLACES = [
  { id: "halden", name: "Halden", kind: "Classifieds", share: 0.4, priceFactor: 1 },
  { id: "torquewell", name: "Torquewell", kind: "Dealer marketplace", share: 0.35, priceFactor: 1.03 },
  { id: "lot-twelve", name: "Lot Twelve", kind: "Online auction", share: 0.25, priceFactor: 0.96 },
];

const LOCATIONS = [
  "Portland, OR", "Austin, TX", "Scottsdale, AZ", "Charlotte, NC", "Denver, CO", "Sacramento, CA",
  "Boston, MA", "Atlanta, GA", "Utrecht, NL", "Hamburg, DE", "Lyon, FR", "Milan, IT", "Bristol, UK",
  "Surrey, UK", "Toronto, CA", "Brisbane, AU",
];

// Per car: the model years the comparables span, the verdict the car should land on (about five good
// value, five fair, three above market, spread across the lineup), and the yearly drift of the asking
// price (mostly rising, a couple flat).
const PLAN = {
  "datsun-240k-gt": { years: [1973, 1977], verdict: "good", annual: 0.08 },
  "triumph-tr6": { years: [1969, 1976], verdict: "good", annual: 0.03 },
  "porsche-930": { years: [1975, 1989], verdict: "above", annual: 0.06 },
  "peugeot-205-cj": { years: [1986, 1994], verdict: "good", annual: 0.05 },
  "honda-nsx-na1": { years: [1991, 1997], verdict: "fair", annual: 0.07 },
  "jaguar-xj220": { years: [1992, 1994], verdict: "above", annual: 0.04 },
  "honda-integra-type-r-db8": { years: [1996, 2001], verdict: "above", annual: 0.09 },
  "lotus-elise": { years: [1996, 2001], verdict: "fair", annual: 0.04 },
  "fiat-barchetta": { years: [1995, 2005], verdict: "good", annual: 0.06 },
  "subaru-wrx-wagon-gg": { years: [2001, 2005], verdict: "fair", annual: 0.07 },
  "bmw-m5-e39": { years: [1998, 2003], verdict: "fair", annual: 0.05 },
  "lamborghini-gallardo": { years: [2008, 2013], verdict: "fair", annual: 0.005 },
  "mazda-mx-5-nc": { years: [2005, 2015], verdict: "good", annual: -0.005 },
};

// Where the car should sit among its comparables: the share of listings priced above it.
const TARGET_ABOVE = { good: [0.66, 0.82], fair: [0.4, 0.56], above: [0.78, 0.9] }; // "above" is the share priced BELOW
const GRADES = ["2.5", "3", "3.5", "4", "4.5", "5"];

// ---- Seeded randomness -------------------------------------------------------------------------------
function seeded(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (rand) => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const between = (rand, [lo, hi]) => lo + (hi - lo) * rand();

// ---- The cars' own numbers, from lib/cars.ts ---------------------------------------------------------
function readCars() {
  const src = readFileSync("lib/cars.ts", "utf8");
  const listings = src.slice(src.indexOf("const listings"), src.indexOf("const detailCopy"));
  const heads = [...listings.matchAll(/^  "([a-z0-9-]+)": \{$/gm)];
  const num = (s) => Number(s.replaceAll("_", ""));
  return Object.fromEntries(
    heads.map((m, i) => {
      const block = listings.slice(m.index, heads[i + 1]?.index ?? listings.length);
      const pick = (re) => {
        const hit = re.exec(block);
        if (!hit) throw new Error(`${m[1]}: ${re} not found in lib/cars.ts`);
        return num(hit[1]);
      };
      return [m[1], { year: pick(/^    year: ([\d_]+),/m), priceUsd: pick(/^    priceUsd: ([\d_]+),/m), mileageMi: pick(/^    mileageMi: ([\d_]+),/m) }];
    }),
  );
}

const step = (price) => (price >= 100_000 ? 500 : 100);
const roundTo = (price) => Math.round(price / step(price)) * step(price);
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

// The rule the strip uses (docs/overhaul.md, step 5): words, never colour alone.
function verdictFor(price, prices) {
  const cheaper = prices.filter((p) => p > price).length / prices.length; // listings priced above the car
  const dearer = prices.filter((p) => p < price).length / prices.length;
  return cheaper >= 0.6 ? "good" : dearer >= 0.7 ? "above" : "fair";
}

function build(slug, car, plan) {
  const rand = seeded(slug);
  const n = 40 + Math.floor(rand() * 41);
  const [y0, y1] = plan.years;
  const midYear = (y0 + y1) / 2;

  // Unscaled listings: price falls with mileage, rises a little with newer years, and varies by marketplace.
  const raw = Array.from({ length: n }, () => {
    const pick = rand();
    const marketplace = MARKETPLACES.find((_, i) => pick < MARKETPLACES.slice(0, i + 1).reduce((s, m) => s + m.share, 0)) ?? MARKETPLACES[0];
    const ratio = Math.exp(normal(rand) * 0.5); // mileage relative to this car's
    const year = Math.min(y1, Math.max(y0, Math.round(midYear + normal(rand) * ((y1 - y0) / 3))));
    const mileageMi = Math.max(400, Math.round((car.mileageMi * ratio) / 100) * 100);
    const price = (1 - 0.1 * Math.log(ratio)) * (1 + (year - midYear) * 0.008) * marketplace.priceFactor * Math.exp(normal(rand) * 0.05);
    const grade = GRADES[Math.min(GRADES.length - 1, Math.max(0, Math.round(3 - Math.log(ratio) * 2 + normal(rand) * 0.7)))];
    return { marketplace: marketplace.id, year, mileageMi, condition: grade, location: LOCATIONS[Math.floor(rand() * LOCATIONS.length)], price };
  });

  // Scale the whole set so this car lands where its plan says: k listings above it (or below, for "above").
  const sorted = raw.map((l) => l.price).sort((a, b) => a - b);
  const share = between(rand, TARGET_ABOVE[plan.verdict]);
  const k = Math.round(n * share); // listings on the far side of the car
  const idx = plan.verdict === "above" ? k : n - k; // first index of the listings priced above the car
  const mid = (sorted[idx - 1] + sorted[idx]) / 2;
  const scale = car.priceUsd / mid;
  const listings = raw.map(({ price, ...l }) => {
    let priceUsd = roundTo(price * scale);
    if (priceUsd === car.priceUsd) priceUsd += price * scale > car.priceUsd ? step(priceUsd) : -step(priceUsd); // no ties with the car
    return { ...l, priceUsd };
  });

  // Quarterly medians: the last one is today's median of these listings; earlier ones follow the car's drift.
  const last = roundTo(median(listings.map((l) => l.priceUsd)));
  const history = Array.from({ length: QUARTERS }, (_, i) => {
    const back = QUARTERS - 1 - i;
    const noise = back === 0 ? 0 : normal(rand) * 0.012;
    const total = FIRST_QUARTER.q - 1 + i;
    return { quarter: `${FIRST_QUARTER.year + Math.floor(total / 4)}-Q${(total % 4) + 1}`, medianUsd: roundTo((last / (1 + plan.annual) ** (back / 4)) * (1 + noise)) };
  });
  return { listings, history };
}

function generate() {
  const cars = readCars();
  const out = { marketplaces: MARKETPLACES.map(({ id, name, kind }) => ({ id, name, kind })), cars: {} };
  for (const slug of Object.keys(PLAN)) {
    if (!cars[slug]) throw new Error(`${slug} is not in lib/cars.ts`);
    out.cars[slug] = build(slug, cars[slug], PLAN[slug]);
  }
  // JSON from node: no BOM.
  writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
}

function check() {
  const data = JSON.parse(readFileSync(OUT, "utf8"));
  const cars = readCars();
  const slugs = Object.keys(cars);
  const errors = [];
  const marketIds = new Set(data.marketplaces.map((m) => m.id));
  const tally = { good: 0, fair: 0, above: 0 };
  const rows = [];
  if (Object.keys(data.cars).length !== 13) errors.push(`expected 13 cars, found ${Object.keys(data.cars).length}`);
  for (const slug of slugs) {
    const entry = data.cars[slug];
    if (!entry) { errors.push(`${slug}: missing`); continue; }
    const { listings, history } = entry;
    const price = cars[slug].priceUsd;
    if (listings.length < 40 || listings.length > 80) errors.push(`${slug}: ${listings.length} listings, expected 40 to 80`);
    if (history.length !== QUARTERS) errors.push(`${slug}: ${history.length} history points, expected ${QUARTERS}`);
    for (const l of listings) {
      if (!marketIds.has(l.marketplace) || !Number.isInteger(l.year) || !(l.mileageMi > 0) || !(l.priceUsd > 0) || !l.location || !l.condition)
        errors.push(`${slug}: malformed listing ${JSON.stringify(l)}`);
      if (l.priceUsd === price) errors.push(`${slug}: a listing ties with the car's price`);
    }
    const prices = listings.map((l) => l.priceUsd);
    const verdict = verdictFor(price, prices);
    tally[verdict]++;
    if (verdict !== PLAN[slug].verdict) errors.push(`${slug}: verdict ${verdict}, planned ${PLAN[slug].verdict}`);
    const med = median(prices);
    if (Math.abs(history.at(-1).medianUsd - med) / med > 0.01) errors.push(`${slug}: last history point is not the listings' median`);
    const cheaperThan = Math.round((prices.filter((p) => p > price).length / prices.length) * 100);
    rows.push({ slug, listings: listings.length, price, cheaperThanPct: cheaperThan, verdict, lowRatio: +(Math.min(...prices) / price).toFixed(2), highRatio: +(Math.max(...prices) / price).toFixed(2), medianNow: history.at(-1).medianUsd, medianStart: history[0].medianUsd });
  }
  console.table(rows);
  console.log("verdict mix:", tally);
  if (tally.good !== 5 || tally.fair !== 5 || tally.above !== 3) errors.push(`verdict mix ${JSON.stringify(tally)}, expected 5 good, 5 fair, 3 above`);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("comparables.json: OK");
}

if (!process.argv.includes("--check")) generate();
check();
