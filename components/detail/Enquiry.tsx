"use client";

// The enquiry sidebar placeholder (docs/overhaul.md step 5): a mock form, M11's first live use. Nothing is
// sent — submitting swaps the form for a thank-you state. Opened by section E's "Inquire about this car
// here →" or, once per visit, by scrolling section E 40% into view (both wired from Detail.tsx).
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CarWithAssets } from "@/lib/cars";
import gsap from "gsap";
import { sidebar } from "@/lib/detail-fx";
import { ease, effect } from "@/lib/detail-motion";
import { enquiryMessage } from "@/lib/format";

interface Fields {
  name: string;
  email: string;
  phone: string;
  message: string;
}
type FieldErrors = Partial<Record<keyof Fields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d][\d\s()+-]{5,}$/;

function validate(fields: Fields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.name.trim()) errors.name = "Enter your name.";
  if (!fields.email.trim()) errors.email = "Enter your email.";
  else if (!EMAIL_RE.test(fields.email.trim())) errors.email = "Enter a valid email address.";
  if (fields.phone.trim() && !PHONE_RE.test(fields.phone.trim())) errors.phone = "Enter a valid phone number.";
  if (!fields.message.trim()) errors.message = "Enter a message.";
  return errors;
}

/**
 * `modal`: opened by "Inquire about this car here →" — scrim, focus into Name, Tab trapped. Otherwise it is the
 * scroll-triggered open (user, 6h): no scrim, no `aria-modal`, focus left where it is and the page behind still
 * live, so the finale (frame 14) stays visible beside the panel instead of dimmed under it.
 */
export function Enquiry({ car, open, modal, onClose }: { car: CarWithAssets; open: boolean; modal: boolean; onClose: () => void }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  /** True while the panel is on screen, so switching a non-modal open to modal adds the scrim instead of
   * sliding the panel in again. */
  const shown = useRef(false);
  /** Where focus was when the panel opened, so closing hands it back (6h: it fell to <body>, and the next Tab
   * started over from the top of the page). */
  const opener = useRef<HTMLElement | null>(null);
  const [fields, setFields] = useState<Fields>({ name: "", email: "", phone: "", message: enquiryMessage(car) });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  // `useLayoutEffect`, not `useEffect`: the panel's hidden starting position comes entirely from GSAP's own
  // `gsap.set`/`fromTo` (inside `sidebar()`), not a hardcoded inline `transform` in the JSX below — GSAP
  // decomposes `xPercent` into its own internal px/percent cache, and if it first reads an *existing* raw CSS
  // `transform: translateX(100%)` written by React, it bakes that as a fixed pixel offset separate from the
  // `xPercent` it then animates, so the percentage term tweens correctly while a frozen px term holds the
  // element in place forever (found by testing: the open tween visibly ran, yet the panel never moved).
  // Without a transform already in the JSX, GSAP must be the one to set it before the first paint, or the
  // panel would flash fully visible for a frame — hence layout effect, not effect.
  useLayoutEffect(() => {
    const panelEl = panel.current;
    const scrimEl = scrim.current;
    if (!panelEl || !scrimEl) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { open: openTween, close } = sidebar(panelEl, scrimEl, reduced, modal);
    if (open) {
      wasOpen.current = true;
      const active = document.activeElement as HTMLElement | null;
      opener.current = active && active !== document.body && !panelEl.contains(active) ? active : null;
      if (!shown.current) openTween.play(0);
      else {
        // Already on screen (a non-modal open, now opened by the button): building the tweens above re-applied
        // the hidden starting state, so jump the panel back to open and fade only the scrim in.
        openTween.progress(1);
        if (modal) gsap.fromTo(scrimEl, { opacity: 0 }, { opacity: effect.sidebar.scrimOpacity, duration: effect.sidebar.scrimDuration, ease: ease.fade });
      }
      shown.current = true;
      // Only when opened by the button: the scroll-triggered auto-open (step 3, section E 40% into view)
      // must not also steal keyboard focus into the name field — that's an unrequested context change
      // (WCAG 3.2.5) and it silently broke the page's own Home/End section-stepping, since the keyboard
      // handler correctly ignores its shortcuts while focus sits in a text field (found by the smoke test).
      if (modal) nameInput.current?.focus();
    } else if (wasOpen.current) {
      shown.current = false;
      const active = document.activeElement;
      if (!active || active === document.body || panelEl.contains(active)) opener.current?.focus({ preventScroll: true });
      close.play(0);
    }
    return () => {
      openTween.kill();
      close.kill();
    };
  }, [open, modal]);

  useEffect(() => {
    if (!open) return;
    // Capture phase, stopped here: see the identical comment in Gallery.tsx — without it, Experience.tsx's
    // own Escape-leaves-the-detail-page listener (bubble phase, window) would fire on the same keystroke.
    // Also traps Tab inside the panel: `role="dialog" aria-modal="true"` promises exactly this (the APG
    // dialog pattern), but nothing enforced it — found live-testing: Tab from "Send enquiry" left the panel
    // for the Next.js dev portal and then the page body, while the rest of the page sat behind a scrim.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !modal) return;
      const panelEl = panel.current;
      if (!panelEl) return;
      const focusable = Array.from(panelEl.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      // Focus still outside the panel: the first Tab enters the dialog rather than walking the page behind the
      // scrim, which `aria-modal` says is unreachable (6h).
      if (!panelEl.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [open, modal, onClose]);

  // A fresh form (and focus) each time the sidebar opens for a new car; `open` resets on every mount of
  // `Page` anyway (Detail.tsx's `key={car.slug}`), but the sidebar component itself persists across opens
  // within one car's visit, so the thank-you state shouldn't linger after a close/reopen.
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => {
      setSent(false);
      setErrors({});
    }, 600);
    return () => clearTimeout(id);
  }, [open]);

  const onBlur = (key: keyof Fields) => {
    setErrors((prev) => ({ ...prev, [key]: validate(fields)[key] }));
  };
  const onChange = (key: keyof Fields, value: string) => setFields((prev) => ({ ...prev, [key]: value }));
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate(fields);
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true);
  };

  return (
    <div aria-hidden={!open} inert={!open} className="fixed inset-0 z-50" style={{ pointerEvents: open && modal ? "auto" : "none" }}>
      <div ref={scrim} onClick={onClose} className="absolute inset-0" style={{ opacity: 0, background: "var(--color-ink)" }} />
      <div
        ref={panel}
        role="dialog"
        aria-modal={modal}
        aria-labelledby={titleId}
        data-tone="light"
        className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto"
        style={{ maxWidth: 420, background: "var(--color-paper)", pointerEvents: open ? "auto" : "none" }}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-5" style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-ink) 14%, transparent)" }}>
          <h2 id={titleId} className="font-display" style={{ fontSize: "max(16px, calc(22 * var(--u)))" }}>
            Inquire about this car
          </h2>
          <button ref={closeBtn} type="button" onClick={onClose} className="detail-pill">
            Close <span aria-hidden>×</span>
          </button>
        </div>
        <div className="flex-1 px-6 py-6">
          {sent ? (
            <div>
              <p style={{ fontSize: "max(14px, var(--type-body))", lineHeight: 1.5 }}>
                Thanks, {fields.name.trim().split(" ")[0]}. This is a concept, so no one will reply, but the car is still here.
              </p>
              <button type="button" onClick={onClose} className="detail-pill mt-6">
                Back to the car
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <Field label="Name" error={errors.name} errorId="enquiry-name-error">
                <input
                  ref={nameInput}
                  type="text"
                  autoComplete="name"
                  value={fields.name}
                  onChange={(event) => onChange("name", event.target.value)}
                  onBlur={() => onBlur("name")}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "enquiry-name-error" : undefined}
                  className="enquiry-input"
                />
              </Field>
              <Field label="Email" error={errors.email} errorId="enquiry-email-error">
                <input
                  type="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  onBlur={() => onBlur("email")}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "enquiry-email-error" : undefined}
                  className="enquiry-input"
                />
              </Field>
              <Field label="Phone (optional)" error={errors.phone} errorId="enquiry-phone-error">
                <input
                  type="tel"
                  autoComplete="tel"
                  value={fields.phone}
                  onChange={(event) => onChange("phone", event.target.value)}
                  onBlur={() => onBlur("phone")}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "enquiry-phone-error" : undefined}
                  className="enquiry-input"
                />
              </Field>
              <Field label="Message" error={errors.message} errorId="enquiry-message-error">
                <textarea
                  rows={4}
                  value={fields.message}
                  onChange={(event) => onChange("message", event.target.value)}
                  onBlur={() => onBlur("message")}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "enquiry-message-error" : undefined}
                  className="enquiry-input"
                />
              </Field>
              <button type="submit" className="detail-pill mt-2">
                Send enquiry
              </button>
              {/* 75%, not 60% (6h): 60% measured 4.03:1 on the figma theme's paper, under AA. */}
              <p className="mt-3" style={{ fontSize: "max(11px, var(--type-label))", color: "color-mix(in srgb, var(--color-ink) 75%, transparent)" }}>
                This is a concept: nothing will be sent, and no one will reply.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/** The input is nested inside the `<label>` (implicit association), so only the error's id needs to be
 * stable — passed in so the caller's input can reference it with `aria-describedby`. One `Enquiry` is ever
 * mounted at a time (Detail.tsx's `key={car.slug}` remounts the whole page on a car change), so a plain
 * string id per field never collides. */
function Field({ label, error, errorId, children }: { label: string; error?: string; errorId: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="detail-label mb-1 block">{label}</span>
      {children}
      {/* Always rendered, at a fixed height: an error appearing or clearing must not reflow the form —
          verified this was a real problem, not a hypothetical one: a field's blur-triggered error clearing
          right as the pointer reaches "Send enquiry" shifted the button out from under it, dropping the
          click. */}
      <span
        id={errorId}
        role="alert"
        className="mt-1 block"
        style={{ fontSize: "max(11px, var(--type-label))", lineHeight: 1.3, minHeight: "calc(1.3 * max(11px, var(--type-label)))", color: "var(--color-signal-text)" }}
      >
        {error}
      </span>
    </label>
  );
}
