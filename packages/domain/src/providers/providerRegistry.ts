import type { LookupTargetKind } from "@sentinel/shared-types";
import { LocalPhoneSignalProvider } from "./mockPhoneSignalProvider";
import type { LookupProvider } from "./types";

export class LookupProviderRegistry {
  readonly #providers = new Map<string, LookupProvider>();

  register(provider: LookupProvider): this {
    if (this.#providers.has(provider.id)) {
      throw new Error(`Lookup provider already registered: ${provider.id}`);
    }

    this.#providers.set(provider.id, provider);
    return this;
  }

  getActiveProviders(): LookupProvider[] {
    return [...this.#providers.values()].filter((provider) => provider.isActive);
  }

  getProvidersForTarget(target: LookupTargetKind): LookupProvider[] {
    return this.getActiveProviders().filter((provider) =>
      provider.supportedTargets.includes(target)
    );
  }
}

export const createDefaultLookupProviderRegistry = (): LookupProviderRegistry =>
  new LookupProviderRegistry().register(new LocalPhoneSignalProvider());

export const sentinelProviderRegistry = createDefaultLookupProviderRegistry();
