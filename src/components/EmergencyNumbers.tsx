import { useState } from "react";
import { Phone, Copy, Check, ChevronDown } from "lucide-react";

interface EmergencyNumber {
  number: string;
  label: string;
}

interface RegionNumbers {
  region: string;
  numbers: string[];
}

const officialNumbers: EmergencyNumber[] = [
  { number: "125", label: "الدفاع المدني" },
  { number: "112", label: "الأمن الداخلي" },
  { number: "140", label: "الصليب الأحمر" },
  { number: "175", label: "فوج الإطفاء" },
];

const supportNumbers: EmergencyNumber[] = [
  { number: "1787", label: "للحالات الطارئة" },
  { number: "1214", label: "لمرضى السرطان والمستعصية" },
  { number: "1264", label: "لخدمات الصحة النفسية" },
];

const regionalHotlines: RegionNumbers[] = [
  { region: "بيروت", numbers: ["01987002", "01987001", "71028975"] },
  { region: "الجنوب", numbers: ["81070081", "07720081"] },
  { region: "جبل لبنان", numbers: ["8103391", "05924225"] },
  { region: "النبطية", numbers: ["76873806"] },
  { region: "بعلبك – الهرمل", numbers: ["71017261"] },
  { region: "البقاع", numbers: ["81479342", "08808211"] },
  { region: "عكار", numbers: ["79303470", "79303476"] },
  { region: "الشمال", numbers: ["79380421", "06443120"] },
];

const PhoneButton = ({ number, large = false }: { number: string; large?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: just call
      window.location.href = `tel:${number}`;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`tel:${number}`}
        className={`flex items-center gap-2 font-mono font-bold transition-colors ${
          large ? "text-2xl" : "text-lg"
        }`}
        dir="ltr"
      >
        <Phone className={large ? "h-5 w-5" : "h-4 w-4"} />
        {number}
      </a>
      <button
        onClick={handleCopy}
        className="hidden rounded-md bg-background/20 p-1.5 transition-colors hover:bg-background/30 md:flex"
        title="Copy number"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
};

const EmergencyNumbers = () => {
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set());

  const toggleRegion = (region: string) => {
    setOpenRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  return (
    <div className="w-full space-y-8" dir="rtl">
      {/* Section Header */}
      <h2 className="text-center font-heading text-2xl font-bold text-foreground">
        أرقام الطوارئ والدعم
      </h2>

      {/* 1: Official Emergency Numbers */}
      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">
          🚨 الأرقام الرسمية للطوارئ
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {officialNumbers.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="flex min-h-[64px] items-center justify-between rounded-xl bg-destructive p-5 text-destructive-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-base font-semibold">{item.label}</span>
              <PhoneButton number={item.number} large />
            </a>
          ))}
        </div>
      </div>

      {/* 2: Support Numbers */}
      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">
          📞 أرقام الدعم الإضافية
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {supportNumbers.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="flex min-h-[56px] items-center justify-between rounded-xl bg-destructive/85 p-4 text-destructive-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="text-sm font-semibold">{item.label}</span>
              <PhoneButton number={item.number} />
            </a>
          ))}
        </div>
      </div>

      {/* 3: Regional Hotlines */}
      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">
          📍 الخطوط الساخنة حسب المنطقة
        </h3>
        <div className="space-y-2">
          {regionalHotlines.map((region) => {
            const isOpen = openRegions.has(region.region);
            return (
              <div key={region.region} className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  onClick={() => toggleRegion(region.region)}
                  className="flex w-full min-h-[52px] items-center justify-between px-5 py-3 text-start font-heading font-semibold text-foreground transition-colors hover:bg-secondary/50"
                >
                  <span>{region.region}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border px-5 py-4 space-y-3">
                    {region.numbers.map((num) => (
                      <a
                        key={num}
                        href={`tel:${num}`}
                        className="flex min-h-[48px] items-center justify-between rounded-lg bg-secondary/60 px-4 py-3 transition-colors hover:bg-secondary"
                      >
                        <span className="text-sm text-muted-foreground">اتصل</span>
                        <span className="font-mono text-lg font-bold text-foreground" dir="ltr">
                          <Phone className="mr-2 inline h-4 w-4" />
                          {num}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmergencyNumbers;
