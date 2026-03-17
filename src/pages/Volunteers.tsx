import { useState, useEffect } from "react";
import { Users, CheckCircle, Clock, Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";


const skillOptions = [
  "Medical", "Translation", "Logistics", "Driving", "Construction",
  "Electrical", "Childcare", "Counseling", "IT Support", "Communication",
  "Teaching", "First Aid", "Cooking", "Legal Aid",
];

interface Volunteer {
  id: string;
  user_id: string;
  skills: string[];
  status: string;
  rating: number | null;
  bio: string | null;
  profiles?: { full_name: string | null } | null;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  available: { color: "text-success", icon: CheckCircle },
  assigned: { color: "text-accent", icon: Clock },
  unavailable: { color: "text-destructive", icon: Clock },
};

const Volunteers = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    const { data } = await supabase.from("volunteers").select("*").order("rating", { ascending: false });
    if (data) setVolunteers(data as Volunteer[]);
    setLoading(false);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedSkills.length === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("volunteers").insert({
      user_id: user.id,
      skills: selectedSkills,
      bio: bio || null,
      status: "available" as const,
    });
    if (!error) {
      setRegistered(true);
      setShowRegister(false);
      fetchVolunteers();
      setTimeout(() => setRegistered(false), 3000);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-success" />
            <h1 className="font-heading text-3xl font-bold text-foreground">{t("vol.title")}</h1>
          </div>
          {user && !showRegister && (
            <button
              onClick={() => setShowRegister(true)}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
            >
              {t("vol.register")}
            </button>
          )}
        </div>
        <p className="mb-6 text-muted-foreground">{t("vol.subtitle")}</p>

        {registered && (
          <div className="mb-6 rounded-lg bg-success/15 px-4 py-3 text-sm font-medium text-success">
            {t("vol.registered")}
          </div>
        )}

        {/* Registration Form */}
        {showRegister && user ? (
          <form onSubmit={handleRegister} className="mb-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">{t("vol.register")}</h2>

            <div className="mb-4">
              <label className="mb-2 block text-sm text-muted-foreground">{t("vol.selectSkills")}</label>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedSkills.includes(skill)
                        ? "bg-primary text-primary-foreground ring-2 ring-ring"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm text-muted-foreground">{t("vol.bio")}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("vol.bioPlaceholder")}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={selectedSkills.length === 0 || submitting}
                className="flex-1 rounded-lg bg-success py-3 font-heading font-semibold text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
              >
                {t("vol.submitRegistration")}
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="rounded-lg border border-border bg-card px-6 py-3 text-foreground"
              >
                ✕
              </button>
            </div>
          </form>
        ) : null}

        {/* Volunteer List */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : (
          <div className="space-y-4">
            {volunteers.map((v) => {
              const config = statusConfig[v.status] || statusConfig.available;
              const StatusIcon = config.icon;
              const statusLabel = t(`vol.${v.status}` as any) || v.status;
              return (
                <div key={v.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {v.bio ? v.bio.slice(0, 30) : `Volunteer`}
                        </h3>
                        <StatusIcon className={`h-4 w-4 ${config.color}`} />
                        <span className={`text-xs capitalize ${config.color}`}>{statusLabel}</span>
                      </div>
                      {v.rating && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 text-accent" /> {v.rating}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {v.skills.map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {s}
                      </span>
                    ))}
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

export default Volunteers;
