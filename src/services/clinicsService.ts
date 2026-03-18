import { listProviders, type Provider } from "./providersService";

export async function getClinicProviders(): Promise<Provider[]> {
  const providers = await listProviders();
  return providers.filter((provider) => provider.type === "healthcare" || provider.type === "pharmacy" || provider.type === "ngo");
}
