import { sentinelAppName, sentinelTagline } from "@sentinel/config";
import { PhoneLookupForm } from "../components/phone-lookup-form";

const sourceReadiness = [
  {
    title: "Signal synthesis",
    body: "Sentinel is designed to gather fragmented observations, preserve their provenance, and return a reasoned posture instead of a binary verdict."
  },
  {
    title: "Confidence-weighted output",
    body: "Assessments stay explicit about uncertainty. Low signal should produce calm, low-confidence output rather than false certainty."
  },
  {
    title: "Thin app surface",
    body: "The web UI is only the initial surface. Domain logic, contracts, validation, and privacy rules live in shared packages."
  }
];

const statusPanels = [
  {
    title: "Current lookup path",
    body: "Phone-number lookup is scaffolded end to end with a placeholder API boundary and shared request/response contracts."
  },
  {
    title: "Next integration layer",
    body: "Source connectors, queue processing, and realtime progress updates are intentionally left light until the first provider plan is defined."
  }
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="masthead">
          <span className="eyebrow">JAMARQ side project · reasoning layer</span>
          <h1>{sentinelAppName}</h1>
          <p>{sentinelTagline}</p>
          <p>
            The initial product surface is a suspicious phone-number lookup flow. The
            scaffold stops short of pretending to know more than the connected signals can
            justify.
          </p>

          <div className="hero-grid">
            {sourceReadiness.map((item) => (
              <article key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="lookup-card">
          <h2>Phone lookup shell</h2>
          <p>
            This flow validates the future request boundary, response shape, and visible
            reasoning surface without pretending that external intelligence providers are
            already wired in.
          </p>
          <PhoneLookupForm />
        </aside>
      </section>

      <section className="meta-grid">
        {statusPanels.map((panel) => (
          <article className="panel" key={panel.title}>
            <h2>{panel.title}</h2>
            <p>{panel.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
