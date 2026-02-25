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
        What Is The UCL Replacement Spot?
      </summary>
      <div className="mt-3">
        <p>
          A UCL replacement spot (often called the titleholder replacement spot) is what happens when
          the Champions League winner&apos;s automatic place for next season becomes unused.
        </p>
        <p className="mt-2 font-medium text-slate-100">How it works:</p>
        <p className="mt-1">
          The UCL winner is guaranteed a place in next season&apos;s Champions League league phase. If
          the UCL winner already qualifies via their domestic league, then their titleholder place is
          not needed. That freed-up place is reallocated by UEFA to another club according to the entry
          rules, typically to the highest-ranked domestic champion by UEFA club coefficient who would
          otherwise start in qualifying (Champions Path).
        </p>
      </div>
    </details>
  );
}
