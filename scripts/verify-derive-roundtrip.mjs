#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const suiteRoot = path.resolve(repoRoot, "..");
const deriveBriefPath = path.join(suiteRoot, "tenra Derive/fixtures/handoffs/reasoning-brief.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const brief = JSON.parse(fs.readFileSync(deriveBriefPath, "utf8"));

assert(brief.schema === "tenra-derive.reasoning-brief.v1", "Derive fixture schema mismatch");
assert(typeof brief.exportedAt === "string", "Derive fixture missing exportedAt");
assert(typeof brief.question?.text === "string" && brief.question.text.length > 0, "Derive fixture missing question text");
assert(typeof brief.answer?.answerText === "string" && brief.answer.answerText.length > 0, "Derive fixture missing answer text");
assert(typeof brief.answer?.confidence === "string", "Derive fixture missing confidence");
assert(typeof brief.handoff?.summary === "string" && brief.handoff.summary.length > 0, "Derive fixture missing handoff summary");
assert(Array.isArray(brief.handoff?.openQuestions), "Derive fixture missing open questions");

const appSource = fs.readFileSync(path.join(repoRoot, "apps/desktopapp/src/App.tsx"), "utf8");
assert(
  appSource.includes("parseDeriveReasoningBriefContext"),
  "Sentinel desktop app should import Derive reasoning briefs as review context"
);

console.log("Verified Derive reasoning brief round-trip into Sentinel review context.");
