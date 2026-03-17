import { useState, useEffect } from "react";
import { Stethoscope, Phone, CheckCircle, XCircle, Building2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { api } from "@/integrations/mysql/client";
import type { HealthcareProvider } from "@/integrations/mysql/types";

const capacityColors: Record<string, string> = {
  available: "text-success",
  limited: "text-accent",
  full: "text-destructive",
};

const Clinics = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await api.providers.healthcare.list();
        if (data.providers) {
          setProviders(data.providers.map((p: any) => ({
            ...p,
            services: typeof p.services === 'string' ? JSON.parse(p.services) : p.services,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch providers:', error);
      }
      setLoading(false);
    };
    fetchProviders();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-accent" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{t("clinics.title")}</h1>
        </div>
        <p className="mb-8 text-muted-foreground">
          {isAr
            ? "مقدمو الخدمات الصحية المتاحين على المنصة."
            : "Healthcare providers available on the platform."}
        </p>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : providers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">{t("shelters.noResults")}</div>
        ) : (
          <div className="space-y-4">
            {providers.map((p) => {
              const services = Array.isArray(p.services) ? p.services : [];
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border bg-card p-5 ${
                    p.is_operational ? "border-border" : "border-destructive/30 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">{p.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {p.address && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {p.address}
                          </span>
                        )}
                        {p.is_operational ? (
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle className="h-3.5 w-3.5" /> {t("clinics.open")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3.5 w-3.5" /> {t("clinics.closed")}
                          </span>
                        )}
                        {p.capacity_status && (
                          <span className={`text-xs font-medium capitalize ${capacityColors[p.capacity_status] || ''}`}>
                            {isAr
                              ? { available: "متاح", limited: "محدود", full: "ممتلئ" }[p.capacity_status]
                              : p.capacity_status}
                          </span>
                        )}
                      </div>
                      {p.provider_type && (
                        <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                          {p.provider_type.replace('_', ' ')}
                        </span>
                      )}
                      {p.ngo_affiliation && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {isAr ? "المنظمة:" : "NGO:"} {p.ngo_affiliation}
                        </p>
                      )}
                    </div>
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                      >
                        <Phone className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  {services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {services.map((s: string) => (
                        <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.operating_hours && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {isAr ? "ساعات العمل:" : "Hours:"} {p.operating_hours}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clinics;
