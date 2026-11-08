import { useState, type ReactNode } from "react";
import { Inbox, Plus, Sparkles, Trash2 } from "lucide-react";
import { BarList } from "@/components/charts/BarList";
import { RadarChart } from "@/components/charts/RadarChart";
import { RetentionChart } from "@/components/charts/RetentionChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { ChatBubble, TypingIndicator } from "@/components/report/CoachChat";
import {
  Badge,
  ConfidenceBadge,
  EffortBadge,
  ImpactBadge,
  InsufficientDataBadge,
  ScoreBadge,
  SeverityBadge,
} from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EvidenceChip, FilterChip, Tag } from "@/components/ui/Chip";
import { Dropzone } from "@/components/ui/Dropzone";
import { Field, Input, LabeledInput, Select, Textarea } from "@/components/ui/Field";
import { MetricCard } from "@/components/ui/MetricCard";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Segmented } from "@/components/ui/Segmented";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { Stepper } from "@/components/ui/Stepper";
import { ToastView, useToast } from "@/components/ui/Toast";
import { REPORT } from "@/data/mockData";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-line pb-3 text-xs font-semibold tracking-wider text-subtle uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

const COLORS = [
  ["Fond", "--bg"],
  ["Fond doux", "--bg-soft"],
  ["Surface", "--solid"],
  ["Texte", "--fg"],
  ["Texte secondaire", "--muted"],
  ["Texte discret", "--subtle"],
  ["Accent rose", "--accent"],
  ["Accent violet", "--accent-2"],
  ["Succès", "--success"],
  ["Alerte", "--warning"],
  ["Danger", "--danger"],
  ["Info", "--info"],
];
const TYPE = [
  ["Display", "text-5xl font-extrabold tracking-tight", "48 / 800"],
  ["Métrique", "text-4xl font-bold tracking-tight tabular", "36 / 700"],
  ["Titre 1", "text-3xl font-bold tracking-tight", "30 / 700"],
  ["Titre 2", "text-2xl font-bold tracking-tight", "24 / 700"],
  ["Titre 3", "text-base font-semibold", "16 / 600"],
  ["Corps", "text-[15px]", "15 / 400"],
  ["Petit", "text-sm text-muted", "14 / 400"],
  ["Légende", "text-xs font-semibold tracking-wider uppercase text-subtle", "12 / 600"],
];

export function DesignSystem() {
  const toast = useToast();
  const [seg, setSeg] = useState<"a" | "b">("a");
  const [t, setT] = useState(11);
  return (
    <div className="space-y-12 animate-fade-up">
      <div>
        <p className="text-xs font-semibold tracking-wider text-accent uppercase">ViralLens UI</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg md:text-4xl">
          Design system
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          Tokens, composants et états. Bascule le thème en haut à droite pour vérifier les deux
          modes.
        </p>
      </div>

      <Block title="Couleurs">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COLORS.map(([n, v]) => (
            <div key={v} className="overflow-hidden rounded-2xl border border-line">
              <div className="h-16" style={{ background: `var(${v})` }} />
              <div className="bg-surface p-2.5">
                <p className="text-sm font-medium text-fg">{n}</p>
                <p className="font-mono text-xs text-subtle">{v}</p>
              </div>
            </div>
          ))}
          <div className="col-span-2 overflow-hidden rounded-2xl border border-line">
            <div className="h-16 bg-brand" />
            <div className="bg-surface p-2.5">
              <p className="text-sm font-medium text-fg">Dégradé de marque</p>
              <p className="font-mono text-xs text-subtle">#D90F70 → #7C3AED</p>
            </div>
          </div>
        </div>
      </Block>

      <Block title="Typographie · Inter">
        <div className="glass divide-y divide-line rounded-2xl">
          {TYPE.map(([n, cls, spec]) => (
            <div key={n} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <span className={`${cls} truncate text-fg`}>{n === "Métrique" ? "12,4 k" : n}</span>
              <span className="shrink-0 font-mono text-xs text-subtle">{spec}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button icon={<Plus className="size-4" />}>Principal</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="ghost">Discret</Button>
          <Button variant="danger" icon={<Trash2 className="size-4" />}>
            Danger
          </Button>
          <Button loading>Chargement</Button>
          <Button disabled>Désactivé</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" icon={<Sparkles className="size-5" />}>
            Grand · 56px
          </Button>
          <Button size="md">Moyen · 44px</Button>
          <Button size="sm" variant="secondary">
            Petit · 40px
          </Button>
          <Button size="icon" variant="secondary" aria-label="Ajouter">
            <Plus className="size-5" />
          </Button>
        </div>
      </Block>

      <Block title="Champs">
        <div className="grid gap-4 md:grid-cols-2">
          <LabeledInput label="Champ texte" placeholder="Placeholder" hint="Texte d’aide" />
          <LabeledInput label="Avec erreur" defaultValue="abc" error="Ce champ est invalide." />
          <LabeledInput label="Avec suffixe" type="number" defaultValue={9} suffix="%" />
          <Field label="Liste" htmlFor="ds-sel">
            <Select id="ds-sel">
              <option>Option 1</option>
              <option>Option 2</option>
            </Select>
          </Field>
          <Field label="Zone de texte" htmlFor="ds-ta">
            <Textarea id="ds-ta" placeholder="Colle ici…" />
          </Field>
          <div className="space-y-4">
            <Field label="Contrôle segmenté">
              <Segmented
                label="Démo"
                value={seg}
                onChange={setSeg}
                options={[
                  { value: "a", label: "Grille" },
                  { value: "b", label: "Liste" },
                ]}
              />
            </Field>
            <Input placeholder="Champ seul" aria-label="Champ seul" />
          </div>
        </div>
        <Dropzone
          accept="video/*"
          onFiles={() => toast({ tone: "success", title: "Fichier reçu" })}
          title="Zone d’import"
          subtitle="Glisser-déposer ou toucher"
          compact
        />
        <Card>
          <Stepper steps={["Ta vidéo", "Tes stats", "Contexte"]} current={1} />
        </Card>
      </Block>

      <Block title="Chips et badges">
        <div className="flex flex-wrap gap-2">
          <EvidenceChip
            evidence={{ kind: "timestamp", label: "0:11 Chute −19 pts", time: 11 }}
            onSeek={() => toast({ tone: "info", title: "Aller à 0:11" })}
          />
          <EvidenceChip evidence={{ kind: "metric", label: "42 % partent avant 3 s" }} />
          <FilterChip active>Actif</FilterChip>
          <FilterChip>Inactif</FilterChip>
          <Tag>#painmaison</Tag>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity="high" />
          <SeverityBadge severity="medium" />
          <SeverityBadge severity="low" />
          <ConfidenceBadge level="low" />
          <ConfidenceBadge level="medium" />
          <ConfidenceBadge level="high" />
          <ImpactBadge level="fort" />
          <EffortBadge level="faible" />
          <InsufficientDataBadge />
          <ScoreBadge score={82} />
          <ScoreBadge score={58} />
          <ScoreBadge score={31} />
          <Badge tone="accent">Nouveau</Badge>
        </div>
      </Block>

      <Block title="Score rings">
        <div className="flex flex-wrap items-end gap-6">
          <ScoreRing value={64} size={148} color="brand" label="sur 100" />
          <ScoreRing value={82} size={96} label="Top" />
          <ScoreRing value={58} size={96} label="Moyen" />
          <ScoreRing value={31} size={96} label="Faible" />
          <ScoreRing value={76} size={56} />
          <ScoreRing value={44} size={40} />
        </div>
      </Block>

      <Block title="Cartes">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Vues médianes"
            value="12,4"
            unit="k"
            delta={18}
            deltaLabel="+18 %"
            hint="vs 30 jours précédents"
            spark={[6, 7, 5, 9, 8, 11, 12]}
          />
          <MetricCard
            label="Rétention médiane"
            value="38"
            unit="%"
            delta={-4}
            deltaLabel="−4 pts"
            spark={[44, 42, 43, 40, 41, 39, 38]}
          />
          <Card>
            <CardHeader
              title="Carte verre"
              subtitle="Surface translucide, bordure 1px, rayon 16px"
              icon={<Sparkles className="size-5" />}
            />
            <p className="text-sm text-muted">Contenu de la carte.</p>
          </Card>
        </div>
      </Block>

      <Block title="Graphiques">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Rétention"
              subtitle="Ligne en dégradé, zone de décrochage en rouge"
            />
            <RetentionChart
              data={REPORT.retention}
              duration={REPORT.durationSec}
              dropOffAt={REPORT.dropOffAt}
              currentTime={t}
              onSeek={setT}
              height={180}
            />
          </Card>
          <Card>
            <CardHeader title="Radar" subtitle="Rose = toi, bleu = comparaison" />
            <RadarChart
              axes={["Hook", "Rythme", "Clarté", "Émotion", "Partage", "SEO"]}
              series={[
                { label: "A", values: [31, 44, 68, 52, 39, 28], color: "#ff4d94" },
                { label: "B", values: [88, 79, 64, 70, 81, 66], color: "#60a5fa" },
              ]}
              size={260}
            />
          </Card>
          <Card>
            <CardHeader title="Barres" />
            <BarList
              items={[
                { label: "Résultat d’abord", value: 84 },
                { label: "Question", value: 41 },
                { label: "Présentation", value: 3, highlight: "bad" },
              ]}
              format={(v) => `${v} k`}
            />
          </Card>
          <Card>
            <CardHeader title="Sparklines" />
            <div className="flex gap-6">
              <Sparkline data={[1, 3, 2, 5, 4, 7]} width={120} height={40} />
              <Sparkline data={[7, 5, 6, 3, 4, 2]} positive={false} width={120} height={40} />
            </div>
          </Card>
        </div>
      </Block>

      <Block title="Chat et notifications">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <ChatBubble
              message={{ id: "1", role: "coach", text: "Ouvre sur le pain qui craque." }}
            />
            <ChatBubble message={{ id: "2", role: "user", text: "Et pour la musique ?" }} />
            <TypingIndicator />
          </Card>
          <div className="space-y-2">
            <ToastView
              t={{ tone: "success", title: "Rapport copié", body: "Colle-le où tu veux." }}
            />
            <ToastView t={{ tone: "error", title: "Clé invalide" }} />
            <ToastView t={{ tone: "info", title: "Analyse lancée" }} />
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast({
                  tone: "success",
                  title: "Ceci est un toast",
                  body: "Il disparaît après 3,6 s.",
                })
              }
            >
              Déclencher un toast
            </Button>
          </div>
        </div>
      </Block>

      <Block title="États">
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState
            icon={<Inbox className="size-7" />}
            title="État vide"
            body="Explique pourquoi c’est vide et quoi faire."
            action={<Button size="sm">Action</Button>}
          />
          <SkeletonCard lines={5} className="h-full" />
          <ErrorState onRetry={() => toast({ tone: "info", title: "Nouvel essai" })} />
        </div>
      </Block>
    </div>
  );
}
