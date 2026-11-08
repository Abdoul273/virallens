import { AppProvider, useApp } from "@/app/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { ModelErrorToaster } from "@/components/ModelErrorToaster";
import { Analyzing } from "@/screens/Analyzing";
import { Compare } from "@/screens/Compare";
import { Dashboard } from "@/screens/Dashboard";
import { DesignSystem } from "@/screens/DesignSystem";
import { Library } from "@/screens/Library";
import { NewAnalysis } from "@/screens/NewAnalysis";
import { Onboarding } from "@/screens/Onboarding";
import { Patterns } from "@/screens/Patterns";
import { Report } from "@/screens/Report";
import { Settings } from "@/screens/Settings";

function Router() {
  const { screen, compareIds, activeVideoId } = useApp();
  if (screen === "onboarding") return <Onboarding />;
  if (screen === "analyzing") return <Analyzing />;
  return (
    <AppShell>
      {screen === "dashboard" && <Dashboard />}
      {screen === "new" && <NewAnalysis />}
      {screen === "report" && <Report key={activeVideoId} />}
      {screen === "compare" && <Compare key={compareIds.join()} />}
      {screen === "library" && <Library />}
      {screen === "patterns" && <Patterns />}
      {screen === "settings" && <Settings />}
      {screen === "design" && <DesignSystem />}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <ModelErrorToaster />
        <Router />
      </ToastProvider>
    </AppProvider>
  );
}
