import { sentinelAppName } from "@sentinel/config";
import { riskLevelToneMap, sentinelTokens } from "@sentinel/ui";

const sections = [
  {
    title: "Queue",
    body: "Monitor incoming lookup jobs, retry behavior, and background processing health."
  },
  {
    title: "Assessments",
    body: "Review structured tenra Sentinel outputs with evidence, source posture, and confidence context."
  },
  {
    title: "Sources",
    body: "Track configured providers, ingest quality, and gaps in source coverage."
  },
  {
    title: "Settings",
    body: "Manage environment posture, operator preferences, and future auth policies."
  }
];

export default function App() {
  return (
    <main className="desktop-shell">
      <header className="desktop-header">
        <div>
          <span className="desktop-eyebrow">Desktop operations</span>
          <h1>{sentinelAppName} Desktop</h1>
          <p>
            Queue visibility, assessment review, source status, and operational settings.
          </p>
        </div>

        <div
          className="desktop-status"
          style={{ borderColor: riskLevelToneMap.unknown.accent }}
        >
          <strong>Current posture</strong>
          <p>Desktop is prepared for queue review, source checks, and assessment triage.</p>
        </div>
      </header>

      <section className="desktop-grid">
        {sections.map((section) => (
          <article className="desktop-card" key={section.title}>
            <strong>{section.title}</strong>
            <p>{section.body}</p>
          </article>
        ))}
      </section>

      <section className="desktop-footer">
        <div className="desktop-band">
          <span
            className="desktop-dot"
            style={{ background: sentinelTokens.color.accent }}
          />
          Shared packages hold domain logic, validation, contracts, and privacy helpers so
          this desktop channel can remain operationally focused.
        </div>
      </section>
    </main>
  );
}
