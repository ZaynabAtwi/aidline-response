import { useLanguage } from "@/i18n/LanguageContext";

export function AnnouncementBanner() {
  const { lang } = useLanguage();

  return (
    <div className="w-full bg-amber-500 text-black text-center py-2.5 px-4 text-sm font-medium">
      {lang === "ar"
        ? "🏠 بحاجة إلى ملجأ؟ تفضل بزيارة: "
        : "🏠 Need shelter? Visit: "}
      <a
        href="https://find.shelterslebanon.info"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-bold hover:text-white transition-colors"
      >
        find.shelterslebanon.info
      </a>
    </div>
  );
}
