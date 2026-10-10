import { Fragment } from "react";
import type { Car } from "@/lib/cars";
import { carName } from "@/lib/format";

/**
 * A car's name that never breaks inside a hyphenated word ("GT-R", "V-spec", "RX-7"). Bodoni's
 * hairline hyphen all but vanishes at label sizes ("RX 7"), so hyphens are set in the text face,
 * where they hold their weight next to the Didone.
 */
export function CarName({ car }: { car: Car }) {
  return carName(car)
    .split(" ")
    .map((word, index) => (
      <Fragment key={index}>
        {index > 0 && " "}
        {word.includes("-") ? (
          <span className="whitespace-nowrap">
            {word.split("-").map((part, at) => (
              <Fragment key={at}>
                {at > 0 && <span className="font-text font-medium">-</span>}
                {part}
              </Fragment>
            ))}
          </span>
        ) : (
          word
        )}
      </Fragment>
    ));
}
