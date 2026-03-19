import { useLanguage } from "@/i18n/LanguageContext";

export function AnnouncementBanner() {
  const { lang } = useLanguage();

  return (
     <div className="w-full bg-amber-500 px-4 py-2.5 text-center text-sm font-medium text-black">
      {lang === "ar"
          ? "يُوجّه AidLine الطلبات حسب الحاجة والأولوية من دون GPS أو تتبع للموقع. "
        : "AidLine routes requests by need and urgency without GPS or location tracking. "}
      <Link
        to="/chat"
        className="font-bold underline transition-colors hover:text-white"
      >
        {lang === "ar" ? "افتح قناة الدعم الآمنة" : "Open the secure support channel"}
      </Link>
    </div>
  );
}
