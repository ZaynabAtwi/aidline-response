import { AlertTriangle, Building2, ClipboardList, MessageCircle, Pill, Shield, Stethoscope, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const RequestRoutingOverview = () => {
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const pipeline = isAr
    ? [
        {
          title: "إدخال الطلب",
          description: "يرسل المستخدم طلب SOS أو رعاية صحية أو دواء أو دعم إنساني ببيانات منظمة دون مشاركة الموقع.",
          icon: ClipboardList,
        },
        {
          title: "الفرز الذكي",
          description: "يتم تحليل نوع الطلب ودرجة الاستعجال ونوع الجهة المستجيبة المطلوبة.",
          icon: AlertTriangle,
        },
        {
          title: "توجيه الخدمة",
          description: "يتم توجيه الطلب إلى شبكة الرعاية الصحية أو الصيدليات أو المنظمات الإنسانية المناسبة.",
          icon: Users,
        },
        {
          title: "التنسيق الآمن",
          description: "يبدأ التواصل المشفر بين المستخدم والجهة المستجيبة لمتابعة الحالة والوثائق والتعليمات.",
          icon: MessageCircle,
        },
        {
          title: "الحل والرؤى",
          description: "يتم إغلاق الحالة بعد الحل مع تجميع بيانات مجهولة لتحسين الرصد والتخطيط المؤسسي.",
          icon: Shield,
        },
      ]
    : [
        {
          title: "Request Entry",
          description: "Users submit SOS, healthcare, medication, or humanitarian requests with structured details and no location tracking.",
          icon: ClipboardList,
        },
        {
          title: "AI Triage",
          description: "AidLine analyzes the request type, urgency, and responder profile needed for the case.",
          icon: AlertTriangle,
        },
        {
          title: "Service Routing",
          description: "Requests are routed to the right healthcare, pharmacy, or humanitarian service network.",
          icon: Users,
        },
        {
          title: "Secure Coordination",
          description: "Encrypted messaging becomes the primary channel for instructions, follow-up, and case coordination.",
          icon: MessageCircle,
        },
        {
          title: "Resolution & Insights",
          description: "Cases close with anonymous operational data available for crisis intelligence and institutional dashboards.",
          icon: Shield,
        },
      ];

  const modules = isAr
    ? [
        {
          title: "شبكة الرعاية الصحية",
          description: "للإحالات الطبية والاستشارات والوصول إلى العيادات والمستشفيات.",
          icon: Stethoscope,
        },
        {
          title: "تنسيق الأدوية",
          description: "للتحقق من المخزون وتأكيد التوفر وتنسيق البدائل أو الحجز.",
          icon: Pill,
        },
        {
          title: "تنسيق المنظمات",
          description: "للدعم الإنساني وتقييم الحالات وقبولها ومتابعتها.",
          icon: Building2,
        },
        {
          title: "المراسلة الآمنة",
          description: "لقنوات التواصل المشفر ومشاركة المستندات والتحديثات.",
          icon: MessageCircle,
        },
      ]
    : [
        {
          title: "Healthcare Network",
          description: "Routes medical consultations, emergency care, and clinic or hospital access requests.",
          icon: Stethoscope,
        },
        {
          title: "Medication Coordination",
          description: "Handles stock confirmation, alternatives, reservations, and pharmacy instructions.",
          icon: Pill,
        },
        {
          title: "NGO Coordination",
          description: "Supports humanitarian intake, case acceptance, and aid management workflows.",
          icon: Building2,
        },
        {
          title: "Secure Messaging",
          description: "Keeps encrypted communication, document sharing, and follow-up in one channel.",
          icon: MessageCircle,
        },
      ];

  return (
    <section className="mx-auto mt-12 max-w-5xl px-4">
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {isAr ? "كيف يوجّه AidLine الطلبات" : "How AidLine Routes Requests"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {isAr
              ? "يعمل AidLine كمنصة فرز وتنسيق للخدمات، حيث يتم توجيه الطلبات حسب النوع والأولوية والجهة المناسبة، وليس حسب القرب الجغرافي."
              : "AidLine operates as a service coordination and triage platform where requests are routed by type, urgency, and responder capability instead of geographic proximity."}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {pipeline.map((step) => (
            <div key={step.title} className="rounded-xl border border-border bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {isAr ? "وحدات الخدمة الأساسية" : "Core Service Modules"}
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <div key={module.title} className="rounded-xl border border-border bg-background/80 p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <module.icon className="h-5 w-5" />
                </div>
                <h4 className="font-heading text-base font-semibold text-foreground">{module.title}</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RequestRoutingOverview;
