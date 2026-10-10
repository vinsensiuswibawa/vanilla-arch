"use client";

import { useEffect, useRef, useState } from "react";

/** Prints a token's resolved value, read from the element's own theme, so the sheet cannot drift from the CSS.
 *  With `length`, the token is measured in px at the current viewport instead of printed as its formula. */
export function TokenValue({ name, length }: { name: string; length?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState("");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!length) return setValue(getComputedStyle(el).getPropertyValue(name).trim());
    const probe = document.createElement("span");
    probe.style.cssText = `position:absolute;visibility:hidden;width:var(${name})`;
    el.appendChild(probe);
    setValue(`${Math.round(probe.getBoundingClientRect().width * 100) / 100}px`);
    probe.remove();
  }, [name, length]);
  return <span ref={ref}>{value}</span>;
}
