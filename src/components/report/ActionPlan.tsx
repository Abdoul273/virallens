import { useState } from "react";
import { EffortBadge, ImpactBadge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { ProgressBar } from "@/components/ui/Stepper";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types";

export function ActionPlan({ items }: { items: ActionItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const count = Object.values(done).filter(Boolean).length;
  return (
    <div className="glass rounded-2xl p-4 md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar
          value={(count / Math.max(items.length, 1)) * 100}
          tone="success"
          className="flex-1"
          label="Actions terminées"
        />
        <span className="tabular text-sm font-semibold text-fg">
          {count}/{items.length}
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((a, i) => (
          <li key={a.id} className="flex items-start gap-2 py-2.5">
            <Checkbox
              checked={!!done[a.id]}
              onChange={(v) => setDone({ ...done, [a.id]: v })}
              label={a.title}
              className="-ml-2"
            />
            <div className={cn("min-w-0 flex-1 pt-2 transition", done[a.id] && "opacity-50")}>
              <p className={cn("text-[15px] font-medium text-fg", done[a.id] && "line-through")}>
                <span className="tabular mr-1.5 text-subtle">{i + 1}.</span>
                {a.title}
              </p>
              <p className="mt-0.5 text-sm text-muted">{a.detail}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ImpactBadge level={a.impact} />
                <EffortBadge level={a.effort} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
