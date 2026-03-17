import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/integrations/mysql/client";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

const Onboarding = () => {
  const { lang } = useLanguage();
  const { user, setOnboarded } = useAuth();
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [isDisplaced, setIsDisplaced] = useState<boolean | null>(null);
  const [lostHouse, setLostHouse] = useState<boolean | null>(null);
  const [occupation, setOccupation] = useState<"student" | "freelancer" | "employee" | "unemployed" | "looking_for_a_job">("student");
  const [major, setMajor] = useState("");
  const [employeeLostJob, setEmployeeLostJob] = useState<boolean | null>(null);
  const [needsShelter, setNeedsShelter] = useState<boolean | null>(null);
  const [healthIssues, setHealthIssues] = useState<boolean | null>(null);
  const [healthIssueDetails, setHealthIssueDetails] = useState("");
  const [hasElderlyAtHome, setHasElderlyAtHome] = useState<boolean | null>(null);
  const [wantsToVolunteer, setWantsToVolunteer] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const ready =
    isDisplaced !== null &&
    lostHouse !== null &&
    occupation !== null &&
    needsShelter !== null &&
    healthIssues !== null &&
    hasElderlyAtHome !== null &&
    wantsToVolunteer !== null &&
    (occupation !== "employee" || employeeLostJob !== null) &&
    (healthIssues === false || healthIssueDetails.trim().length > 0);

  const save = async () => {
    if (!user || !ready) return;
    setSaving(true);
    try {
      await api.auth.saveOnboarding({
        user_id: user.id,
        is_displaced: Boolean(isDisplaced),
        lost_house: Boolean(lostHouse),
        occupation,
        major: major || undefined,
        employee_lost_job_due_to_war: occupation === "employee" ? Boolean(employeeLostJob) : false,
        needs_shelter: Boolean(needsShelter),
        needs_medication: false,
        health_issues: Boolean(healthIssues),
        health_issue_details: healthIssues ? healthIssueDetails : undefined,
        has_elderly_at_home: Boolean(hasElderlyAtHome),
        wants_to_volunteer: Boolean(wantsToVolunteer),
        urgency: "medium",
      });
    } finally {
      setOnboarded(true);
      navigate(wantsToVolunteer ? "/volunteers" : "/", { replace: true });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-8 md:pt-20">
      <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 md:p-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">AidLine Intake</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAr
            ? "يرجى الإجابة على الأسئلة التالية لإكمال تسجيلك."
            : "Please answer the following questions to complete your registration."}
        </p>

        <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs font-mono text-muted-foreground">
          {isAr ? "معرّفك:" : "Your ID:"} {user?.generated_identity_id || user?.id}
        </p>

        <div className="mt-6 space-y-5">
          <YesNoQuestion
            label={isAr ? "1) هل أنت نازح؟" : "1) Are you displaced?"}
            value={isDisplaced}
            onChange={setIsDisplaced}
            isAr={isAr}
          />
          <YesNoQuestion
            label={isAr ? "2) هل خسرت منزلك؟" : "2) Did you lose your house?"}
            value={lostHouse}
            onChange={setLostHouse}
            isAr={isAr}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {isAr
                ? "3) ما هي مهنتك؟"
                : "3) What is your occupation?"}
            </p>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value as typeof occupation)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground"
            >
              <option value="student">{isAr ? "طالب" : "Student"}</option>
              <option value="freelancer">{isAr ? "عمل حر" : "Freelancer"}</option>
              <option value="employee">{isAr ? "موظف" : "Employee"}</option>
              <option value="unemployed">{isAr ? "عاطل عن العمل" : "Unemployed"}</option>
              <option value="looking_for_a_job">{isAr ? "أبحث عن عمل" : "Looking for a job"}</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {isAr ? "4) الاختصاص (Major)" : "4) Major"}
            </p>
            <input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground"
              placeholder={isAr ? "مثال: هندسة / طب / علوم..." : "Example: Engineering / Medicine / Sciences..."}
            />
          </div>

          {occupation === "employee" && (
            <YesNoQuestion
              label={isAr
                ? "5) إذا كنت موظفاً، هل خسرت عملك بسبب الحرب؟"
                : "5) If you are an employee, did you lose your job due to the war?"}
              value={employeeLostJob}
              onChange={setEmployeeLostJob}
              isAr={isAr}
            />
          )}

          <YesNoQuestion
            label={isAr ? "6) هل تحتاج إلى أي مأوى؟" : "6) Do you need any shelter?"}
            value={needsShelter}
            onChange={setNeedsShelter}
            isAr={isAr}
          />

          {needsShelter && (
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
              <p className="text-foreground">
                {isAr ? "7) إذا نعم، تفضل بزيارة الرابط:" : "7) If yes, check this link:"}
              </p>
              <a
                href="https://find.shelterslebanon.info"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block font-medium text-primary underline"
              >
                find.shelterslebanon.info
              </a>
            </div>
          )}

          <YesNoQuestion
            label={isAr ? "8) هل لديك أي مشاكل صحية؟" : "8) Do you have any health issues?"}
            value={healthIssues}
            onChange={setHealthIssues}
            isAr={isAr}
          />

          {healthIssues && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                {isAr ? "9) إذا نعم، ما هي؟" : "9) If yes, what are they?"}
              </p>
              <textarea
                value={healthIssueDetails}
                onChange={(e) => setHealthIssueDetails(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground"
                rows={3}
                required
              />
            </div>
          )}

          <YesNoQuestion
            label={isAr
              ? "10) هل لديك كبار سن معك في المنزل؟"
              : "10) Do you have any elderly with you at home?"}
            value={hasElderlyAtHome}
            onChange={setHasElderlyAtHome}
            isAr={isAr}
          />

          <YesNoQuestion
            label={isAr ? "11) هل ترغب بالتطوع معنا؟" : "11) Would you like to volunteer with us?"}
            value={wantsToVolunteer}
            onChange={setWantsToVolunteer}
            isAr={isAr}
          />
        </div>

        <button
          onClick={save}
          disabled={!ready || saving}
          className="mt-8 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving
            ? (isAr ? "جاري الحفظ..." : "Saving...")
            : (isAr ? "إنهاء والمتابعة" : "Finish and continue")}
        </button>
      </div>
    </div>
  );
};

const YesNoQuestion = ({
  label,
  value,
  onChange,
  isAr,
}: {
  label: string;
  value: boolean | null;
  onChange: (next: boolean) => void;
  isAr: boolean;
}) => (
  <div>
    <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          value === true ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {isAr ? "نعم" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          value === false ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}
      >
        {isAr ? "لا" : "No"}
      </button>
    </div>
  </div>
);

export default Onboarding;
