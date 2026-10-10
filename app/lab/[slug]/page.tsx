import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lab, type LabOptions } from "@/components/lab/Lab";
import { PoseLab } from "@/components/lab/PoseLab";
import lineup from "@/content/lineup.json";
import { POSE_IDS } from "@/lib/choreography";
import { getCar } from "@/lib/cars";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const SLUGS = Object.keys(lineup);
const ENVS = ["studio_small_09", "studio_small_08", "photo_studio_loft_hall"];
// Showroom triangle checkpoints, in thousands (npm run models -- --checkpoints).
const CHECKPOINTS = [110, 150, 200, 260];

const SIZES = [[1080, 720], [1440, 960], [1920, 1080]] as const;

/** `?pose=P0..P3`: the camera choreography beside its storyboard frame (docs/overhaul.md, step 4). `p` sets the progress (0 to 3), `w` and `h` the stage, `turn` the turntable at T1's start. */
function PoseView({ slug, one }: { slug: string; one: (key: string) => string | undefined }) {
  const car = getCar(slug);
  if (!car) notFound();
  const pose = POSE_IDS.find((id) => id === one("pose")) ?? "P0";
  const [width, height] = SIZES.find(([w]) => String(w) === one("w")) ?? SIZES[1];
  const number = (key: string, fallback: number) => (Number.isFinite(Number(one(key))) && one(key) !== undefined && one(key) !== "" ? Number(one(key)) : fallback);
  const progress = Math.min(3, Math.max(0, number("p", POSE_IDS.indexOf(pose))));
  const state = { pose, p: String(progress), w: String(width), turn: String(number("turn", 0)), ...(one("guides") === "1" ? { guides: "1" } : {}), ...(one("reduce") === "1" ? { reduce: "1" } : {}) };
  const href = (patch: Partial<Record<string, string>>) => {
    const next: Record<string, string | undefined> = { ...state, ...patch };
    for (const key of Object.keys(next)) if (next[key] === undefined) delete next[key];
    return `/lab/${patch.slug ?? slug}?${new URLSearchParams(next as Record<string, string>)}`;
  };
  const stage = (
    <PoseLab
      key={JSON.stringify([slug, state])}
      slug={slug}
      src={car.model3d.src}
      paint={car.colors.paint}
      progress={progress}
      width={width}
      height={height}
      turntable={number("turn", 0)}
      guides={one("guides") === "1"}
      reduced={one("reduce") === "1"}
      still={one("still") === "1"}
    />
  );
  if (one("still") === "1") return stage;
  const row = "flex flex-wrap gap-x-3 gap-y-1";
  return (
    <>
      {stage}
      <nav className="fixed top-3 left-4 z-10 space-y-1.5 bg-paper/90 p-2 font-mono text-[12px] leading-snug">
        <p className={row}>{SLUGS.map((s) => <Link key={s} href={href({ slug: s })} className={s === slug ? "underline" : ""}>{s}</Link>)}</p>
        <p className={row}>
          {POSE_IDS.map((id, i) => <Link key={id} href={href({ pose: id, p: String(i) })} className={id === pose ? "underline" : ""}>{id}</Link>)}
          {SIZES.map(([w, h]) => <Link key={w} href={href({ w: String(w) })} className={w === width ? "underline" : ""}>{w} × {h}</Link>)}
          <Link href={href({ guides: state.guides ? undefined : "1" })}>guides: {state.guides ? "on" : "off"}</Link>
        </p>
      </nav>
    </>
  );
}

// Dev-only studio lighting lab: the shipping files from public/models, and comparison files from
// public/lab (npm run models -- --lab, --raw or --checkpoints).
// Production builds return 404 unless ARCADE_STUDIO=1 is set.
export default async function LabPage({ params, searchParams }: PageProps<"/lab/[slug]">) {
  if (process.env.NODE_ENV === "production" && process.env.ARCADE_STUDIO !== "1") notFound();
  const { slug } = await params;
  if (!SLUGS.includes(slug)) notFound();
  const q = await searchParams;
  const one = (key: string) => (Array.isArray(q[key]) ? q[key][0] : q[key]);
  // The author's render colour (the default) and three factory colours from content/lineup.json.
  const car = lineup[slug as keyof typeof lineup];
  const swatches = [{ ...car.original, label: `original: ${car.original.name}` }, ...car.colors.map((c) => ({ ...c, label: c.name }))];
  const paint = /^[0-9a-f]{6}$/i.test(one("paint") ?? "") ? `#${one("paint")!.toLowerCase()}` : car.original.hex;
  if (one("pose") !== undefined) return <PoseView slug={slug} one={one} />;
  const options: LabOptions = {
    slug,
    mode: one("mode") === "old" ? "old" : "new",
    env: ENVS.includes(one("env") ?? "") ? one("env")! : ENVS[0],
    bg: one("bg") === "none" ? "none" : "grey",
    ao: one("ao") === "1",
    view: (["side", "rear", "top", "wheel", "nose", "tail"] as const).find((v) => v === one("view")) ?? "ref",
    look: (["now", "solid"] as const).find((l) => l === one("look")) ?? "studio",
    tone: (["neutral", "agx"] as const).find((t) => t === one("tone")) ?? (one("look") === "now" ? "neutral" : "aces"),
    checkpoint: CHECKPOINTS.find((c) => String(c) === one("cp")),
    still: one("still") === "1",
    // The shipping desktop file (public/models) by default.
    lod: (["budget", "phone", "raw"] as const).find((l) => l === one("lod")) ?? "hero",
    shadow: one("shadow") === "live" ? "live" : "baked",
    stress: Math.min(8, Math.max(1, Number(one("stress")) || 1)),
    paint,
    metallic: swatches.find((s) => s.hex === paint)?.metallic,
  };
  if (options.still) return <Lab {...options} />;

  const href = (patch: Partial<Record<string, string>>) => {
    const next = { mode: options.mode, env: options.env, bg: options.bg, ao: options.ao ? "1" : "0", view: options.view, lod: options.lod, shadow: options.shadow, look: options.look, tone: options.tone, ...(options.checkpoint ? { cp: String(options.checkpoint) } : {}), ...(options.paint ? { paint: options.paint.slice(1) } : {}), ...patch };
    for (const key of Object.keys(next)) if (next[key as keyof typeof next] === "") delete next[key as keyof typeof next];
    return `/lab/${slug}?${new URLSearchParams(next as Record<string, string>)}`;
  };
  const row = "flex flex-wrap gap-x-3 gap-y-1";
  return (
    <>
      <Lab {...options} />
      <nav className="fixed top-4 left-4 space-y-2 bg-paper/85 p-3 font-mono text-[12px] leading-snug">
        {/* Switching car drops the paint, so each car opens in its own original colour. */}
        <p className={row}>{SLUGS.map((s) => <Link key={s} href={`/lab/${s}?${new URLSearchParams(href({ paint: "" }).split("?")[1])}`} className={s === slug ? "underline" : ""}>{s}</Link>)}</p>
        <p className={row}>
          {swatches.map((s) => (
            <Link key={s.label} href={href({ paint: s.hex.slice(1) })} className={`inline-flex items-center gap-1.5 ${s.hex === paint ? "underline" : ""}`}>
              <span aria-hidden className="inline-block size-3 rounded-full border border-ink/30" style={{ background: s.hex }} />
              {s.label}{s.metallic ? " (met.)" : ""}
            </Link>
          ))}
        </p>
        <p className={row}>{(["new", "old"] as const).map((m) => <Link key={m} href={href({ mode: m })} className={m === options.mode ? "underline" : ""}>{m === "old" ? "old pipeline" : "new studio"}</Link>)}</p>
        <p className={row}>{ENVS.map((e) => <Link key={e} href={href({ env: e })} className={e === options.env ? "underline" : ""}>{e}</Link>)}</p>
        <p className={row}>{(["ref", "side", "rear", "top", "wheel", "nose", "tail"] as const).map((v) => <Link key={v} href={href({ view: v })} className={v === options.view ? "underline" : ""}>{v}</Link>)}</p>
        <p className={row}>
          {(["now", "solid", "studio"] as const).map((l) => <Link key={l} href={href({ look: l, tone: l === "now" ? "neutral" : "aces" })} className={l === options.look ? "underline" : ""}>look: {l}</Link>)}
          {(["neutral", "aces", "agx"] as const).map((t) => <Link key={t} href={href({ tone: t })} className={t === options.tone ? "underline" : ""}>{t}</Link>)}
        </p>
        <p className={row}>
          <Link href={href({ cp: "" })} className={!options.checkpoint ? "underline" : ""}>{options.lod} file</Link>
          {CHECKPOINTS.map((c) => <Link key={c} href={href({ cp: String(c) })} className={c === options.checkpoint ? "underline" : ""}>{c}k</Link>)}
        </p>
        <p className={row}>
          <Link href={href({ bg: options.bg === "grey" ? "none" : "grey" })}>backdrop: {options.bg}</Link>
          <Link href={href({ ao: options.ao ? "0" : "1" })}>AO: {options.ao ? "on" : "off"}</Link>
          {(["hero", "budget", "phone", "raw"] as const).map((l) => <Link key={l} href={href({ lod: l })} className={l === options.lod ? "underline" : ""}>{l}</Link>)}
          <Link href={href({ shadow: options.shadow === "baked" ? "live" : "baked" })}>shadow: {options.shadow}</Link>
        </p>
      </nav>
    </>
  );
}
