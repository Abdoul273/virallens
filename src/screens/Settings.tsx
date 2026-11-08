import { useState } from "react";
import {
  FlaskConical,
  HardDrive,
  Lock,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import { useApp } from "@/app/AppContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import { GeminiSettingsCard } from "@/components/settings/GeminiSettingsCard";
import { ProfileSettingsCard } from "@/components/settings/ProfileSettingsCard";
import { clearModelSettings } from "@/services/modelService";
import { db } from "@/services/db";
import { errorMessage } from "@/services/errors";

export function Settings() {
  const {
    theme,
    setTheme,
    setHasData,
    navigate,
    setOnboarded,
    hasData,
    apiKey,
    setApiKey,
    demoMode,
    setDemoMode,
    bumpData,
  } = useApp();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  const deleteAll = async () => {
    try {
      await db.clear();
    } catch (e) {
      toast({ tone: "error", title: "Suppression incomplète", body: errorMessage(e) });
    }
    setApiKey("");
    clearModelSettings();
    setHasData(false);
    bumpData();
    setConfirm(false);
    toast({ tone: "success", title: "Données supprimées" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fade-up">
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-fg md:text-3xl">Réglages</h2>

      <ProfileSettingsCard />

      <GeminiSettingsCard />

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent">
              <FlaskConical className="size-5" />
            </div>
            <div>
              <label htmlFor="demo" className="text-[15px] font-semibold text-fg">
                Mode démo
              </label>
              <p className="mt-0.5 text-sm text-muted">
                {demoMode
                  ? "Activé : l’app affiche des données d’exemple. Aucun appel à Gemini."
                  : "Désactivé : uniquement tes vraies données, enregistrées dans ce navigateur."}
              </p>
            </div>
          </div>
          <Switch
            id="demo"
            checked={demoMode}
            label="Mode démo"
            onChange={(v) => {
              setDemoMode(v);
              toast({
                tone: "info",
                title: v ? "Mode démo activé" : "Mode réel activé",
                body: v
                  ? "Données d’exemple affichées."
                  : apiKey
                    ? "Tes imports utiliseront Gemini."
                    : "Ajoute ta clé Gemini ci-dessus pour importer tes stats.",
              });
            }}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Préférences" icon={<Palette className="size-5" />} />
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-fg">Langue de l’interface</p>
            <p className="mt-1 text-sm text-muted">
              Français. Les rapports de Gemini sont aussi rédigés en français.
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-fg">Thème</p>
            <Segmented
              label="Thème"
              value={theme}
              onChange={setTheme}
              className="w-full"
              options={[
                { value: "dark", label: "Sombre", icon: <Moon className="size-4" /> },
                { value: "light", label: "Clair", icon: <Sun className="size-4" /> },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Confidentialité" icon={<ShieldCheck className="size-5" />} />
        <ul className="space-y-3 text-sm">
          {[
            [
              HardDrive,
              "Tes vidéos restent dans ton navigateur",
              "Elles sont lues localement. Seuls le texte et les captures de stats sont envoyés à Gemini pour extraction.",
            ],
            [
              Lock,
              "Ta clé API ne quitte pas cet appareil",
              "Elle est stockée dans le localStorage et envoyée uniquement à Google lors d’un appel.",
            ],
            [
              Monitor,
              "Historique local",
              "Tes analyses sont sauvegardées dans IndexedDB, sur cet appareil. Vider les données du site les efface.",
            ],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Lock;
            return (
              <li key={t as string} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/12 text-success">
                  <I className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-fg">{t as string}</p>
                  <p className="text-muted">{d as string}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Prototype" subtitle="Outils de démonstration" />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="size-4" />}
            onClick={() => {
              setOnboarded(false);
              navigate("onboarding");
            }}
          >
            Revoir l’onboarding
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Palette className="size-4" />}
            onClick={() => navigate("design")}
          >
            Design system
          </Button>
          {!hasData && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setHasData(true);
                toast({ tone: "success", title: "Données de démo restaurées" });
              }}
            >
              Restaurer les données de démo
            </Button>
          )}
        </div>
      </Card>

      <div className="rounded-2xl border border-danger/25 bg-danger/[0.04] p-5">
        <h3 className="font-semibold text-fg">Zone de danger</h3>
        <p className="mt-1 text-sm text-muted">
          Supprime toutes tes analyses enregistrées (IndexedDB) et ta clé API de ce navigateur.
          Action irréversible.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          icon={<Trash2 className="size-4" />}
          onClick={() => setConfirm(true)}
        >
          Supprimer toutes les données
        </Button>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Tout supprimer ?">
        <p className="text-sm text-muted">
          Toutes tes analyses enregistrées et ta clé API seront définitivement effacées de ce
          navigateur.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Annuler
          </Button>
          <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={deleteAll}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
