import { useState, useEffect } from "react";
import { Building2, MapPin, Users, CheckCircle, XCircle, Search, Navigation } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";

interface Shelter {
  id: string;
  name: string;
  address: string | null;
  capacity: number;
  available_spots: number;
  is_operational: boolean;
  ngo: string | null;
  phone: string | null;
}

const Shelters = () => {
  const { t } = useLanguage();
  const { position, loading: geoLoading, requestLocation } = useGeolocation();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"gps" | "manual">("gps");

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("shelters").select("*").order("created_at", { ascending: false });
    if (!error && data) setShelters(data);
    setLoading(false);
  };

  const filtered = searchQuery
    ? shelters.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : shelters;

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{t("shelters.title")}</h1>
        </div>
        <p className="mb-6 text-muted-foreground">{t("shelters.subtitle")}</p>

        {/* Search Mode Toggle */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => { setSearchMode("gps"); requestLocation(); }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              searchMode === "gps" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Navigation className="h-4 w-4" />
            {t("shelters.gpsSearch")}
          </button>
          <button
            onClick={() => setSearchMode("manual")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              searchMode === "manual" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Search className="h-4 w-4" />
            {t("shelters.manualSearch")}
          </button>
        </div>

        {/* GPS Status */}
        {searchMode === "gps" && geoLoading && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
            <Navigation className="h-4 w-4 animate-pulse" />
            {t("shelters.locating")}
          </div>
        )}
        {searchMode === "gps" && position && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle className="h-4 w-4" />
            📍 {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
          </div>
        )}

        {/* Manual Search */}
        {searchMode === "manual" && (
          <div className="relative mb-4">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("shelters.searchPlaceholder")}
              className="w-full rounded-lg border border-input bg-background py-3 ps-10 pe-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Shelter Cards */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">{t("shelters.noResults")}</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border bg-card p-5 transition-colors ${
                  !s.is_operational ? "border-destructive/30 opacity-60" : s.available_spots > 0 ? "border-success/30" : "border-accent/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{s.name}</h3>
                    {s.address && (
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{s.address}</span>
                      </div>
                    )}
                    {s.ngo && (
                      <p className="mt-1 text-xs text-muted-foreground">{t("common.by")}: {s.ngo}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {s.is_operational ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      <span className={s.available_spots > 0 ? "font-semibold text-success" : "font-semibold text-accent"}>
                        {s.available_spots}
                      </span>
                      /{s.capacity} {t("shelters.available")}
                    </span>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        s.available_spots > 0 ? "bg-success" : "bg-accent"
                      }`}
                      style={{ width: `${((s.capacity - s.available_spots) / s.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shelters;
