import { BLOCKS, styleOf, type Layer } from "@/lib/detail-layout";

/**
 * Shot 6d's grey placeholders: every block of the track at its step-3 place, each declaring its tone for the
 * back pill. Hero blocks (`real: true`) render actual content elsewhere (Detail.tsx) and are skipped here;
 * sections A to E stay placeholders until 6f and 6g. Decorative, so hidden from assistive technology; the
 * page's facts are real text in the spec bar and the heading.
 */
export function Blocks({ layer }: { layer: Layer }) {
  return BLOCKS.filter((b) => b.layer === layer && !b.real).map((b) => (
    <div key={b.id} aria-hidden className={`blk blk-${b.kind}`} data-block={b.id} data-tone={b.tone} style={styleOf(b)}>
      {b.kind === "field" || b.kind === "surface" ? null : b.label}
    </div>
  ));
}
