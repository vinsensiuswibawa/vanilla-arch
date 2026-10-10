import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TokenValue } from "@/components/lab/TokenHex";
import { ease } from "@/lib/detail-motion";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const COLORS = [
  ["paper", "--color-paper"],
  ["ink", "--color-ink"],
  ["night", "--color-night"],
  ["mist-100", "--color-mist-100"],
  ["mist-200", "--color-mist-200"],
  ["mist-300", "--color-mist-300"],
  ["mist-500", "--color-mist-500"],
  ["mist-700", "--color-mist-700"],
  ["field", "--color-field"],
  ["panel", "--color-panel"],
  ["card", "--color-card"],
  ["signal", "--color-signal"],
] as const;

const SCALE = [
  ["hero", "--type-hero"],
  ["enquiry", "--type-enquiry"],
  ["headline", "--type-headline"],
  ["summary", "--type-summary"],
  ["price", "--type-price"],
  ["bar value", "--type-bar-value"],
  ["spec", "--type-spec"],
  ["body", "--type-body"],
  ["label", "--type-label"],
] as const;

const EASES = [
  ["reveal", "--ease-reveal"],
  ["settle", "--ease-settle"],
  ["travel", "--ease-travel"],
  ["swap", "--ease-swap"],
  ["fade", "--ease-fade"],
  ["leave", "--ease-leave"],
] as const;

const displayStyle = {
  textTransform: "var(--display-case)",
  fontWeight: "var(--display-weight)",
  letterSpacing: "var(--display-tracking)",
  lineHeight: "var(--display-leading)",
} as React.CSSProperties;

const labelStyle = { textTransform: "var(--label-case)", letterSpacing: "var(--label-tracking)" } as React.CSSProperties;

function Sheet({ theme }: { theme: "current" | "figma" }) {
  return (
    <section data-theme={theme} className="min-w-0 space-y-10 bg-paper p-6 font-text text-ink">
      <header className="flex items-baseline justify-between border-b border-mist-300 pb-3">
        <h2 className="font-condensed text-2xl" style={labelStyle}>
          theme: {theme}
        </h2>
        <p className="font-mono text-xs text-mist-700">?theme={theme}</p>
      </header>

      <div>
        <h3 className="mb-3 font-condensed text-sm text-mist-700" style={labelStyle}>
          Colour
        </h3>
        <ul className="grid grid-cols-3 gap-3">
          {COLORS.map(([name, token]) => (
            <li key={name} className="text-xs">
              <div className="h-14 border border-mist-300" style={{ background: `var(${token})` }} />
              <p className="mt-1">{name}</p>
              <p className="font-mono text-mist-700">
                <TokenValue name={token} />
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <p className="bg-paper p-3 text-ink ring-1 ring-mist-300">ink on paper</p>
          <p className="bg-paper p-3 text-mist-700 ring-1 ring-mist-300">mist-700 on paper</p>
          <p className="bg-field p-3 text-ink">ink on field</p>
          <p className="bg-card p-3 text-ink">ink on card</p>
          <p className="bg-panel p-3 text-paper">paper on panel</p>
          <p className="bg-panel p-3 text-mist-300">mist-300 on panel</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-condensed text-sm text-mist-700" style={labelStyle}>
          Type
        </h3>
        <div className="space-y-5">
          <div>
            <p className="font-display" style={{ ...displayStyle, fontSize: "calc(var(--type-hero) / 2)" }}>
              911
              <br />
              Turbo
            </p>
            <p className="mt-1 font-mono text-xs text-mist-700">car name, shown at half size</p>
          </div>
          <div>
            <p className="font-display" style={{ ...displayStyle, fontSize: "calc(var(--type-headline) / 2)" }}>
              The benchmark for all that followed.
            </p>
            <p className="mt-1 font-mono text-xs text-mist-700">section headline, half size</p>
          </div>
          <p className="font-text" style={{ fontSize: "calc(var(--type-summary) / 2)", lineHeight: 1.1 }}>
            A three-litre Turbo in Copper Brown over tan, matching numbers.
          </p>
          <p className="font-condensed" style={{ ...labelStyle, fontSize: "calc(var(--type-label) * 1.4)" }}>
            Listed car specifications · Porsche · 1976
          </p>
          <p className="font-text" style={{ fontSize: "var(--type-body)" }}>
            Early three-litre cars are the purest Turbos and the rarest. This one has had the expensive work done.
          </p>
          <p className="font-mono" style={{ fontSize: "var(--type-bar-value)" }}>
            $245,000 · 12,400 mi
            <br />
            $111,111 · 88,888 mi
          </p>
        </div>
        <table className="mt-5 w-full text-xs">
          <tbody>
            {SCALE.map(([name, token]) => (
              <tr key={name} className="border-t border-mist-300">
                <td className="py-1">{name}</td>
                <td className="py-1 text-right font-mono text-mist-700">
                  <TokenValue name={token} length />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-3 font-condensed text-sm text-mist-700" style={labelStyle}>
          Motion
        </h3>
        <table className="w-full text-xs">
          <tbody>
            {EASES.map(([name, token]) => (
              <tr key={name} className="border-t border-mist-300">
                <td className="py-1">{name}</td>
                <td className="py-1 font-mono text-mist-700">{ease[name]}</td>
                <td className="py-1 text-right font-mono text-mist-700">
                  <TokenValue name={token} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Dev-only token sheet for the two themes (docs/overhaul.md, shot 6a). Production builds return 404
// unless ARCADE_STUDIO=1 is set, as for /lab/<slug>.
export default function TokensPage() {
  if (process.env.NODE_ENV === "production" && process.env.ARCADE_STUDIO !== "1") notFound();
  return (
    <main className="bg-mist-200">
      <div className="grid grid-cols-2 gap-px">
        <Sheet theme="current" />
        <Sheet theme="figma" />
      </div>
      <section className="space-y-2 bg-paper p-6">
        <h2 className="font-condensed text-sm text-mist-700" style={labelStyle}>
          Grid (shared): five columns, 24 px margins and gutters; <span className="font-mono normal-case">--u</span> is one Figma pixel
        </h2>
        <div className="grid h-16 grid-cols-5 gap-6 px-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="grid place-items-center bg-field font-mono text-xs">
              col {n}
            </div>
          ))}
        </div>
        <p className="font-mono text-xs text-mist-700">
          --u <TokenValue name="--u" length /> · --col <TokenValue name="--col" length /> · --col-2 <TokenValue name="--col-2" length /> ·
          --col-5 <TokenValue name="--col-5" length />
        </p>
      </section>
    </main>
  );
}
