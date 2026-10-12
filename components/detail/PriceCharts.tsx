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
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { CarWithAssets } from "@/lib/cars";
import {
  bucketStep,
  cheaperThanShare,
  getComparables,
  historyTakeaway,
  marketplaceName,
  mileageTakeaway,
  priceBuckets,
  spreadTakeaway,
  stripSummary,
  trendAt,
  trendLine,
  VERDICT_LABEL,
  verdictFor,
  type HistoryPoint,
  type Listing,
} from "@/lib/comparables";
import { effect, ease as gsapEase, reduced as reducedTokens } from "@/lib/detail-motion";
import { formatMiles, formatPrice } from "@/lib/format";

const ease = "cubic-bezier(0.215, 0.61, 0.355, 1)"; // --ease-reveal
const u = (n: number) => `calc(${n} * var(--u))`;
const ink = (pct: number) => `color-mix(in srgb, var(--color-ink) ${pct}%, transparent)`;
const TICK_FONT = "max(11px, calc(11 * var(--u)))";

/** The chart box's size in CSS px, plus the tick font's computed px size (the box sets `font-size: TICK_FONT`,
 * so tick labels can be measured without a DOM probe). Measured synchronously on mount (so the first commit
 * after it already has marks) and then on every resize. */
function useChartSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0, font: 11 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setSize((prev) => {
        const font = parseFloat(getComputedStyle(el).fontSize) || 11;
        return prev.width === el.clientWidth && prev.height === el.clientHeight && prev.font === font ? prev : { width: el.clientWidth, height: el.clientHeight, font };
      });
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
    <p data-tab-in style={{ marginTop: u(12), fontSize: "max(10px, var(--type-label))", color: ink(70) }}>{children}</p>
  );
}

function Takeaway({ children }: { children: ReactNode }) {
  return (
    <p data-mark data-tab-in className="detail-label">
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

/** 7b's tick-overlap rule: every tick label is estimated at 0.62 em per character, clamped inside the box, and
 * dropped when it would start less than `gap` px after the previous kept label ends (7a showed "$38,0$40,000"). */
function placeTicks(ticks: { key: string | number; x: number; text: string }[], width: number, font: number, gap = 8) {
  const placed: { key: string | number; text: string; left: number; w: number }[] = [];
  let prevRight = -Infinity;
  for (const t of ticks) {
    const w = Math.ceil(t.text.length * 0.62 * font);
    const left = Math.max(0, Math.min(width - w, t.x - w / 2));
    if (left < prevRight + gap) continue;
    placed.push({ key: t.key, text: t.text, left, w });
    prevRight = left + w;
  }
  return placed;
}

/** Price-axis labels in thousands. When the ticks fall on half-thousands (the $9k to $12k cars) a whole-number
 * label would repeat itself ("$9k, $9k"), so every label gets one decimal. */
function priceTickText(ticks: number[]) {
  const decimals = ticks.some((t) => t % 1000 !== 0) ? 1 : 0;
  return (t: number) => `$${(t / 1000).toFixed(decimals)}k`;
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

function PriceStrip({ price, listings, width, height, font }: { price: number; listings: Listing[]; width: number; height: number; font: number }) {
  const step = bucketStep(price);
  const buckets = useMemo(() => priceBuckets(listings, step), [listings, step]);
  const prices = useMemo(() => listings.map((l) => l.priceUsd), [listings]);
  const domain = useMemo(() => {
    const all = [...prices, price];
    const span = Math.max(...all) - Math.min(...all);
    return [Math.min(...all) - span * 0.06, Math.max(...all) + span * 0.06];
  }, [prices, price]);
  const x = useMemo(() => scaleLinear().domain(domain).range([0, width]), [domain, width]);
  const rMin = 0.016 * width;
  const rMax = 0.055 * width;
  const r = useMemo(() => scaleSqrt().domain([0, Math.max(...buckets.map((b) => b.count))]).range([rMin, rMax]), [buckets, rMin, rMax]);
  const baseline = 0.74 * height; // 7b asked for 0.62; 0.74 after measuring a ~100 px dead band under the ticks (user approved)
  const ringR = 0.03 * width + 2;
  const ticks = placeTicks(
    x.ticks(4).map((t) => ({ key: t, x: x(t), text: formatPrice(t) })),
    width,
    font,
  );
  const { hover, setHover, bind } = useMarks(buckets.length, 0);
  const hovered = hover !== null ? buckets[hover] : null;
  const tipText = hovered ? `${formatPrice(hovered.mid - step / 2)} to ${formatPrice(hovered.mid + step / 2)}: ${hovered.count} listing${hovered.count === 1 ? "" : "s"}` : "";

  // This car's pin: a 2 px line from the ring's top up to 28 px below the box's top (taller when the label
  // is, at large sizes), with the label centred on it and clamped inside the box.
  const labelRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = labelRef.current;
    if (el) setLabel((prev) => (prev.w === el.offsetWidth && prev.h === el.offsetHeight ? prev : { w: el.offsetWidth, h: el.offsetHeight }));
  }, [price, width, height]);
  const pinX = x(price);
  const lineTop = Math.max(28, label.h);
  const labelLeft = Math.max(0, Math.min(width - label.w, pinX - label.w / 2));

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
            data-dot
            cx={x(b.mid)}
            cy={baseline}
            r={r(b.count)}
            fill="var(--color-ink)"
            opacity={hover === null || hover === i ? 0.72 : 0.22}
            style={{ transformBox: "fill-box", transformOrigin: "center", outlineOffset: 3, pointerEvents: "none" }}
            {...bind(i, `${formatPrice(b.mid - step / 2)} to ${formatPrice(b.mid + step / 2)}: ${b.count} listing${b.count === 1 ? "" : "s"}`)}
          />
        ))}
        {/* "This car" is always an ink ring, never colour (step 5's own wording), with a pin rising from it. */}
        <circle data-mark cx={pinX} cy={baseline} r={ringR} fill="none" stroke="var(--color-ink)" strokeWidth={2} style={{ transformBox: "fill-box", transformOrigin: "center", pointerEvents: "none" }} />
        <line data-mark x1={pinX} x2={pinX} y1={lineTop} y2={baseline - ringR} stroke="var(--color-ink)" strokeWidth={2} style={{ pointerEvents: "none" }} />
        <rect x={0} y={0} width={width} height={hitHeight} fill="transparent" style={{ pointerEvents: "all" }} onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {ticks.map((t) => (
        <TickLabel key={t.key} x={t.left} y={baseline + rMax + 12} w={t.w}>
          {t.text}
        </TickLabel>
      ))}
      <div ref={labelRef} data-mark className="absolute text-center" style={{ left: labelLeft, bottom: height - lineTop, whiteSpace: "nowrap" }}>
        <p className="detail-label" style={{ letterSpacing: "var(--label-tracking)" }}>This car</p>
        <p className="font-mono" style={{ fontSize: "max(11px, calc(13 * var(--u)))", lineHeight: 1.2 }}>{formatPrice(price)}</p>
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

/** Tab 1's stat row: below the strip, hairline above, values at 24u (7b asked for 32u; six-figure prices collided, user approved 24u). */
function StripStats({ listings }: { listings: Listing[] }) {
  const prices = listings.map((l) => l.priceUsd);
  const stats: [string, string][] = [
    ["Lowest", formatPrice(Math.min(...prices))],
    ["Median", formatPrice(median(prices))],
    ["Highest", formatPrice(Math.max(...prices))],
    ["Listings", String(listings.length)],
  ];
  return (
    <div data-tab-in className="relative" style={{ marginTop: u(16) }}>
      <Rule top={0} />
      <dl className="flex justify-between" style={{ paddingTop: 16 }}>
        {stats.map(([name, value]) => (
          <div key={name} data-mark>
            <dt className="detail-label">{name}</dt>
            <dd className="font-mono" style={{ fontSize: "max(18px, calc(24 * var(--u)))", lineHeight: 1.1, whiteSpace: "nowrap" }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---- Tab 2: price vs mileage (scatter) ----------------------------------------------------------------------

const MARGIN = { top: 8, right: 8, bottom: 36, left: 56 };

function PriceScatter({ price, mileageMi, listings, width, height, font }: { price: number; mileageMi: number; listings: Listing[]; width: number; height: number; font: number }) {
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
  const xTicks = placeTicks(
    x.ticks(4).map((t) => ({ key: t, x: x(t), text: `${Math.round(t / 1000)}k mi` })),
    width,
    font,
  );
  // A tick within 16 px of the top would sit under the "Asking price" axis title: drop it.
  const yTicks = y.ticks(4).filter((t) => y(t) >= top + 16);
  const yText = priceTickText(yTicks);
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
          {yText(t)}
        </TickLabel>
      ))}
      {xTicks.map((t) => (
        <TickLabel key={t.key} x={t.left} y={bottom + 4} w={t.w}>
          {t.text}
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

function PriceHistory({ price, history, width, height, font }: { price: number; history: HistoryPoint[]; width: number; height: number; font: number }) {
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
  const yText = priceTickText(yTicks);
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
  const quarterTicks = placeTicks(
    tickIdx.map((i) => ({ key: i, x: x(i), text: history[i].quarter })),
    width,
    font,
  );

  return (
    <>
      {yTicks.map((t) => (
        <Rule key={t} top={y(t)} left={left} width={right - left} strength={12} />
      ))}
      <svg data-mark-group width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" style={{ overflow: "visible" }} role="group" aria-label="Median asking price by quarter; arrow keys move between quarters">
        <clipPath id={`${uid}-clip`}>
          <rect data-rule data-clip x={0} y={0} width={width} height={height} style={{ transformBox: "fill-box", transformOrigin: "left" }} />
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
          {yText(t)}
        </TickLabel>
      ))}
      {quarterTicks.map((t) => (
        <TickLabel key={t.key} x={t.left} y={bottom + 4} w={t.w}>
          {t.text}
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

// ---- The module: verdict, price line, comparison line, tabs -------------------------------------------------

/** The chart box: fills what the panel leaves, measures itself, renders its chart once it has a size, and then
 * reports itself ready (`onReady` runs in the commit that first holds the chart's marks, before paint, which
 * is when a tab switch can set the marks' starting state without a flash). */
function ChartBox({ minHeight, onReady, children }: { minHeight: string; onReady?: (box: HTMLElement) => void; children: (size: { width: number; height: number; font: number }) => ReactNode }) {
  const [ref, size] = useChartSize();
  const ready = size.width > 0 && size.height > 0;
  const readyRef = useRef(onReady);
  useLayoutEffect(() => {
    readyRef.current = onReady;
  });
  useLayoutEffect(() => {
    if (ready && ref.current) readyRef.current?.(ref.current);
  }, [ready, ref]);
  return (
    <div ref={ref} data-tab-in className="relative" style={{ marginTop: u(16), flex: 1, minHeight, fontSize: TICK_FONT }}>
      {ready && children(size)}
    </div>
  );
}

const TABS = ["Price spread", "Price vs mileage", "Price history"] as const;

const prefersReduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** A mark's resting opacity: its own SVG `opacity` attribute (the hover dim lives there) or 1. */
const restOpacity = (_: number, el: Element) => parseFloat(el.getAttribute("opacity") ?? "1");
/** What a switch tween leaves behind on an element; cleared so React's own attributes govern again (6h). */
const SWITCH_PROPS = "opacity,transform";

/** The info icon beside the claim line: a real button, so it works by keyboard and touch, not hover alone. Hover and
 * focus show its tooltip by CSS; a click toggles `aria-expanded`, which shows it for touch. Escape (focus on the
 * button) closes it and is stopped here so Experience.tsx's Escape-leaves-the-detail-page listener doesn't also fire. */
function InfoButton({ id, open, onToggle, onClose, children }: { id: string; open: boolean; onToggle: () => void; onClose: () => void; children: ReactNode }) {
  return (
    <span data-info className="price-info-wrap">
      <button
        type="button"
        className="price-info"
        aria-label="About this comparison"
        aria-expanded={open}
        aria-describedby={id}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !open) return;
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
      >
        <span aria-hidden className="font-display" style={{ fontStyle: "italic" }}>i</span>
      </button>
      <span role="tooltip" id={id} className="price-info-tip">
        {children}
      </span>
    </span>
  );
}

/** Section D's `price-module` block: the verdict as the headline, the price line, the comparison line and three
 * tabs (WAI-ARIA tabs pattern, automatic activation). Only the active panel's content is mounted, so a chart
 * always measures a visible box. `renderVerdict` is Detail.tsx's char-rise markup, so M2 can reveal the headline. */
export function PriceModule({ car, renderVerdict }: { car: CarWithAssets; renderVerdict: (text: string) => ReactNode }) {
  const { listings, history } = getComparables(car.slug);
  const base = useId();
  const [tab, setTab] = useState(0);
  const tabNow = useRef(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tablist = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLDivElement>(null);
  const animated = useRef<Element[]>([]);
  const running = useRef<gsap.core.Timeline | null>(null);
  const pointerSwitch = useRef(false);
  const trend = trendLine(listings);
  const prices = listings.map((l) => l.priceUsd);
  const verdict = VERDICT_LABEL[verdictFor(car.priceUsd, prices)];
  const [infoOpen, setInfoOpen] = useState(false);
  useEffect(() => {
    if (!infoOpen) return;
    const away = (event: PointerEvent) => {
      if (!(event.target as Element).closest("[data-info]")) setInfoOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [infoOpen]);

  /** M13's indicator: one bar moved with `x` and `scaleX` (a 1 px wide element scaled to the tab's width). */
  const place = (to: number, animate: boolean) => {
    const bar = indicator.current;
    const button = tabRefs.current[to];
    if (!bar || !button) return;
    const vars = { x: button.offsetLeft, scaleX: button.offsetWidth };
    if (animate) gsap.to(bar, { ...vars, duration: effect.tabSwitch.duration, ease: effect.tabSwitch.ease, overwrite: "auto" });
    else {
      gsap.killTweensOf(bar);
      gsap.set(bar, vars);
    }
  };
  useLayoutEffect(() => {
    const list = tablist.current;
    if (!list) return;
    place(tabNow.current, false);
    const observer = new ResizeObserver(() => place(tabNow.current, false));
    observer.observe(list);
    tabRefs.current.forEach((b) => b && observer.observe(b));
    // The webfont swaps in after the first measure; re-measure once it has.
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) place(tabNow.current, false);
    });
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, []);
  useLayoutEffect(
    () => () => {
      running.current?.kill();
      gsap.killTweensOf(animated.current);
      if (indicator.current) gsap.killTweensOf(indicator.current);
    },
    [],
  );

  /** Interruption (M13): stop whatever the previous switch animated and put it at its end state. */
  const settle = () => {
    running.current?.kill();
    running.current = null;
    gsap.killTweensOf(animated.current);
    gsap.set(animated.current, { clearProps: SWITCH_PROPS });
    animated.current = [];
  };

  /** Plays the incoming panel's entrance once its chart's marks exist. Pointer switches only. */
  const playSwitch = (box: HTMLElement) => {
    const panel = box.closest<HTMLElement>('[role="tabpanel"]');
    if (!panel) return;
    const content = Array.from(panel.querySelectorAll<HTMLElement>("[data-tab-in]"));
    const circles = Array.from(panel.querySelectorAll<SVGCircleElement>("svg[data-mark-group] circle[data-mark]"));
    const dots = Array.from(panel.querySelectorAll<SVGCircleElement>("circle[data-dot]"));
    const clip = panel.querySelector<SVGRectElement>("rect[data-clip]");
    animated.current = [...content, ...circles, ...(clip ? [clip] : [])];
    const t = effect.tabSwitch;
    if (prefersReduced()) {
      running.current = gsap.timeline().fromTo(animated.current.filter((el) => el !== clip), { opacity: 0 }, { opacity: restOpacity, duration: reducedTokens.fade, ease: gsapEase.fade, clearProps: SWITCH_PROPS }, 0);
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: t.ease } });
    tl.fromTo(content, { opacity: 0, y: t.y }, { opacity: 1, y: 0, duration: t.duration, stagger: t.stagger, clearProps: SWITCH_PROPS }, 0);
    if (tabNow.current === 0) {
      tl.fromTo(dots, { opacity: 0, scale: t.dotScale }, { opacity: restOpacity, scale: 1, duration: t.duration, stagger: t.dotStagger, clearProps: SWITCH_PROPS }, 0);
    } else if (tabNow.current === 1) {
      tl.fromTo(circles, { opacity: 0 }, { opacity: restOpacity, duration: t.duration, clearProps: SWITCH_PROPS }, t.scatterDelay);
    } else if (clip) {
      tl.fromTo(clip, { scaleX: 0 }, { scaleX: 1, duration: t.duration, clearProps: SWITCH_PROPS }, 0);
      tl.fromTo(circles, { opacity: 0 }, { opacity: restOpacity, duration: t.pointsDuration, clearProps: SWITCH_PROPS }, ">");
    }
    running.current = tl;
  };
  const onChartReady = (box: HTMLElement) => {
    if (!pointerSwitch.current) return;
    pointerSwitch.current = false;
    playSwitch(box);
  };

  /** Pointer clicks animate; keyboard switches (arrows, Home, End) are instant: no animation on keyboard-initiated
   * actions (/review-animations). */
  const switchTo = (to: number, viaPointer: boolean) => {
    if (to === tabNow.current) return;
    settle();
    tabNow.current = to;
    pointerSwitch.current = viaPointer;
    place(to, viaPointer && !prefersReduced());
    setTab(to);
  };
  const onTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const to = event.key === "ArrowRight" ? i + 1 : event.key === "ArrowLeft" ? i - 1 : event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : null;
    if (to === null) return;
    // preventDefault keeps Detail.tsx's window onKey from also stepping the page between sections.
    event.preventDefault();
    const next = (to + TABS.length) % TABS.length;
    switchTo(next, false);
    tabRefs.current[next]?.focus();
  };

  const panelStyle: CSSProperties = { marginTop: u(24), flex: 1, minHeight: 0 };
  return (
    <>
      {/* The verdict is the section's headline (7b): the answer first, in the page's display voice. The text is
          in the sr-only copy once; the aria-hidden pieces are M2's character spans (same markup as section B). */}
      <p className="font-display" style={{ fontFamily: "var(--t-display)", fontSize: "max(32px, calc(64 * var(--u)))", lineHeight: "var(--display-leading)", letterSpacing: "var(--display-tracking)", textTransform: "var(--display-case)", fontWeight: 400 }}>
        <span className="sr-only">{verdict}</span>
        <span aria-hidden className="block overflow-hidden">
          <span className="block">{renderVerdict(verdict)}</span>
        </span>
      </p>
      {/* Same hairline as the tab divider (7c); it draws with the other rules (M8). */}
      <div data-rule aria-hidden className="h-px w-full origin-left" style={{ marginTop: u(16), background: ink(22) }} />
      {/* The price and the claim sit on an ink block (7d); the source and method live in the info tooltip. */}
      <div data-mark className="price-block" style={{ marginTop: u(16), background: "var(--color-ink)", color: "var(--color-paper)", padding: "max(16px, calc(20 * var(--u)))" }}>
        <span className="block font-mono" style={{ fontSize: "max(20px, calc(32 * var(--u)))", lineHeight: 1 }}>
          {formatPrice(car.priceUsd)}
        </span>
        <span className="block" style={{ marginTop: 12, fontSize: "max(13px, var(--type-body))", color: "color-mix(in srgb, var(--color-paper) 80%, transparent)" }}>
          cheaper than {Math.round(cheaperThanShare(car.priceUsd, prices) * 100)}% of vehicles across {listings.length} comparable{" "}
          <span className="whitespace-nowrap">
            listings
            <InfoButton id={`${base}-info`} open={infoOpen} onToggle={() => setInfoOpen((v) => !v)} onClose={() => setInfoOpen(false)}>
              {listings.length} listings · {new Intl.ListFormat("en", { type: "conjunction" }).format(Array.from(new Set(listings.map((l) => l.marketplace))).map(marketplaceName))}. Listings of the same model, by asking price. “Cheaper than” is the share asking more than this car. Illustrative data.
            </InfoButton>
          </span>
        </span>
      </div>
      {/* The full sentence once, for screen readers; the header says it in pieces. */}
      <span className="sr-only">{stripSummary(car.priceUsd, listings)}</span>
      <div ref={tablist} role="tablist" aria-label="Price comparison datasets" className="relative flex justify-between" style={{ marginTop: u(32) }}>
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
            onClick={() => switchTo(i, true)}
            onKeyDown={(event) => onTabKey(event, i)}
          >
            {label}
          </button>
        ))}
        <div data-rule aria-hidden className="absolute bottom-0 left-0 h-px w-full origin-left" style={{ background: ink(22) }} />
        <div ref={indicator} aria-hidden className="absolute bottom-0 left-0 origin-left" style={{ width: 1, height: 2, background: "var(--color-ink)" }} />
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
              {i === 0 && <Takeaway>{spreadTakeaway(listings)}</Takeaway>}
              {i === 1 && <Takeaway>{mileageTakeaway(car.priceUsd, car.mileageMi, trend)}</Takeaway>}
              {i === 2 && <Takeaway>{historyTakeaway(car.chassis, history)}</Takeaway>}
              <ChartBox minHeight={i === 0 ? "max(200px, calc(200 * var(--u)))" : "max(220px, calc(220 * var(--u)))"} onReady={onChartReady}>
                {({ width, height, font }) =>
                  i === 0 ? (
                    <PriceStrip price={car.priceUsd} listings={listings} width={width} height={height} font={font} />
                  ) : i === 1 ? (
                    <PriceScatter price={car.priceUsd} mileageMi={car.mileageMi} listings={listings} width={width} height={height} font={font} />
                  ) : (
                    <PriceHistory price={car.priceUsd} history={history} width={width} height={height} font={font} />
                  )
                }
              </ChartBox>
              {i === 0 && <StripStats listings={listings} />}
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
