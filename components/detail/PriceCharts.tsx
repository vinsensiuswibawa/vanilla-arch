"use client";

// Section D's price comparison (docs/overhaul.md step 5): the price strip, the mileage/price scatter with a
// trend line, and the asking-price history. Hand-built SVG with d3-scale and d3-shape only, per the plan and
// the `dataviz` skill; achromatic throughout — "this car" is always an ink ring or dashed ink line, never
// colour (the plan's own wording), and the verdict is always words. Hairlines are plain HTML divs so the
// existing M8 `ruleDraw` factory (built for the spec table's rule divs) works here unchanged; only the marks
// and paths that need real geometry are SVG. Entrance motion (M8 for the rules/axes, M1-timing for the marks)
// is wired from Detail.tsx via `prepareChartReveal`, which finds this file's `data-rule`/`data-mark` elements
// by attribute, the same way `wireSpecTable` already finds `data-spec-rule`/`data-spec-text`.
import { scaleLinear, scaleSqrt } from "d3-scale";
import { line as shapeLine } from "d3-shape";
import gsap from "gsap";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { CarWithAssets } from "@/lib/cars";
import {
  bucketStep,
  comparisonLine,
  getComparables,
  historyTakeaway,
  mileageTakeaway,
  priceBuckets,
  stripSummary,
  trendAt,
  trendLine,
  VERDICT_LABEL,
  verdictFor,
  type HistoryPoint,
  type Listing,
} from "@/lib/comparables";
import { formatMiles, formatPrice } from "@/lib/format";

/** The charts' internal coordinate width, matching `price-card`/`price-more`'s u width (lib/detail-layout.ts),
 * so an SVG's `viewBox` and an HTML overlay positioned by percentage agree on where "x" is. */
const W = 564;
const ease = "cubic-bezier(0.215, 0.61, 0.355, 1)"; // --ease-reveal

const pct = (x: number) => `${(x / W) * 100}%`;

/** M1-timing mark reveal (step 5: "its marks fade and rise in (M1 timing)"): opacity and a small rise, not
 * the line-mask `yPercent` M1 uses for text (marks have no mask to rise out from). */
function markRise(targets: gsap.TweenTarget, reduced: boolean) {
  if (reduced) return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "sine.out" });
  return gsap.fromTo(targets, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.9, ease, stagger: 0.08 });
}

/** The strip's own cadence (step 5): "dots grow from zero, left to right (scale 0 → 1, 0.6 s, reveal, stagger
 * 0.02 s)". SVG circles scale about their own centre via `transformBox: fill-box` (set in the JSX below). */
function dotGrow(targets: gsap.TweenTarget, reduced: boolean) {
  if (reduced) return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "sine.out" });
  return gsap.fromTo(targets, { scale: 0 }, { scale: 1, duration: 0.6, ease, stagger: 0.02 });
}

/** A hairline that draws with M8 (`data-rule`, consumed by `prepareChartReveal` below via `lib/detail-fx.ts`'s
 * `ruleDraw`): same shape as section C's spec-table rules, just standalone rather than a row's bottom border. */
function Rule({ top }: { top: number }) {
  return <div data-rule aria-hidden className="absolute left-0 h-px w-full origin-left" style={{ top, background: "color-mix(in srgb, var(--color-ink) 22%, transparent)" }} />;
}

function Caption({ children }: { children: React.ReactNode }) {
  // 70%, not 60%: measured contrast at 60% was 4.03:1 against the card background, under WCAG AA's 4.5:1
  // floor for normal-size text (found live-testing). 70% matches `.detail-label`'s own ratio, measured at 4.68:1.
  return (
    <p className="mt-2" style={{ fontSize: "max(10px, var(--type-label))", color: "color-mix(in srgb, var(--color-ink) 70%, transparent)" }}>
      {children}
    </p>
  );
}

function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <p data-mark className="detail-label" style={{ marginTop: 2 }}>
      <span style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-text)", fontSize: "max(13px, var(--type-body))", color: "var(--color-ink)" }}>{children}</span>
    </p>
  );
}

// ---- The price strip --------------------------------------------------------------------------------------

function PriceStrip({
  price,
  listings,
  hoverMid,
  setHoverMid,
}: {
  price: number;
  listings: Listing[];
  hoverMid: number | null;
  setHoverMid: (mid: number | null) => void;
}) {
  const step = bucketStep(price);
  const buckets = useMemo(() => priceBuckets(listings, step), [listings, step]);
  const prices = useMemo(() => listings.map((l) => l.priceUsd), [listings]);
  const verdict = verdictFor(price, prices);
  const domain = useMemo(() => {
    const all = [...prices, price];
    const span = Math.max(...all) - Math.min(...all);
    return [Math.min(...all) - span * 0.06, Math.max(...all) + span * 0.06];
  }, [prices, price]);
  const x = useMemo(() => scaleLinear().domain(domain).range([10, W - 10]), [domain]);
  const r = useMemo(() => scaleSqrt().domain([0, Math.max(...buckets.map((b) => b.count))]).range([3, 13]), [buckets]);
  const ticks = x.ticks(4);
  const [active, setActive] = useState(0);
  const refs = useRef<(SVGCircleElement | null)[]>([]);
  useEffect(() => {
    if (document.activeElement && refs.current.includes(document.activeElement as SVGCircleElement)) refs.current[active]?.focus();
  }, [active]);

  const move = (event: ReactKeyboardEvent<SVGCircleElement>, i: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(buckets.length - 1, i + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, i - 1));
    } else if (event.key === "Escape") {
      setHoverMid(null);
      (event.currentTarget as SVGCircleElement).blur();
    }
  };

  const hovered = buckets.find((b) => b.mid === hoverMid);
  const lineY = 46;

  return (
    <div className="relative" style={{ height: 96 }}>
      <Rule top={lineY} />
      <svg data-mark-group viewBox={`0 0 ${W} 72`} width="100%" height={72} style={{ display: "block", overflow: "visible" }} aria-hidden>
        {buckets.map((b, i) => (
          <circle
            key={b.mid}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-mark
            tabIndex={i === active ? 0 : -1}
            cx={x(b.mid)}
            cy={lineY}
            r={r(b.count)}
            fill="var(--color-ink)"
            opacity={hoverMid === null || hoverMid === b.mid ? 0.72 : 0.22}
            style={{ transformBox: "fill-box", transformOrigin: "center", outlineOffset: 3, cursor: "pointer" }}
            onFocus={() => {
              setActive(i);
              setHoverMid(b.mid);
            }}
            onMouseEnter={() => setHoverMid(b.mid)}
            onMouseLeave={() => setHoverMid(null)}
            onBlur={() => setHoverMid(null)}
            onKeyDown={(event) => move(event, i)}
            role="img"
            aria-label={`${formatPrice(b.mid - step / 2)} to ${formatPrice(b.mid + step / 2)}: ${b.count} listing${b.count === 1 ? "" : "s"}`}
          />
        ))}
        {/* "This car" is always an ink ring, never colour (step 5's own wording). */}
        <circle data-mark cx={x(price)} cy={lineY} r={9} fill="none" stroke="var(--color-ink)" strokeWidth={2} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
        {ticks.map((t) => (
          <line key={t} x1={x(t)} x2={x(t)} y1={lineY - 3} y2={lineY + 3} stroke="color-mix(in srgb, var(--color-ink) 35%, transparent)" strokeWidth={1} />
        ))}
      </svg>
      {ticks.map((t) => (
        // 70%, not 55%: same AA-contrast fix as `Caption` — small mono numerals need the same floor.
        <span key={t} className="absolute font-mono" style={{ left: pct(x(t)), top: 58, transform: "translateX(-50%)", fontSize: "max(9px, calc(10 * var(--u)))", color: "color-mix(in srgb, var(--color-ink) 70%, transparent)" }}>
          {formatPrice(t)}
        </span>
      ))}
      {/* The car's own label, above its ring. */}
      <div data-mark className="absolute text-center" style={{ left: pct(x(price)), top: 0, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
        <p className="font-mono" style={{ fontSize: "max(11px, calc(13 * var(--u)))" }}>{formatPrice(price)}</p>
        <p className="detail-label" style={{ letterSpacing: "var(--label-tracking)" }}>{VERDICT_LABEL[verdict]}</p>
      </div>
      {hovered && (
        <div
          role="status"
          className="absolute z-10 rounded px-3 py-2 text-left"
          style={{
            left: pct(x(hovered.mid)),
            top: 58 + 14,
            transform: `translateX(${x(hovered.mid) < W / 2 ? "0" : "-100%"})`,
            background: "var(--color-paper)",
            boxShadow: "0 2px 12px color-mix(in srgb, var(--color-ink) 18%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--color-ink) 16%, transparent)",
            fontSize: "max(11px, calc(12 * var(--u)))",
            lineHeight: 1.4,
            minWidth: 160,
          }}
        >
          <p className="font-mono">
            {formatPrice(hovered.mid - step / 2)} – {formatPrice(hovered.mid + step / 2)}
          </p>
          <p>
            {hovered.count} listing{hovered.count === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}

// ---- The price/mileage scatter -----------------------------------------------------------------------------

function PriceScatter({ price, mileageMi, listings }: { price: number; mileageMi: number; listings: Listing[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const refs = useRef<(SVGCircleElement | null)[]>([]);
  const trend = useMemo(() => trendLine(listings), [listings]);
  const H = 110;
  const xDomain = useMemo(() => [0, Math.max(mileageMi, ...listings.map((l) => l.mileageMi)) * 1.05], [listings, mileageMi]);
  const yDomain = useMemo(() => {
    const all = [price, ...listings.map((l) => l.priceUsd)];
    return [Math.min(...all) * 0.94, Math.max(...all) * 1.06];
  }, [listings, price]);
  const x = useMemo(() => scaleLinear().domain(xDomain).range([8, W - 8]), [xDomain]);
  const y = useMemo(() => scaleLinear().domain(yDomain).range([H - 6, 6]), [yDomain]);
  const trendPath = shapeLine<number>()
    .x((d) => x(d))
    .y((d) => y(trendAt(trend, d)))([xDomain[0], xDomain[1]]);

  const move = (event: ReactKeyboardEvent<SVGCircleElement>, i: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(listings.length - 1, i + 1));
      refs.current[Math.min(listings.length - 1, i + 1)]?.focus();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, i - 1));
      refs.current[Math.max(0, i - 1)]?.focus();
    } else if (event.key === "Escape") {
      setHoverIdx(null);
      (event.currentTarget as SVGCircleElement).blur();
    }
  };

  const hovered = hoverIdx !== null ? listings[hoverIdx] : null;

  return (
    <div className="relative" style={{ height: H + 18 }}>
      <Rule top={H} />
      <svg data-mark-group viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }} aria-hidden>
        {trendPath && <path data-mark d={trendPath} fill="none" stroke="color-mix(in srgb, var(--color-ink) 45%, transparent)" strokeWidth={1.5} strokeDasharray="4 4" />}
        {listings.map((l, i) => (
          <circle
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-mark
            tabIndex={i === active ? 0 : -1}
            cx={x(l.mileageMi)}
            cy={y(l.priceUsd)}
            r={3}
            fill="var(--color-ink)"
            opacity={0.45}
            style={{ transformBox: "fill-box", transformOrigin: "center", outlineOffset: 2, cursor: "pointer" }}
            onFocus={() => {
              setActive(i);
              setHoverIdx(i);
            }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onBlur={() => setHoverIdx(null)}
            onKeyDown={(event) => move(event, i)}
            role="img"
            aria-label={`${l.marketplace}, ${l.year}, ${formatMiles(l.mileageMi)}, ${formatPrice(l.priceUsd)}`}
          />
        ))}
        <circle data-mark cx={x(mileageMi)} cy={y(price)} r={8} fill="none" stroke="var(--color-ink)" strokeWidth={2} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      </svg>
      {hovered && (
        <div
          role="status"
          className="absolute z-10 rounded px-3 py-2 text-left"
          style={{
            left: pct(x(hovered.mileageMi)),
            top: y(hovered.priceUsd) - 8,
            transform: `translate(${x(hovered.mileageMi) < W / 2 ? "12px" : "calc(-100% - 12px)"}, -100%)`,
            background: "var(--color-paper)",
            boxShadow: "0 2px 12px color-mix(in srgb, var(--color-ink) 18%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--color-ink) 16%, transparent)",
            fontSize: "max(11px, calc(12 * var(--u)))",
            lineHeight: 1.4,
            minWidth: 150,
          }}
        >
          <p>{hovered.marketplace}</p>
          <p className="font-mono">
            {hovered.year} · {formatMiles(hovered.mileageMi)} · {formatPrice(hovered.priceUsd)}
          </p>
        </div>
      )}
    </div>
  );
}

// ---- The asking-price history ------------------------------------------------------------------------------

function PriceHistory({ price, history }: { price: number; history: HistoryPoint[] }) {
  const uid = useId();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [active, setActive] = useState(history.length - 1);
  const refs = useRef<(SVGCircleElement | null)[]>([]);
  const H = 90;
  const x = useMemo(() => scaleLinear().domain([0, history.length - 1]).range([8, W - 8]), [history.length]);
  const y = useMemo(() => {
    const values = [price, ...history.map((h) => h.medianUsd)];
    return scaleLinear().domain([Math.min(...values) * 0.96, Math.max(...values) * 1.04]).range([H - 6, 6]);
  }, [history, price]);
  const path = shapeLine<HistoryPoint>()
    .x((_, i) => x(i))
    .y((d) => y(d.medianUsd))(history);

  const move = (event: ReactKeyboardEvent<SVGCircleElement>, i: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(history.length - 1, i + 1));
      refs.current[Math.min(history.length - 1, i + 1)]?.focus();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, i - 1));
      refs.current[Math.max(0, i - 1)]?.focus();
    } else if (event.key === "Escape") {
      setHoverIdx(null);
      (event.currentTarget as SVGCircleElement).blur();
    }
  };

  const hovered = hoverIdx !== null ? history[hoverIdx] : null;

  return (
    <div className="relative" style={{ height: H + 4 }}>
      <Rule top={H} />
      {/* The line draws along its length via the clip geometry's own `scaleX` (step 5: "tied to scaleX of a
          clip, which is an allowed transform") — the clip rect scales, the path inside it never does, so the
          line reveals left to right without distorting. */}
      <svg data-mark-group viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }} aria-hidden>
        <clipPath id={`${uid}-clip`}>
          <rect data-rule x={0} y={0} width={W} height={H} style={{ transformBox: "fill-box", transformOrigin: "left" }} />
        </clipPath>
        <line x1={8} x2={W - 8} y1={y(price)} y2={y(price)} stroke="color-mix(in srgb, var(--color-ink) 50%, transparent)" strokeWidth={1.5} strokeDasharray="5 5" />
        <g clipPath={`url(#${uid}-clip)`}>{path && <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2} />}</g>
        {history.map((h, i) => (
          <circle
            key={h.quarter}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-mark
            tabIndex={i === active ? 0 : -1}
            cx={x(i)}
            cy={y(h.medianUsd)}
            r={i === history.length - 1 ? 4 : 2.5}
            fill="var(--color-ink)"
            style={{ transformBox: "fill-box", transformOrigin: "center", outlineOffset: 2, cursor: "pointer" }}
            onFocus={() => {
              setActive(i);
              setHoverIdx(i);
            }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            onBlur={() => setHoverIdx(null)}
            onKeyDown={(event) => move(event, i)}
            role="img"
            aria-label={`${h.quarter}: ${formatPrice(h.medianUsd)} median asking price`}
          />
        ))}
      </svg>
      {hovered && (
        <div
          role="status"
          className="absolute z-10 rounded px-3 py-2 text-left"
          style={{
            left: pct(x(history.indexOf(hovered))),
            top: y(hovered.medianUsd) - 8,
            transform: `translate(${x(history.indexOf(hovered)) < W / 2 ? "8px" : "calc(-100% - 8px)"}, -100%)`,
            background: "var(--color-paper)",
            boxShadow: "0 2px 12px color-mix(in srgb, var(--color-ink) 18%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--color-ink) 16%, transparent)",
            fontSize: "max(11px, calc(12 * var(--u)))",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
          }}
        >
          <p className="font-mono">
            {hovered.quarter} · {formatPrice(hovered.medianUsd)}
          </p>
        </div>
      )}
    </div>
  );
}

// ---- The visually hidden data table (shared by all three charts) -------------------------------------------

function DataTable({ price, listings, history }: { price: number; listings: Listing[]; history: HistoryPoint[] }) {
  return (
    <div className="sr-only">
      <table>
        <caption>Comparable listings</caption>
        <thead>
          <tr>
            <th scope="col">Marketplace</th>
            <th scope="col">Year</th>
            <th scope="col">Mileage</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">This car</th>
            <td colSpan={2} />
            <td>{formatPrice(price)}</td>
          </tr>
          {listings.map((l, i) => (
            <tr key={i}>
              <td>{l.marketplace}</td>
              <td>{l.year}</td>
              <td>{formatMiles(l.mileageMi)}</td>
              <td>{formatPrice(l.priceUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table>
        <caption>Asking-price history by quarter</caption>
        <thead>
          <tr>
            <th scope="col">Quarter</th>
            <th scope="col">Median asking price</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.quarter}>
              <td>{h.quarter}</td>
              <td>{formatPrice(h.medianUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- The section: header, strip, and the two further datasets ----------------------------------------------

/** The header and strip, section D's `price-card` block. */
export function PriceCard({ car, hoverMid, setHoverMid }: { car: CarWithAssets; hoverMid: number | null; setHoverMid: (mid: number | null) => void }) {
  const { listings, history } = getComparables(car.slug);
  return (
    <div data-price-card className="flex h-full flex-col">
      <p data-mark className="font-mono" style={{ fontSize: "var(--type-price)", lineHeight: 1 }}>
        {formatPrice(car.priceUsd)}
      </p>
      <p data-mark className="mt-2" style={{ fontSize: "max(12px, var(--type-label))", color: "color-mix(in srgb, var(--color-ink) 65%, transparent)" }}>
        {comparisonLine(listings)}
      </p>
      <div className="mt-4">
        <PriceStrip price={car.priceUsd} listings={listings} hoverMid={hoverMid} setHoverMid={setHoverMid} />
      </div>
      <Caption>Larger dots mean more listings at that price. Illustrative data.</Caption>
      <DataTable price={car.priceUsd} listings={listings} history={history} />
    </div>
  );
}

/** The two further datasets, section D's `price-more` block. */
export function PriceMore({ car, hoverMid, setHoverMid }: { car: CarWithAssets; hoverMid: number | null; setHoverMid: (mid: number | null) => void }) {
  const { listings, history } = getComparables(car.slug);
  // Not memoized: `listings` (committed JSON, ~40-80 rows) is cheap to re-fit on every render, and the React
  // Compiler can't prove the array from `getComparables` is stable across renders, so `useMemo` here only
  // produced a "memoization could not be preserved" build error for no real benefit.
  const trend = trendLine(listings);
  const step = bucketStep(car.priceUsd);
  // Links the strip and the scatter (step 5: "hovering a strip group highlights its listings here, and the
  // reverse"): a listing belongs to a strip bucket if its price falls in that bucket's step.
  const highlighted = hoverMid !== null ? listings.filter((l) => Math.abs(l.priceUsd - hoverMid) <= step / 2) : listings;
  return (
    <div data-price-more className="flex h-full flex-col justify-between">
      <section aria-label="Price and mileage">
        <p data-mark className="detail-label">
          Price and mileage
        </p>
        <Takeaway>{mileageTakeaway(car.priceUsd, car.mileageMi, trend)}</Takeaway>
        <div className="mt-3" onMouseLeave={() => setHoverMid(null)}>
          <PriceScatter price={car.priceUsd} mileageMi={car.mileageMi} listings={highlighted.length ? highlighted : listings} />
        </div>
        <Caption>Illustrative data; a straight trend line fit to the comparables above.</Caption>
      </section>
      <section aria-label="Asking-price history" className="mt-6">
        <p data-mark className="detail-label">
          Asking-price history
        </p>
        <Takeaway>{historyTakeaway(car.chassis, history)}</Takeaway>
        <div className="mt-3">
          <PriceHistory price={car.priceUsd} history={history} />
        </div>
        <Caption>Median of {listings.length} comparable listings&rsquo; asking price by quarter. Illustrative data.</Caption>
      </section>
      <span className="sr-only">{stripSummary(car.priceUsd, listings)}</span>
    </div>
  );
}

/** Finds this file's `data-rule`/`data-mark` elements inside `container` and sets their hidden starting
 * state, returning the play callback — the same shape `wireSpecTable` uses in Detail.tsx, so the caller's
 * `revealOnce` (M8's and M1's shared trigger plumbing) needs no special case for charts. */
export function prepareChartReveal(container: HTMLElement, reduced: boolean): () => void {
  const rules = Array.from(container.querySelectorAll<HTMLElement | SVGElement>("[data-rule]"));
  const marks = Array.from(container.querySelectorAll<HTMLElement | SVGElement>("[data-mark]"));
  const dots = Array.from(container.querySelectorAll<SVGCircleElement>("svg[data-mark-group] circle[data-mark]"));
  const nonDotMarks = marks.filter((m) => !(m instanceof SVGCircleElement));
  if (reduced) {
    gsap.set([...rules, ...marks], { opacity: 0 });
  } else {
    gsap.set(rules, { scaleX: 0 });
    gsap.set(dots, { scale: 0 });
    gsap.set(nonDotMarks, { opacity: 0, y: 6 });
  }
  return () => {
    if (reduced) {
      // `clearProps` on completion: the strip's dots carry their own React-driven opacity (the linked-hover
      // dim), set as an SVG attribute. GSAP's fade would otherwise leave an inline `style.opacity: 1` behind,
      // which outranks that attribute in the cascade and would silently defeat the hover dim forever after.
      gsap.to([...rules, ...marks], { opacity: 1, duration: 0.3, ease: "sine.out", clearProps: "opacity" });
      return;
    }
    gsap.fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease, stagger: 0.06, transformOrigin: "left" });
    if (dots.length) dotGrow(dots, reduced);
    if (nonDotMarks.length) markRise(nonDotMarks, reduced);
  };
}
