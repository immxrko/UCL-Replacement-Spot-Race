"use client";

import { trackUmamiEvent } from "@/lib/umami";

export function UclExplainerCard() {
  return (
    <details
      className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-200"
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        trackUmamiEvent("ucl_explainer_toggle", { open: isOpen });
      }}
    >
      <summary className="cursor-pointer text-base font-semibold text-white">
        What Is The UCL Titleholder Replacement Spot?
      </summary>
      <div className="mt-3">
        <p>
         A UCL Titleholder replacement spot is a freed-up Champions League place when the UCL winner already qualifies via their league. UEFA then reassigns it to the highest-coefficient domestic champion who would otherwise start in Champions Path qualifying.
        </p>
      </div>
    </details>
  );
}
