import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" />
      {lang === 'ar' ? 'EN' : 'عربي'}
    </button>
  );
};

export default LanguageToggle;
