"use client";

// Section D's price comparison (docs/overhaul.md step 5, rebuilt in shot 7a): one beige card holding the price,
// the comparison line and three tabs, one chart per tab: the price spread (strip), price vs mileage (scatter)
// and price history (line). Hand-built SVG with d3-scale and d3-shape only, per the plan and the `dataviz`
// skill; achromatic throughout: "this car" is always an ink ring or dashed ink line, never colour, and the
// verdict is always words. Charts draw in real CSS pixels: `useChartSize` measures the chart box and every
// range, tick and overlay below is in those pixels, so nothing scales a drawing after the fact (6h: the old
// viewBox scaling letterboxed against its HTML ticks). Hairlines are plain HTML divs so the existing M8
// `ruleDraw` factory works here unchanged; only marks and paths that need real geometry are SVG. Entrance
// motion is wired from Detail.tsx via `prepareChartReveal`, which finds this file's `data-rule`/`data-mark`
// elements by attribute, the same way `wireSpecTable` finds `data-spec-rule`/`data-spec-text`.
import { scaleLinear, scaleSqrt } from "d3-scale";
import { line as shapeLine } from "d3-shape";
import gsap from "gsap";
import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { CarWithAssets } from "@/lib/cars";
import {
  bucketStep,
  comparisonLine,
  getComparables,
  historyTakeaway,
  marketplaceName,
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

const ease = "cubic-bezier(0.215, 0.61, 0.355, 1)"; // --ease-reveal
const u = (n: number) => `calc(${n} * var(--u))`;
const ink = (pct: number) => `color-mix(in srgb, var(--color-ink) ${pct}%, transparent)`;
const TICK_FONT = "max(11px, calc(11 * var(--u)))";

/** The chart box's size in CSS px. Measured synchronously on mount (so the first commit after it already has
 * marks) and then on every resize. */
function useChartSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize((prev) => (prev.width === el.clientWidth && prev.height === el.clientHeight ? prev : { width: el.clientWidth, height: el.clientHeight }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

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

/** A hairline that draws with M8 (`data-rule`, consumed by `prepareChartReveal` below via the same pattern as
 * section C's spec-table rules). Positioned in px inside the nearest positioned ancestor. */
function Rule({ top, left = 0, width, strength = 22 }: { top?: number; left?: number; width?: number | string; strength?: number }) {
  return <div data-rule aria-hidden className="absolute h-px origin-left" style={{ top, left, width: width ?? "100%", background: ink(strength) }} />;
}

function Caption({ children }: { children: ReactNode }) {
  // 70%, not 60%: measured contrast at 60% was 4.03:1 against the card background, under WCAG AA's 4.5:1
  // floor for normal-size text (found live-testing). 70% matches `.detail-label`'s own ratio.
  return (
    <p style={{ marginTop: u(12), fontSize: "max(10px, var(--type-label))", color: ink(70) }}>{children}</p>
  );
}

function Takeaway({ children }: { children: ReactNode }) {
  return (
    <p data-mark className="detail-label">
      <span style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-text)", fontSize: "max(13px, var(--type-body))", color: "var(--color-ink)" }}>{children}</span>
    </p>
  );
}

/** A tick label as an HTML box positioned in chart px. Carries no CSS transform, so the reveal's `y` rise
 * (a GSAP transform) never fights a centring `translate`. */
function TickLabel({ x, y, w = 60, h = 14, align = "center", children }: { x: number; y: number; w?: number; h?: number; align?: "center" | "left" | "right"; children: ReactNode }) {
  const justify = align === "center" ? "center" : align === "left" ? "flex-start" : "flex-end";
  return (
    <div data-mark aria-hidden className="absolute flex items-center font-mono" style={{ left: x, top: y, width: w, height: h, justifyContent: justify, whiteSpace: "nowrap", fontSize: TICK_FONT, lineHeight: 1, color: ink(70) }}>
      {children}
    </div>
  );
}

/** One chart's tooltip: HTML, flipped to the other side of the target past the plot's midpoint. */
function Tip({ x, y, width, mid, center, children }: { x: number; y: number; width: number; mid: number; center?: boolean; children: ReactNode }) {
  const flip = x > mid;
  const style: CSSProperties = {
    top: y,
    ...(flip ? { right: width - x + 12 } : { left: x + 12 }),
    transform: center ? "translateY(-50%)" : undefined,
    background: "var(--color-paper)",
    boxShadow: `0 2px 12px ${ink(18)}, inset 0 0 0 1px ${ink(16)}`,
    fontSize: "max(11px, calc(12 * var(--u)))",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  };
  return (
    <div aria-hidden className="absolute z-10 rounded px-3 py-2 text-left" style={style}>
      {children}
    </div>
  );
}

/** The hover/focus/roving state every chart shares: one Tab stop per chart, arrows move, Escape leaves the
 * chart (not the page: it would otherwise bubble to Experience.tsx's window listener, 6h). */
function useMarks(count: number, initial: number) {
  const [active, setActive] = useState(Math.min(initial, count - 1));
  const [hover, setHover] = useState<number | null>(null);
  const refs = useRef<(SVGCircleElement | null)[]>([]);
  const go = (to: number) => {
    const next = Math.max(0, Math.min(count - 1, to));
    setActive(next);
    refs.current[next]?.focus();
  };
  const onKeyDown = (event: ReactKeyboardEvent<SVGCircleElement>, i: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      go(i + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      go(i - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(count - 1);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      setHover(null);
      event.currentTarget.blur();
    }
  };
  const bind = (i: number, label: string) => ({
    ref: (el: SVGCircleElement | null) => {
      refs.current[i] = el;
    },
    tabIndex: i === Math.min(active, count - 1) ? 0 : -1,
    role: "img" as const,
    "aria-label": label,
    onFocus: () => {
      setActive(i);
      setHover(i);
    },
    onBlur: () => setHover(null),
    onKeyDown: (event: ReactKeyboardEvent<SVGCircleElement>) => onKeyDown(event, i),
  });
  return { hover, setHover, bind };
}

/** The pointer position inside an SVG's own box, from a pointer event on one of its children. */
function localPoint(event: ReactPointerEvent<SVGRectElement>) {
  const box = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const m = sorted.length >> 1;
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
};

// ---- Tab 1: the price spread (strip) ------------------------------------------------------------------------

function PriceStrip({ price, listings, width, height }: { price: number; listings: Listing[]; width: number; height: number }) {
  const step = bucketStep(price);
  const buckets = useMemo(() => priceBuckets(listings, step), [listings, step]);
  const prices = useMemo(() => listings.map((l) => l.priceUsd), [listings]);
  const verdict = verdictFor(price, prices);
  const domain = useMemo(() => {
    const all = [...prices, price];
    const span = Math.max(...all) - Math.min(...all);
    return [Math.min(...all) - span * 0.06, Math.max(...all) + span * 0.06];
  }, [prices, price]);
  const x = useMemo(() => scaleLinear().domain(domain).range([0, width]), [domain, width]);
  const rMin = 0.012 * width;
  const rMax = 0.04 * width;
  const r = useMemo(() => scaleSqrt().domain([0, Math.max(...buckets.map((b) => b.count))]).range([rMin, rMax]), [buckets, rMin, rMax]);
  const baseline = 0.42 * height;
  const ticks = x.ticks(5);
  const { hover, setHover, bind } = useMarks(buckets.length, 0);
  const hovered = hover !== null ? buckets[hover] : null;
  const tipText = hovered ? `${formatPrice(hovered.mid - step / 2)} to ${formatPrice(hovered.mid + step / 2)}: ${hovered.count} listing${hovered.count === 1 ? "" : "s"}` : "";

  // The car's label, bottom-anchored above the biggest possible dot and clamped inside the box.
  const labelRef = useRef<HTMLDivElement>(null);
  const [labelW, setLabelW] = useState(0);
  useLayoutEffect(() => {
    if (labelRef.current) setLabelW(labelRef.current.offsetWidth);
  }, [price, width]);
  const labelLeft = Math.max(0, Math.min(width - labelW, x(price) - labelW / 2));

  const hitHeight = Math.min(height, baseline + rMax + 12 + 28);
  const onMove = (event: ReactPointerEvent<SVGRectElement>) => {
    const { x: px } = localPoint(event);
    let best = 0;
    for (let i = 1; i < buckets.length; i++) if (Math.abs(x(buckets[i].mid) - px) < Math.abs(x(buckets[best].mid) - px)) best = i;
    const dx = px - x(buckets[best].mid);
    const neighbour = buckets[best + (dx < 0 ? -1 : 1)];
    const limit = Math.max(24, neighbour ? Math.abs(x(neighbour.mid) - x(buckets[best].mid)) / 2 : 0);
    setHover(Math.abs(dx) <= limit ? best : null);
  };

  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const stats: [string, string][] = [
    ["Lowest", formatPrice(lowest)],
    ["Median", formatPrice(median(prices))],
    ["Highest", formatPrice(highest)],
    ["Listings", String(listings.length)],
  ];

  return (
    <>
      <Rule top={baseline} />
      {/* A labelled group, not aria-hidden (6h): the dots inside are focusable, and focusable content under
          aria-hidden is announced as nothing. */}
      <svg data-mark-group width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" style={{ overflow: "visible" }} role="group" aria-label="Comparable listings by price; arrow keys move between price groups">
        {buckets.map((b, i) => (
          <circle
            key={b.mid}
            data-mark
            cx={x(b.mid)}
            cy={baseline}
            r={r(b.count)}
            fill="var(--color-ink)"
            opacity={hover === null || hover === i ? 0.72 : 0.22}
            style={{ transformBox: "fill-box", transformOrigin: "center", outlineOffset: 3, pointerEvents: "none" }}
            {...bind(i, `${formatPrice(b.mid - step / 2)} to ${formatPrice(b.mid + step / 2)}: ${b.count} listing${b.count === 1 ? "" : "s"}`)}
          />
        ))}
        {/* "This car" is always an ink ring, never colour (step 5's own wording). */}
        <circle data-mark cx={x(price)} cy={baseline} r={0.024 * width + 2} fill="none" stroke="var(--color-ink)" strokeWidth={2} style={{ transformBox: "fill-box", transformOrigin: "center", pointerEvents: "none" }} />
        <rect x={0} y={0} width={width} height={hitHeight} fill="transparent" style={{ pointerEvents: "all" }} onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {ticks.map((t) => (
        <TickLabel key={t} x={x(t) - 30} y={baseline + rMax + 12}>
          {formatPrice(t)}
        </TickLabel>
      ))}
      <div ref={labelRef} data-mark className="absolute text-center" style={{ left: labelLeft, bottom: height - (baseline - rMax - 8), whiteSpace: "nowrap" }}>
        <p className="font-mono" style={{ fontSize: "max(11px, calc(13 * var(--u)))" }}>{formatPrice(price)}</p>
        <p className="detail-label" style={{ letterSpacing: "var(--label-tracking)" }}>{VERDICT_LABEL[verdict]}</p>
      </div>
      <div className="absolute bottom-0 left-0 w-full">
        <Rule top={0} />
        <dl className="grid grid-cols-4" style={{ paddingTop: 16 }}>
          {stats.map(([label, value]) => (
            <div key={label} data-mark>
              <dt className="detail-label">{label}</dt>
              <dd className="font-mono" style={{ fontSize: "max(15px, calc(20 * var(--u)))", whiteSpace: "nowrap" }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {hovered && (
        <Tip x={x(hovered.mid)} y={baseline + rMax + 12 + 22} width={width} mid={width / 2}>
          <p className="font-mono">
            {formatPrice(hovered.mid - step / 2)} – {formatPrice(hovered.mid + step / 2)}
          </p>
          <p>
            {hovered.count} listing{hovered.count === 1 ? "" : "s"}
          </p>
        </Tip>
      )}
      <div aria-live="polite" className="sr-only">
        {tipText}
      </div>
    </>
  );
}

// ---- Tab 2: price vs mileage (scatter) ----------------------------------------------------------------------

const MARGIN = { top: 8, right: 8, bottom: 36, left: 56 };

function PriceScatter({ price, mileageMi, listings, width, height }: { price: number; mileageMi: number; listings: Listing[]; width: number; height: number }) {
  const trend = useMemo(() => trendLine(listings), [listings]);
  const xDomain = useMemo(() => [0, Math.max(mileageMi, ...listings.map((l) => l.mileageMi)) * 1.05], [listings, mileageMi]);
  const yDomain = useMemo(() => {
    const all = [price, ...listings.map((l) => l.priceUsd)];
    return [Math.min(...all) * 0.94, Math.max(...all) * 1.06];
  }, [listings, price]);
  const left = MARGIN.left;
  const right = width - MARGIN.right;
  const top = MARGIN.top;
  const bottom = height - MARGIN.bottom;
  const x = useMemo(() => scaleLinear().domain(xDomain).range([left, right]), [xDomain, left, right]);
  const y = useMemo(() => scaleLinear().domain(yDomain).range([bottom, top]), [yDomain, bottom, top]);
  const xTicks = x.ticks(4);
  const yTicks = y.ticks(4);
  const trendPath = shapeLine<number>()
    .x((d) => x(d))
    .y((d) => y(trendAt(trend, d)))([xDomain[0], xDomain[1]]);
  const { hover, setHover, bind } = useMarks(listings.length, 0);
  const hovered = hover !== null ? listings[hover] : null;
  const labelOf = (l: Listing) => `${marketplaceName(l.marketplace)}, ${l.year}, ${formatMiles(l.mileageMi)}, ${formatPrice(l.priceUsd)}`;

  const onMove = (event: ReactPointerEvent<SVGRectElement>) => {
    const p = localPoint(event);
    let best = -1;
    let bestD = 40;
    listings.forEach((l, i) => {
      const d = Math.hypot(x(l.mileageMi) - p.x, y(l.priceUsd) - p.y);
      if (d <= bestD) {
        best = i;
        bestD = d;
      }
    });
    setHover(best < 0 ? null : best);
  };

  return (
    <>
      {yTicks.map((t) => (
        <Rule key={t} top={y(t)} left={left} width={right - left} strength={12} />
      ))}
      <svg data-mark-group width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" style={{ overflow: "visible" }} role="group" aria-label="Comparable listings by mileage and price; arrow keys move between listings">
        {trendPath && <path data-mark d={trendPath} fill="none" stroke={ink(45)} strokeWidth={1.5} strokeDasharray="4 4" style={{ pointerEvents: "none" }} />}
        {listings.map((l, i) => (
          <circle
            key={i}
            data-mark
            cx={x(l.mileageMi)}
            cy={y(l.priceUsd)}
            r={hover === i ? 6 : 4}
            fill="var(--color-ink)"
            opacity={hover === i ? 1 : 0.55}
            style={{ transformBox: "fill-box", transformOrigin: "center", outlineOffset: 2, pointerEvents: "none" }}
            {...bind(i, labelOf(l))}
          />
        ))}
        <circle data-mark cx={x(mileageMi)} cy={y(price)} r={9} fill="none" stroke="var(--color-ink)" strokeWidth={2} style={{ transformBox: "fill-box", transformOrigin: "center", pointerEvents: "none" }} />
        <rect x={left} y={top} width={right - left} height={bottom - top} fill="transparent" style={{ pointerEvents: "all" }} onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {yTicks.map((t) => (
        <TickLabel key={t} x={0} y={y(t) - 7} w={left - 8} align="right">
          ${Math.round(t / 1000)}k
        </TickLabel>
      ))}
      {xTicks.map((t) => (
        <TickLabel key={t} x={x(t) - 30} y={bottom + 4}>
          {Math.round(t / 1000)}k mi
        </TickLabel>
      ))}
      <p data-mark className="detail-label absolute" style={{ left: 0, top: 0, whiteSpace: "nowrap", lineHeight: 1 }}>
        Asking price
      </p>
      <p data-mark className="detail-label absolute" style={{ right: 0, bottom: 0, whiteSpace: "nowrap", lineHeight: 1 }}>
        Mileage
      </p>
      {hovered && (
        <Tip x={x(hovered.mileageMi)} y={y(hovered.priceUsd)} width={width} mid={(left + right) / 2} center>
          <p>{marketplaceName(hovered.marketplace)}</p>
          <p className="font-mono">
            {hovered.year} · {formatMiles(hovered.mileageMi)} · {formatPrice(hovered.priceUsd)}
          </p>
        </Tip>
      )}
      <div aria-live="polite" className="sr-only">
        {hovered ? labelOf(hovered) : ""}
      </div>
    </>
  );
}

// ---- Tab 3: price history (line) ----------------------------------------------------------------------------

function PriceHistory({ price, history, width, height }: { price: number; history: HistoryPoint[]; width: number; height: number }) {
  const uid = useId();
  const left = MARGIN.left;
  const right = width - MARGIN.right;
  const top = MARGIN.top;
  const bottom = height - MARGIN.bottom;
  const last = history.length - 1;
  const x = useMemo(() => scaleLinear().domain([0, last]).range([left, right]), [last, left, right]);
  const y = useMemo(() => {
    const values = [price, ...history.map((h) => h.medianUsd)];
    return scaleLinear().domain([Math.min(...values) * 0.96, Math.max(...values) * 1.04]).range([bottom, top]);
  }, [history, price, bottom, top]);
  const yTicks = y.ticks(4);
  const path = shapeLine<HistoryPoint>()
    .x((_, i) => x(i))
    .y((d) => y(d.medianUsd))(history);
  const { hover, setHover, bind } = useMarks(history.length, last);
  const hovered = hover !== null ? history[hover] : null;

  const onMove = (event: ReactPointerEvent<SVGRectElement>) => {
    const { x: px } = localPoint(event);
    setHover(Math.max(0, Math.min(last, Math.round(x.invert(px)))));
  };
  const tickIdx = [0, Math.min(10, last), last].filter((v, i, all) => all.indexOf(v) === i);

  return (
    <>
      {yTicks.map((t) => (
        <Rule key={t} top={y(t)} left={left} width={right - left} strength={12} />
      ))}
      <svg data-mark-group width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" style={{ overflow: "visible" }} role="group" aria-label="Median asking price by quarter; arrow keys move between quarters">
        <clipPath id={`${uid}-clip`}>
          <rect data-rule x={0} y={0} width={width} height={height} style={{ transformBox: "fill-box", transformOrigin: "left" }} />
        </clipPath>
        <line x1={left} x2={right} y1={y(price)} y2={y(price)} stroke={ink(50)} strokeWidth={1.5} strokeDasharray="5 5" style={{ pointerEvents: "none" }} />
        {hovered && <line x1={x(hover!)} x2={x(hover!)} y1={top} y2={bottom} stroke={ink(30)} strokeWidth={1} style={{ pointerEvents: "none" }} />}
        {/* The line draws along its length via the clip geometry's own `scaleX` (step 5: "tied to scaleX of a
            clip, which is an allowed transform"): the clip rect scales, the path inside it never does. */}
        <g clipPath={`url(#${uid}-clip)`}>{path && <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2} style={{ pointerEvents: "none" }} />}</g>
        {history.map((h, i) => (
          <circle
            key={h.quarter}
            data-mark
            cx={x(i)}
            cy={y(h.medianUsd)}
            r={hover === i ? 6 : i === last ? 5 : 3}
            fill="var(--color-ink)"
            style={{ transformBox: "fill-box", transformOrigin: "center", outlineOffset: 2, pointerEvents: "none" }}
            {...bind(i, `${h.quarter}: ${formatPrice(h.medianUsd)} median asking price`)}
          />
        ))}
        <rect x={left} y={top} width={right - left} height={bottom - top} fill="transparent" style={{ pointerEvents: "all" }} onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {yTicks.map((t) => (
        <TickLabel key={t} x={0} y={y(t) - 7} w={left - 8} align="right">
          ${Math.round(t / 1000)}k
        </TickLabel>
      ))}
      {tickIdx.map((i) => (
        <TickLabel key={i} x={i === last ? width - 64 : x(i) - 32} y={bottom + 4} w={64} align={i === last ? "right" : "center"}>
          {history[i].quarter}
        </TickLabel>
      ))}
      <div data-mark className="absolute flex items-baseline gap-2" style={{ right: MARGIN.right, bottom: height - y(price) + 4, whiteSpace: "nowrap" }}>
        <span className="detail-label">This car</span>
        <span className="font-mono" style={{ fontSize: "max(11px, calc(13 * var(--u)))" }}>
          {formatPrice(price)}
        </span>
      </div>
      {hovered && (
        <Tip x={x(hover!)} y={y(hovered.medianUsd)} width={width} mid={(left + right) / 2} center>
          <p className="font-mono">
            {hovered.quarter} · {formatPrice(hovered.medianUsd)}
          </p>
        </Tip>
      )}
      <div aria-live="polite" className="sr-only">
        {hovered ? `${hovered.quarter}: ${formatPrice(hovered.medianUsd)} median asking price` : ""}
      </div>
    </>
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
              <td>{marketplaceName(l.marketplace)}</td>
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

// ---- The module: price, comparison line, tabs ---------------------------------------------------------------

/** The chart box: fills what the panel leaves, measures itself, and renders its chart once it has a size. */
function ChartBox({ children }: { children: (size: { width: number; height: number }) => ReactNode }) {
  const [ref, size] = useChartSize();
  return (
    <div ref={ref} className="relative" style={{ marginTop: u(16), flex: 1, minHeight: `max(220px, ${u(220)})` }}>
      {size.width > 0 && size.height > 0 && children(size)}
    </div>
  );
}

const TABS = ["Price spread", "Price vs mileage", "Price history"] as const;

/** Section D's `price-module` block: the price, the comparison line and three tabs (WAI-ARIA tabs pattern,
 * automatic activation). Only the active panel's content is mounted, so a chart always measures a visible box. */
export function PriceModule({ car }: { car: CarWithAssets }) {
  const { listings, history } = getComparables(car.slug);
  const base = useId();
  const [tab, setTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const trend = trendLine(listings);

  const select = (to: number) => {
    const next = (to + TABS.length) % TABS.length;
    setTab(next);
    tabRefs.current[next]?.focus();
  };
  const onTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const to = event.key === "ArrowRight" ? i + 1 : event.key === "ArrowLeft" ? i - 1 : event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : null;
    if (to === null) return;
    // preventDefault keeps Detail.tsx's window onKey from also stepping the page between sections.
    event.preventDefault();
    select(to);
  };

  const panelStyle: CSSProperties = { marginTop: u(24), flex: 1, minHeight: 0 };
  return (
    <>
      <p data-mark className="font-mono" style={{ fontSize: "var(--type-price)", lineHeight: 1 }}>
        {formatPrice(car.priceUsd)}
      </p>
      {/* 75%, not 65% (6h): 65% measured 4.03:1 on the figma theme's card, under AA. */}
      <p data-mark style={{ marginTop: u(8), fontSize: "max(12px, var(--type-label))", lineHeight: 1.4, color: ink(75) }}>
        {comparisonLine(listings)}
      </p>
      <div role="tablist" aria-label="Price comparison datasets" className="relative flex" style={{ marginTop: u(24), gap: u(32) }}>
        {TABS.map((label, i) => (
          <button
            key={label}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`${base}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={tab === i}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={tab === i ? 0 : -1}
            className="price-tab"
            onClick={() => setTab(i)}
            onKeyDown={(event) => onTabKey(event, i)}
          >
            {label}
          </button>
        ))}
        <div data-rule aria-hidden className="absolute bottom-0 left-0 h-px w-full origin-left" style={{ background: ink(22) }} />
      </div>
      {TABS.map((label, i) => (
        <div
          key={label}
          id={`${base}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${i}`}
          hidden={tab !== i}
          style={{ ...panelStyle, display: tab === i ? "flex" : undefined, flexDirection: "column" }}
        >
          {tab === i && (
            <>
              {i === 0 && <Takeaway>{stripSummary(car.priceUsd, listings)}</Takeaway>}
              {i === 1 && <Takeaway>{mileageTakeaway(car.priceUsd, car.mileageMi, trend)}</Takeaway>}
              {i === 2 && <Takeaway>{historyTakeaway(car.chassis, history)}</Takeaway>}
              <ChartBox>
                {({ width, height }) =>
                  i === 0 ? (
                    <PriceStrip price={car.priceUsd} listings={listings} width={width} height={height} />
                  ) : i === 1 ? (
                    <PriceScatter price={car.priceUsd} mileageMi={car.mileageMi} listings={listings} width={width} height={height} />
                  ) : (
                    <PriceHistory price={car.priceUsd} history={history} width={width} height={height} />
                  )
                }
              </ChartBox>
              <Caption>
                {i === 0 && "Larger dots mean more listings at that price. Illustrative data."}
                {i === 1 && "Illustrative data; a straight trend line fit to the comparables above."}
                {i === 2 && <>Median of {listings.length} comparable listings&rsquo; asking price by quarter. Illustrative data.</>}
              </Caption>
            </>
          )}
        </div>
      ))}
      {/* Outside the panels: hidden panels hide their content from assistive tech. */}
      <DataTable price={car.priceUsd} listings={listings} history={history} />
    </>
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
      // `clearProps` on completion: the dots carry their own React-driven opacity (the hover dim), set as an
      // SVG attribute. GSAP's fade would otherwise leave an inline `style.opacity: 1` behind, which outranks
      // that attribute in the cascade and would silently defeat the hover dim forever after.
      gsap.to([...rules, ...marks], { opacity: 1, duration: 0.3, ease: "sine.out", clearProps: "opacity" });
      return;
    }
    gsap.fromTo(rules, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease, stagger: 0.06, transformOrigin: "left" });
    if (dots.length) dotGrow(dots, reduced);
    if (nonDotMarks.length) markRise(nonDotMarks, reduced);
  };
}
