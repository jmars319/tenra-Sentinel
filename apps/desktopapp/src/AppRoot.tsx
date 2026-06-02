import { SentinelAssessmentPanel } from "./components/SentinelAssessmentPanel";
import { SentinelSidebar } from "./components/SentinelSidebar";
import { useSentinelDesk } from "./hooks/useSentinelDesk";

export default function AppRoot() {
  const state = useSentinelDesk();

  return (
    <main className="desktop-shell">
      <SentinelSidebar state={state} />
      <SentinelAssessmentPanel state={state} />
    </main>
  );
}
