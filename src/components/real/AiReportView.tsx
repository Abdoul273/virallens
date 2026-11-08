import { forwardRef, useEffect, useState, type ReactNode } from "react";
import { Copy, Hash, Search } from "lucide-react";
import { ActionPlan } from "@/components/report/ActionPlan";
import { DiagnosisList } from "@/components/report/DiagnosisList";
import { EditPlan } from "@/components/report/EditPlan";
import { HookCard } from "@/components/report/HookCard";
import { ScoreGrid } from "@/components/report/ScoreGrid";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { VideoAiReport } from "@/types";

export const AI_SECTIONS = [
  { id: "diagnostic", label: "Diagnostic" },
  { id: "hook", label: "Accroche" },
  { id: "scores", label: "Scores" },
  { id: "actions", label: "Plan d’action" },
  { id: "caption", label: "Légende" },
  { id: "edit", label: "Remontage" },
  { id: "stats", label: "Stats" },
];

export function ReportSection({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-36" aria-labelledby={`${id}-t`}>
      <div className="mb-4">
        <h2 id={`${id}-t`} className="text-xl font-bold tracking-tight text-fg md:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/** Local <video> player for the session file; parent seeks it through the ref. */
export const LocalPlayer = forwardRef<HTMLVideoElement, { file: File }>(function LocalPlayer(
  { file },
  ref,
) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <video
      ref={ref}
      src={url}
      controls
      playsInline
      preload="metadata"
      className="aspect-[9/16] w-full rounded-xl bg-black object-contain"
    />
  );
});

/** Sticky section tabs (same pattern as the demo report). */
export function SectionTabs() {
  const [active, setActive] = useState(AI_SECTIONS[0].id);
  useEffect(() => {
    const onScroll = () => {
      let cur = AI_SECTIONS[0].id;
      for (const s of AI_SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top < 160) cur = s.id;
      }
      setActive(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="no-print sticky top-16 z-20 -mx-4 border-b border-line bg-bg/85 px-4 backdrop-blur-xl md:-mx-8 md:px-8">
      <div className="no-scrollbar flex gap-1 overflow-x-auto" aria-label="Sections du rapport">
        {AI_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(
              "relative flex h-12 shrink-0 items-center px-3 text-sm font-medium whitespace-nowrap transition",
              active === s.id ? "text-fg" : "text-subtle hover:text-fg",
            )}
          >
            {s.label}
            {active === s.id && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

/** All sections of a real AI report. `player` is rendered next to the diagnoses. */
export function AiReportSections({
  report,
  currentCaption,
  player,
  onSeek,
}: {
  report: VideoAiReport;
  currentCaption: string;
  player: ReactNode;
  onSeek: (t: number) => void;
}) {
  const toast = useToast();
  const copy = async (text: string, title: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ tone: "success", title });
    } catch {
      toast({ tone: "error", title: "Copie impossible" });
    }
  };
  const duration = report.durationSec ?? Math.max(1, ...report.editPlan.map((s) => s.t + 1));

  return (
    <div className="space-y-12">
      <ReportSection
        id="diagnostic"
        title="Pourquoi ça ne marche pas"
        subtitle="Classé par probabilité. Touche un horodatage pour aller au moment précis."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          <DiagnosisList items={report.diagnoses} onSeek={onSeek} />
          <div className="order-first mx-auto w-44 lg:order-none lg:w-full">
            <div className="lg:sticky lg:top-32">{player}</div>
          </div>
        </div>
      </ReportSection>

      <ReportSection
        id="hook"
        title="Les 3 premières secondes"
        subtitle={report.hook.assessment || undefined}
      >
        {report.hook.frames.length || report.hook.proposals.length ? (
          <HookCard frames={report.hook.frames} proposals={report.hook.proposals} />
        ) : (
          <p className="text-sm text-muted">Gemini n’a pas détaillé l’accroche.</p>
        )}
      </ReportSection>

      <ReportSection id="scores" title="Scores détaillés">
        {report.subScores.length ? (
          <ScoreGrid items={report.subScores} />
        ) : (
          <p className="text-sm text-muted">Aucun sous-score renvoyé.</p>
        )}
      </ReportSection>

      <ReportSection
        id="actions"
        title="Plan d’action"
        subtitle="Classé par rapport impact / effort. Coche au fur et à mesure."
      >
        {report.actions.length ? (
          <ActionPlan items={report.actions} />
        ) : (
          <p className="text-sm text-muted">Aucune action proposée.</p>
        )}
      </ReportSection>

      <ReportSection id="caption" title="Légende et SEO">
        <Card className="space-y-4">
          {currentCaption && (
            <div>
              <p className="text-xs font-semibold tracking-wider text-subtle uppercase">Actuelle</p>
              <p className="mt-1 text-sm text-muted">{currentCaption}</p>
            </div>
          )}
          {report.caption.suggested && (
            <div className="rounded-xl border border-accent/25 bg-accent/[0.06] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold tracking-wider text-accent uppercase">
                  Suggérée
                </p>
                <button
                  onClick={() =>
                    copy(
                      [report.caption.suggested, report.caption.hashtags.join(" ")]
                        .filter(Boolean)
                        .join(" "),
                      "Légende copiée",
                    )
                  }
                  className="-mt-2 -mr-2 grid size-10 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg"
                  aria-label="Copier la légende suggérée"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <p className="mt-1 text-[15px] font-medium text-fg">{report.caption.suggested}</p>
            </div>
          )}
          {report.caption.hashtags.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
                <Hash className="size-4 text-accent" /> Hashtags
              </p>
              <div className="flex flex-wrap gap-2">
                {report.caption.hashtags.map((h) => (
                  <Tag key={h}>{h}</Tag>
                ))}
              </div>
            </div>
          )}
          {report.caption.keywords.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
                <Search className="size-4 text-accent" /> Mots-clés de recherche
              </p>
              <div className="flex flex-wrap gap-2">
                {report.caption.keywords.map((k) => (
                  <Tag key={k}>{k}</Tag>
                ))}
              </div>
            </div>
          )}
        </Card>
      </ReportSection>

      <ReportSection
        id="edit"
        title="Plan de remontage"
        subtitle="Les modifications à faire dans ton éditeur, dans l’ordre de la vidéo."
      >
        {report.editPlan.length ? (
          <EditPlan steps={report.editPlan} duration={duration} onSeek={onSeek} />
        ) : (
          <p className="text-sm text-muted">Aucune étape de remontage proposée.</p>
        )}
      </ReportSection>
    </div>
  );
}

export function reportToText(title: string, r: VideoAiReport): string {
  return [
    `ViralLens — Rapport : ${title}`,
    `Score global : ${r.globalScore}/100`,
    `Verdict : ${r.verdict}`,
    "",
    "Pourquoi ça ne marche pas :",
    ...r.diagnoses.map(
      (d, i) =>
        `${i + 1}. ${d.title} (${d.probability} %)${d.evidence.length ? ` — ${d.evidence.map((e) => e.label).join(" ; ")}` : ""}`,
    ),
    "",
    "Plan d’action :",
    ...r.actions.map((a) => `- ${a.title} [impact ${a.impact}, effort ${a.effort}]`),
    "",
    "Remontage :",
    ...r.editPlan.map(
      (s) =>
        `- ${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, "0")} ${s.title}`,
    ),
    "",
    r.caption.suggested
      ? `Légende suggérée : ${r.caption.suggested} ${r.caption.hashtags.join(" ")}`
      : "",
    `Modèle : ${r.model}`,
  ]
    .filter((l, i, all) => l !== "" || all[i - 1] !== "")
    .join("\n");
}
