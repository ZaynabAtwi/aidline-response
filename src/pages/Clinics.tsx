import { useState, useEffect } from "react";
import { Stethoscope, Phone, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { providersApi } from "@/lib/api/client";
import { supabase } from "@/integrations/supabase/client";

interface Provider {
  id: string;
  name: string;
  type: "healthcare" | "pharmacy" | "ngo";
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  services: string[] | null;
  operating_hours: string | null;
  is_active: boolean;
}

const TYPE_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  healthcare: { en: "Healthcare",   ar: "رعاية صحية",  color: "bg-accent/15 text-accent" },
  pharmacy:   { en: "Pharmacy",     ar: "صيدلية",      color: "bg-primary/15 text-primary" },
  ngo:        { en: "NGO",          ar: "منظمة",       color: "bg-success/15 text-success" },
  government: { en: "Government",   ar: "حكومي",       color: "bg-muted text-muted-foreground" },
};

const Clinics = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filtered, setFiltered] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    let result = providers;
    if (typeFilter !== "all") result = result.filter((p) => p.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.services || []).some((s) => s.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [search, typeFilter, providers]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      // Try MySQL backend first
      const res = await providersApi.list({ pageSize: 100 });
      if (res.success && res.data?.items) {
        const items = res.data.items.map((p: any) => ({
          ...p,
          services: typeof p.services === "string" ? JSON.parse(p.services) : p.services,
        }));
        setProviders(items);
        return;
      }
    } catch {
      // Fall back to Supabase for legacy data
    }
    try {
      const { data } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
      if (data) {
        setProviders(
          data.map((c: any) => ({
            id:             c.id,
            name:           c.name,
            type:           "healthcare" as const,
            contact_email:  null,
            contact_phone:  c.phone,
            description:    null,
            services:       c.services,
            operating_hours: c.operating_hours,
            is_active:      c.is_operational,
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-accent" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{t("clinics.title")}</h1>
        </div>
        <p className="mb-6 text-muted-foreground">
          {isAr
            ? "تصفح مزودي الخدمات الصحية والصيدليات والمنظمات المسجلة على المنصة."
            : "Browse healthcare providers, pharmacies, and organizations registered on the platform."}
        </p>

        {/* Search & filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? "ابحث عن مزود خدمة..." : "Search providers..."}
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">{isAr ? "الكل" : "All Types"}</option>
              <option value="healthcare">{isAr ? "رعاية صحية" : "Healthcare"}</option>
              <option value="pharmacy">{isAr ? "صيدلية" : "Pharmacy"}</option>
              <option value="ngo">{isAr ? "منظمة" : "NGO"}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {isAr ? "لا توجد نتائج" : "No results found"}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => {
              const typeInfo = TYPE_LABELS[p.type] || TYPE_LABELS.healthcare;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border bg-card p-5 ${
                    p.is_active ? "border-border" : "border-destructive/30 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-lg font-semibold text-foreground">{p.name}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                          {isAr ? typeInfo.ar : typeInfo.en}
                        </span>
                      </div>
                      {p.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {p.operating_hours && (
                          <span className="text-xs">{isAr ? "ساعات العمل:" : "Hours:"} {p.operating_hours}</span>
                        )}
                        {p.is_active ? (
                          <span className="flex items-center gap-1 text-success text-xs">
                            <CheckCircle className="h-3.5 w-3.5" /> {t("clinics.open")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-destructive text-xs">
                            <XCircle className="h-3.5 w-3.5" /> {t("clinics.closed")}
                          </span>
                        )}
                      </div>
                    </div>
                    {p.contact_phone && (
                      <a
                        href={`tel:${p.contact_phone}`}
                        className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                      >
                        <Phone className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  {p.services && p.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.services.map((s) => (
                        <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
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
