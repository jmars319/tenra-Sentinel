import type { LookupJobStatus } from "@sentinel/domain";
import type { Id, IsoTimestamp } from "@sentinel/shared-types";

export type RealtimeEventKind =
  | "lookup.queued"
  | "lookup.progress"
  | "lookup.completed"
  | "lookup.failed";

export interface LookupRealtimeEventBase {
  eventId: Id;
  kind: RealtimeEventKind;
  lookupJobId: Id;
  emittedAt: IsoTimestamp;
}

export interface LookupProgressEvent extends LookupRealtimeEventBase {
  kind: "lookup.progress";
  completedSteps: number;
  totalSteps: number;
  summary: string;
}

export interface LookupStateChangedEvent extends LookupRealtimeEventBase {
  kind: "lookup.queued" | "lookup.completed" | "lookup.failed";
  status: LookupJobStatus;
  summary: string;
}

export type LookupRealtimeEvent = LookupProgressEvent | LookupStateChangedEvent;
