import { useState, useEffect } from "react";
import { Fuel, Phone, Search, MapPin, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const districts = [
  { ar: "الكل", en: "All" },
  { ar: "بيروت", en: "Beirut" },
  { ar: "طرابلس", en: "Tripoli" },
  { ar: "صيدا", en: "Sidon" },
  { ar: "صور", en: "Tyre" },
  { ar: "بعلبك", en: "Baalbek" },
  { ar: "زحلة", en: "Zahle" },
  { ar: "جبيل", en: "Byblos" },
  { ar: "جونية", en: "Jounieh" },
  { ar: "النبطية", en: "Nabatieh" },
  { ar: "عكار", en: "Akkar" },
  { ar: "البقاع", en: "Bekaa" },
  { ar: "جبل لبنان", en: "Mount Lebanon" },
];

interface GasStation {
  id: string;
  name: string;
  district: string;
  status: string;
  phone: string | null;
  notes: string | null;
}

const statusConfig = {
  open: { icon: CheckCircle, color: "text-success", bg: "bg-success/15", label: { ar: "مفتوح", en: "Open" } },
  closed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15", label: { ar: "مغلق", en: "Closed" } },
  unknown: { icon: HelpCircle, color: "text-muted-foreground", bg: "bg-muted", label: { ar: "غير معروف", en: "Unknown" } },
};

const GasStations = () => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gas_stations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setStations(data as GasStation[]);
    setLoading(false);
  };

  const filtered = stations.filter((s) => {
    const matchesDistrict = selectedDistrict === "All" || s.district === selectedDistrict;
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  const counts = {
    open: stations.filter((s) => s.status === "open").length,
    closed: stations.filter((s) => s.status === "closed").length,
    unknown: stations.filter((s) => s.status === "unknown").length,
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Fuel className="h-8 w-8 text-accent" />
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {t("gas.title")}
          </h1>
        </div>
        <p className="mb-6 text-muted-foreground">{t("gas.subtitle")}</p>

        {/* Status Summary */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {(["open", "closed", "unknown"] as const).map((status) => {
            const cfg = statusConfig[status];
            return (
              <div key={status} className={`flex items-center gap-2 rounded-xl ${cfg.bg} px-4 py-3`}>
                <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
                <div>
                  <p className={`text-lg font-bold ${cfg.color}`}>{counts[status]}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? cfg.label.ar : cfg.label.en}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* District Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {districts.map((d) => (
            <button
              key={d.en}
              onClick={() => setSelectedDistrict(d.en === "All" ? "All" : d.en)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                (d.en === "All" && selectedDistrict === "All") || selectedDistrict === d.en
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {isAr ? d.ar : d.en}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("gas.searchPlaceholder")}
            className="w-full rounded-lg border border-input bg-background py-3 ps-10 pe-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Station List */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">{t("gas.noResults")}</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((station) => {
              const cfg = statusConfig[station.status as keyof typeof statusConfig] || statusConfig.unknown;
              return (
                <div
                  key={station.id}
                  className={`rounded-xl border bg-card p-5 transition-colors ${
                    station.status === "open"
                      ? "border-success/30"
                      : station.status === "closed"
                      ? "border-destructive/30 opacity-70"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-semibold text-foreground">{station.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>
                          {isAr
                            ? districts.find((d) => d.en === station.district)?.ar || station.district
                            : station.district}
                        </span>
                      </div>
                      {station.phone && (
                        <a
                          href={`tel:${station.phone}`}
                          className="mt-1 flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-4 w-4 shrink-0" />
                          <span dir="ltr">{station.phone}</span>
                        </a>
                      )}
                      {station.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{station.notes}</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-lg ${cfg.bg} px-3 py-1.5`}>
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                      <span className={`text-sm font-medium ${cfg.color}`}>
                        {isAr ? cfg.label.ar : cfg.label.en}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GasStations;
