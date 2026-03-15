import type { Id, IsoTimestamp } from "@sentinel/shared-types";

export type SessionScope = "web" | "desktop" | "mobile" | "admin";

export interface AuthActor {
  id: Id;
  email?: string;
  displayName?: string;
  scopes: SessionScope[];
}

export interface SentinelSession {
  sessionId: Id;
  actor: AuthActor;
  createdAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
}

export const hasScope = (session: SentinelSession, scope: SessionScope): boolean =>
  session.actor.scopes.includes(scope);
