"use client";

import type { PhoneLookupState } from "./usePhoneLookupState";

export function LookupFormSection({ state }: { state: PhoneLookupState }) {
  return (
    <>
      <form className="lookup-form" onSubmit={state.handleSubmit}>
        <label className="field">
          <span>Phone number</span>
          <input
            autoComplete="tel"
            inputMode="tel"
            placeholder="+1 555 012 3456"
            value={state.phoneNumber}
            onChange={(event) => state.setPhoneNumber(event.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Region hint</span>
            <input
              autoCapitalize="characters"
              maxLength={8}
              placeholder="US"
              value={state.regionHint}
              onChange={(event) => state.setRegionHint(event.target.value.toUpperCase())}
            />
          </label>

          <label className="field">
            <span>Mode</span>
            <input value="Source review" readOnly />
          </label>
        </div>

        <button type="submit" disabled={state.isLoading || state.phoneNumber.trim().length === 0}>
          {state.isLoading ? "Preparing assessment..." : "Run phone lookup"}
        </button>
      </form>

      {state.error ? <p className="muted">{state.error}</p> : null}
    </>
  );
}
