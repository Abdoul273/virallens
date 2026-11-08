import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/app/AppContext";
import { Logo, ThemeToggle } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ONBOARDING } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function Onboarding() {
  const { navigate, setOnboarded } = useApp();
  const [i, setI] = useState(0);
  const slide = ONBOARDING[i];
  const last = i === ONBOARDING.length - 1;
  const finish = () => {
    setOnboarded(true);
    navigate("dashboard");
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden lg:flex-row">
      <div className="relative h-[52dvh] shrink-0 overflow-hidden lg:h-auto lg:w-1/2">
        {ONBOARDING.map((s, idx) => (
          <img
            key={s.image}
            src={s.image}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover transition-all duration-700",
              idx === i ? "scale-100 opacity-100" : "scale-105 opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-bg lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-bg" />
        {/* floating UI hint */}
        <div className="absolute bottom-16 left-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-black/50 p-3 pr-4 text-white backdrop-blur-xl lg:bottom-10 lg:left-10">
          <span className="grid size-11 place-items-center rounded-full border-4 border-[#ff4d94] text-sm font-bold">
            {[38, 82, 76][i]}
          </span>
          <div className="text-sm">
            <p className="font-semibold">
              {["Décrochage à 0:03", "Nouvelle accroche prête", "Structure à adapter"][i]}
            </p>
            <p className="text-white/70">
              {
                [
                  "42 % partent avant le résultat",
                  "« Ce pain craque. 4 ingrédients. »",
                  "Résultat → méthode → résultat",
                ][i]
              }
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 lg:hidden">
          <Logo />
          <button
            onClick={finish}
            className="h-11 rounded-xl px-3 text-sm font-semibold text-white/90 hover:text-white"
          >
            Passer
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col px-6 pt-4 pb-8 lg:justify-center lg:px-16">
        <div className="absolute top-6 right-6 hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button variant="ghost" onClick={finish}>
            Passer
          </Button>
        </div>
        <div className="hidden lg:mb-12 lg:block">
          <Logo />
        </div>
        <div key={i} className="max-w-md animate-fade-up">
          <p className="text-sm font-semibold text-accent">
            {i + 1} / {ONBOARDING.length}
          </p>
          <h1 className="mt-2 text-[30px] leading-[1.1] font-bold tracking-tight text-fg md:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{slide.body}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 pt-8 lg:mt-12">
          <div className="flex gap-2" role="tablist" aria-label="Diapositives">
            {ONBOARDING.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={idx === i}
                aria-label={`Diapositive ${idx + 1}`}
                onClick={() => setI(idx)}
                className="grid h-11 place-items-center"
              >
                <span
                  className={cn(
                    "block h-2 rounded-full transition-all",
                    idx === i ? "w-8 bg-brand" : "w-2 bg-line-strong",
                  )}
                />
              </button>
            ))}
          </div>
          <Button size="lg" onClick={() => (last ? finish() : setI(i + 1))}>
            {last ? "Commencer" : "Suivant"} <ArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
