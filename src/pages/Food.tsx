import { useState, useEffect } from "react";
import { UtensilsCrossed, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

// Food distribution uses static data for now (no dedicated DB table yet)
const foodPoints = [
  { id: 1, name: "مركز التوزيع الرئيسي", nameEn: "Central Distribution Hub", address: "الساحة الرئيسية، المبنى 1", addressEn: "Main Square, Block 1", hours: "8:00 - 18:00", open: true, ngo: "WFP" },
  { id: 2, name: "مطبخ الرحمة", nameEn: "Al-Rahma Kitchen", address: "الحي 7، شارع 14", addressEn: "District 7, Street 14", hours: "10:00 - 14:00", open: true, ngo: "Local NGO" },
  { id: 3, name: "نقطة الوجبات المدرسية", nameEn: "School Meal Point", address: "حي التعليم", addressEn: "Education Quarter", hours: "12:00 - 15:00", open: false, ngo: "UNICEF" },
  { id: 4, name: "محطة غذاء المرفأ", nameEn: "Harbor Food Station", address: "منطقة المرفأ", addressEn: "Port District", hours: "7:00 - 20:00", open: true, ngo: "Red Cross" },
];

const Food = () => {
  const { t, lang } = useLanguage();

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center gap-3">
          <UtensilsCrossed className="h-8 w-8 text-success" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{t("food.title")}</h1>
        </div>
        <p className="mb-8 text-muted-foreground">{t("food.subtitle")}</p>

        <div className="space-y-4">
          {foodPoints.map((f) => (
            <div
              key={f.id}
              className={`rounded-xl border bg-card p-5 ${f.open ? "border-success/30" : "border-border opacity-60"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {lang === "ar" ? f.name : f.nameEn}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {lang === "ar" ? f.address : f.addressEn}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" /> {f.hours}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("common.by")}: {f.ngo}</p>
                </div>
                {f.open ? (
                  <span className="flex items-center gap-1 text-sm text-success">
                    <CheckCircle className="h-4 w-4" /> {t("food.open")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <XCircle className="h-4 w-4" /> {t("food.closed")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Food;
