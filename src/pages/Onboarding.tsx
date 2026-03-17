import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";

const Onboarding = () => {
  const { lang } = useLanguage();
  const { user, setOnboarded } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [needsShelter, setNeedsShelter] = useState(false);
  const [needsMedication, setNeedsMedication] = useState(false);
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [urgency, setUrgency] = useState("low");
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    // Save onboarding responses
    await supabase.from("onboarding_responses").upsert({
      user_id: user.id,
      needs_shelter: needsShelter,
      needs_medication: needsMedication,
      is_volunteering: isVolunteering,
      urgency,
    }, { onConflict: "user_id" });

    // Assign role based on volunteering choice
    const role = isVolunteering ? "volunteer" : "displaced_user";
    await supabase.from("user_roles").upsert({
      user_id: user.id,
      role: role as any,
    }, { onConflict: "user_id" });

    setOnboarded(true);
    navigate("/");
    setSaving(false);
  };

  const isAr = lang === "ar";
  const NextIcon = isAr ? ChevronLeft : ChevronRight;
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;

  const steps = [
    // Step 0: Welcome
    () => (
      <div className="flex flex-col items-center text-center">
        <img src={logo} alt="AidLine" className="mb-4 h-20 w-20" />
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">
          Aid<span className="text-gradient-primary">Line</span>
        </h1>
        <p className="mb-6 max-w-xs text-muted-foreground">
          {isAr
            ? "مساعدة إنسانية فورية. هويتك مجهولة تماماً — لا حاجة لاسم أو بريد أو رقم هاتف."
            : "Instant humanitarian aid. Your identity is fully anonymous — no name, email, or phone needed."}
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm text-success">
          <Shield className="h-4 w-4" />
          <span>{isAr ? "خصوصيتك محمية" : "Your privacy is protected"}</span>
        </div>
        <p className="mt-4 rounded-lg bg-card px-4 py-2 text-xs text-muted-foreground">
          {isAr ? `المعرّف المجهول: ${user?.id?.slice(0, 8)}...` : `Anonymous ID: ${user?.id?.slice(0, 8)}...`}
        </p>
      </div>
    ),
    // Step 1: Shelter
    () => (
      <div className="text-center">
        <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
          {isAr ? "هل تبحث عن مأوى؟" : "Are you seeking shelter?"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isAr ? "سنوجّه طلبك إلى منظمات الإيواء المناسبة" : "We'll route your request to the right shelter organizations"}
        </p>
        <div className="flex justify-center gap-4">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setNeedsShelter(v)}
              className={`flex-1 max-w-[140px] rounded-xl px-6 py-4 text-base font-semibold transition-all ${
                needsShelter === v
                  ? "bg-primary text-primary-foreground ring-2 ring-ring"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {v ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
            </button>
          ))}
        </div>
      </div>
    ),
    // Step 2: Medication
    () => (
      <div className="text-center">
        <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
          {isAr ? "هل تحتاج أدوية؟" : "Do you need medication?"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isAr ? "سنربطك بالصيدليات وجهات الدعم المناسبة" : "We'll connect you with pharmacies and support providers"}
        </p>
        <div className="flex justify-center gap-4">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setNeedsMedication(v)}
              className={`flex-1 max-w-[140px] rounded-xl px-6 py-4 text-base font-semibold transition-all ${
                needsMedication === v
                  ? "bg-primary text-primary-foreground ring-2 ring-ring"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {v ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
            </button>
          ))}
        </div>
      </div>
    ),
    // Step 3: Volunteer
    () => (
      <div className="text-center">
        <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
          {isAr ? "هل ترغب بالتطوع؟" : "Are you volunteering?"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isAr ? "ساعد الآخرين بمهاراتك" : "Help others with your skills"}
        </p>
        <div className="flex justify-center gap-4">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setIsVolunteering(v)}
              className={`flex-1 max-w-[140px] rounded-xl px-6 py-4 text-base font-semibold transition-all ${
                isVolunteering === v
                  ? "bg-primary text-primary-foreground ring-2 ring-ring"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {v ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
            </button>
          ))}
        </div>
      </div>
    ),
    // Step 4: Urgency
    () => (
      <div className="text-center">
        <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
          {isAr ? "ما مستوى الاستعجال؟" : "What is your urgency level?"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isAr ? "يساعدنا في ترتيب الأولوية من دون جمع أي بيانات جغرافية" : "This helps us prioritize response without collecting any geographic data"}
        </p>
        <div className="mx-auto flex max-w-sm flex-col gap-3">
          {([
            { value: "low", ar: "منخفض — أحتاج مساعدة لاحقاً", en: "Low — I need help later", color: "bg-muted text-muted-foreground" },
            { value: "medium", ar: "متوسط — أحتاج مساعدة قريباً", en: "Medium — I need help soon", color: "bg-accent/15 text-accent" },
            { value: "high", ar: "مرتفع — أحتاج مساعدة اليوم", en: "High — I need help today", color: "bg-accent/25 text-accent" },
            { value: "critical", ar: "حرج — أحتاج مساعدة فوراً", en: "Critical — I need help now", color: "bg-destructive/15 text-destructive" },
          ] as const).map((u) => (
            <button
              key={u.value}
              onClick={() => setUrgency(u.value)}
              className={`rounded-xl px-4 py-3 text-start text-sm font-medium transition-all ${
                urgency === u.value
                  ? u.color + " ring-2 ring-ring"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {isAr ? u.ar : u.en}
            </button>
          ))}
        </div>
      </div>
    ),
  ];

  const totalSteps = steps.length;
  const isLastStep = step === totalSteps - 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 pb-24">
      {/* Language toggle */}
      <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {/* Progress dots */}
      <div className="mb-8 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        {steps[step]()}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex w-full max-w-md items-center justify-between">
        {step > 0 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <PrevIcon className="h-4 w-4" />
            {isAr ? "السابق" : "Back"}
          </button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <button
            onClick={handleComplete}
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 font-heading font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving
              ? (isAr ? "جاري الحفظ..." : "Saving...")
              : (isAr ? "ابدأ الآن" : "Get Started")}
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1 rounded-lg bg-primary px-6 py-2.5 font-heading font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {step === 0 ? (isAr ? "ابدأ" : "Start") : (isAr ? "التالي" : "Next")}
            <NextIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
