import { computeDerived, formatPct } from "@/lib/metrics";
import type { StudioStats } from "@/types";

/** Locally computed ratios. Shows "—" when an input is missing (never guessed). */
export function DerivedTiles({ stats }: { stats: StudioStats }) {
  const d = computeDerived(stats);
  const tiles = [
    { label: "Rétention moyenne", value: d.retentionPct, hint: "Visionnage moyen / durée" },
    {
      label: "Taux d’engagement",
      value: d.engagementRatePct,
      hint: "(J’aime + com. + partages + enreg.) / vues",
    },
    { label: "Taux de partage", value: d.shareRatePct, hint: "Partages / vues" },
    { label: "Taux d’enregistrement", value: d.saveRatePct, hint: "Enregistrements / vues" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-line bg-surface-2 p-3">
          <p className="text-xs font-medium text-muted">{t.label}</p>
          <p className="tabular mt-1 text-2xl font-bold tracking-tight text-fg">
            {formatPct(t.value)}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-subtle">
            {t.value === null ? "Données manquantes" : t.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
