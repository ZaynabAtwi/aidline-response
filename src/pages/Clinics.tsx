import { useState, useEffect } from "react";
import { Stethoscope, MapPin, Phone, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_operational: boolean;
  services: string[] | null;
  ngo: string | null;
}

const Clinics = () => {
  const { t } = useLanguage();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
      if (data) setClinics(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-accent" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{t("clinics.title")}</h1>
        </div>
        <p className="mb-8 text-muted-foreground">{t("clinics.subtitle")}</p>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : clinics.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">{t("shelters.noResults")}</div>
        ) : (
          <div className="space-y-4">
            {clinics.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl border bg-card p-5 ${
                  c.is_operational ? "border-border" : "border-destructive/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{c.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      {c.address && <><MapPin className="h-4 w-4" /><span>{c.address}</span></>}
                      {c.is_operational ? (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle className="h-3.5 w-3.5" /> {t("clinics.open")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3.5 w-3.5" /> {t("clinics.closed")}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  )}
                </div>
                {c.services && c.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.services.map((s) => (
                      <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clinics;
