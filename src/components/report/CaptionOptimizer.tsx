import { Check, Copy, Hash, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";
import type { CaptionOptimization } from "@/types";

export function CaptionOptimizer({ data }: { data: CaptionOptimization }) {
  const toast = useToast();
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text);
    toast({ tone: "success", title: `${what} copié${what === "Légende" ? "e" : "s"}` });
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-2xl border border-danger/25 bg-danger/[0.05] p-4">
          <p className="text-xs font-semibold tracking-wider text-danger uppercase">Actuelle</p>
          <p className="mt-2 text-[15px] text-muted line-through decoration-danger/50">
            {data.current}
          </p>
        </div>
        <div className="rounded-2xl border border-success/30 bg-success/[0.06] p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-success uppercase">
              <Check className="size-3.5" /> Suggérée
            </p>
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy className="size-4" />}
              onClick={() => copy(`${data.suggested}\n${data.hashtags.join(" ")}`, "Légende")}
            >
              Copier
            </Button>
          </div>
          <p className="mt-1 text-[15px] leading-relaxed text-fg">{data.suggested}</p>
          <p className="mt-2 text-[15px] font-medium text-accent">{data.hashtags.join(" ")}</p>
        </div>
      </div>
      <div className="glass space-y-5 rounded-2xl p-4 md:p-5">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
            <Hash className="size-4 text-accent" /> Hashtags suggérés
          </p>
          <div className="flex flex-wrap gap-2">
            {data.hashtags.map((h) => (
              <Tag key={h}>{h}</Tag>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg">
            <Search className="size-4 text-accent" /> Mots-clés de recherche
          </p>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((k) => (
              <Tag key={k}>{k}</Tag>
            ))}
          </div>
          <p className="mt-3 text-xs text-subtle">
            À dire à l’oral et à écrire à l’écran : TikTok indexe aussi la voix et le texte.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Copy className="size-4" />}
          onClick={() => copy(data.keywords.join(", "), "Mots-clés")}
        >
          Copier les mots-clés
        </Button>
      </div>
    </div>
  );
}
