import { sentinelAppName } from "@sentinel/config";
import { riskLevelToneMap, sentinelTokens } from "@sentinel/ui";

const sections = [
  {
    title: "Queue",
    body: "Monitor incoming lookup jobs, retry behavior, and background processing health."
  },
  {
    title: "Assessments",
    body: "Review structured Sentinel outputs with evidence, source posture, and confidence context."
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
          <span className="desktop-eyebrow">Operator surface</span>
          <h1>{sentinelAppName} Desktop</h1>
          <p>
            Thin admin shell for queue visibility, assessment review, and source operations.
          </p>
        </div>

        <div
          className="desktop-status"
          style={{ borderColor: riskLevelToneMap.unknown.accent }}
        >
          <strong>Current posture</strong>
          <p>Desktop workflows are scaffolded and ready for the first real operator use cases.</p>
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
          this desktop shell can remain operationally focused.
        </div>
      </section>
    </main>
  );
}
