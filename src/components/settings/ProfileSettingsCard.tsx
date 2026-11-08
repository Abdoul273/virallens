import { useRef, useState } from "react";
import { ImagePlus, Trash2, UserRound } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { imageToBase64 } from "@/lib/media";

const normalizeHandle = (v: string) => {
  const t = v.trim().replace(/\s+/g, "");
  return t && !t.startsWith("@") ? `@${t}` : t;
};

/** The user's own account shown in the sidebar. Stored only in this browser. */
export function ProfileSettingsCard() {
  const { profile, setProfile } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pickImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ tone: "error", title: "Format non pris en charge", body: "Choisis une image." });
      return;
    }
    setBusy(true);
    try {
      // downscaled so it fits comfortably in localStorage
      const { mimeType, data } = await imageToBase64(file, 160);
      setProfile({ ...profile, avatar: `data:${mimeType};base64,${data}` });
    } catch {
      toast({ tone: "error", title: "Image illisible" });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader
        title="Profil"
        subtitle="Ton compte TikTok, affiché dans la barre latérale. Stocké uniquement dans ce navigateur."
        icon={<UserRound className="size-5" />}
      />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3 sm:flex-col sm:items-center">
          <ProfileAvatar
            name={profile.name}
            handle={profile.handle}
            src={profile.avatar}
            className="size-16 text-lg"
          />
          <div className="flex gap-1 sm:flex-col sm:items-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              id="profile-avatar"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />
            <Button
              variant="ghost"
              size="sm"
              loading={busy}
              icon={<ImagePlus className="size-4" />}
              onClick={() => fileRef.current?.click()}
            >
              {profile.avatar ? "Changer" : "Photo"}
            </Button>
            {profile.avatar && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="size-4" />}
                onClick={() => setProfile({ ...profile, avatar: "" })}
              >
                Retirer
              </Button>
            )}
          </div>
        </div>
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Field label="Nom du compte" htmlFor="profile-name">
            <Input
              id="profile-name"
              autoComplete="nickname"
              placeholder="Ex. Ma chaîne cuisine"
              maxLength={60}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </Field>
          <Field
            label="@handle"
            htmlFor="profile-handle"
            hint="Sans photo, tes initiales sont affichées."
          >
            <Input
              id="profile-handle"
              autoComplete="off"
              spellCheck={false}
              placeholder="@moncompte"
              maxLength={40}
              value={profile.handle}
              onChange={(e) => setProfile({ ...profile, handle: e.target.value })}
              onBlur={(e) => setProfile({ ...profile, handle: normalizeHandle(e.target.value) })}
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}
