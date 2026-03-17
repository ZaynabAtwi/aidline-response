export type Language = 'ar' | 'en';

export const translations = {
  // Navigation
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.shelters': { ar: 'الملاجئ', en: 'Shelters' },
  'nav.clinics': { ar: 'شبكة الرعاية الصحية', en: 'Healthcare Network' },
  'nav.medication': { ar: 'الأدوية', en: 'Medication' },
  'nav.volunteers': { ar: 'المتطوعون', en: 'Volunteers' },
  'nav.food': { ar: 'الطعام', en: 'Food' },
  'nav.sos': { ar: 'طوارئ', en: 'SOS' },

  // Home page
  'home.tagline': { ar: 'تنسيق الأزمات عبر توجيه الطلبات بشكل آمن. أرسل طلبات الطوارئ والرعاية الصحية والأدوية والدعم الإنساني دون مشاركة موقعك.', en: 'Crisis coordination through secure request routing. Submit emergency, healthcare, medication, and humanitarian requests without sharing your location.' },
  'home.sos': { ar: 'طوارئ SOS', en: 'SOS Emergency' },
  'home.findShelter': { ar: 'ابحث عن ملجأ', en: 'Find Shelter' },
  'home.findShelterDesc': { ar: 'اطلع على الملاجئ ومراكز الدعم التي تشاركها المنظمات الشريكة', en: 'View shelters and support centers shared by partner organizations' },
  'home.findFood': { ar: 'ابحث عن طعام', en: 'Find Food' },
  'home.findFoodDesc': { ar: 'نقاط توزيع الطعام والتغذية التي ينسقها الشركاء', en: 'Food and nutrition support points coordinated by partners' },
  'home.findClinics': { ar: 'شبكة الرعاية الصحية', en: 'Healthcare Network' },
  'home.findClinicsDesc': { ar: 'تصفّح العيادات والصيدليات الشريكة المسجلة على المنصة', en: 'Browse registered clinic and pharmacy partners in the platform network' },
  'home.medication': { ar: 'تنسيق الأدوية', en: 'Medication Coordination' },
  'home.medicationDesc': { ar: 'أرسل احتياجاتك الدوائية ليتم توجيهها والتحقق من التوفر', en: 'Submit medication needs for routing and availability checks' },
  'home.volunteer': { ar: 'شبكة المستجيبين', en: 'Responder Network' },
  'home.volunteerDesc': { ar: 'انضم إلى شبكة المستجيبين بمهاراتك ومدى توافرك', en: 'Join the responder network with your skills and availability' },
  'home.activeShelters': { ar: 'طلبات تم فرزها', en: 'Requests Triaged' },
  'home.volunteersCount': { ar: 'مستجيبون نشطون', en: 'Active Responders' },
  'home.ngosActive': { ar: 'منظمات شريكة', en: 'Partner NGOs' },

  // Shelters
  'shelters.title': { ar: 'الملاجئ', en: 'Shelters' },
  'shelters.subtitle': { ar: 'الملاجئ ومراكز الدعم التي تشاركها المنظمات الشريكة. اللون الأخضر يعني توفر أماكن.', en: 'Shelters and support centers shared by partner organizations. Green means spaces are available.' },
  'shelters.available': { ar: 'متاح', en: 'available' },
  'shelters.gpsSearch': { ar: 'البحث بالموقع', en: 'Search by GPS' },
  'shelters.manualSearch': { ar: 'البحث يدوياً', en: 'Manual Search' },
  'shelters.searchPlaceholder': { ar: 'ابحث عن ملجأ بالاسم أو العنوان...', en: 'Search by name or address...' },
  'shelters.locating': { ar: 'جاري تحديد موقعك...', en: 'Locating you...' },
  'shelters.noResults': { ar: 'لا توجد ملاجئ', en: 'No shelters found' },

  // Clinics
  'clinics.title': { ar: 'شبكة الرعاية الصحية', en: 'Healthcare Network' },
  'clinics.subtitle': { ar: 'العيادات والصيدليات الشريكة المتاحة عبر شبكة توجيه AidLine.', en: 'Registered clinic and pharmacy partners available through AidLine routing.' },
  'clinics.open': { ar: 'مفتوح', en: 'Open' },
  'clinics.closed': { ar: 'مغلق', en: 'Closed' },

  // Medication
  'med.title': { ar: 'تنسيق الأدوية', en: 'Medication Coordination' },
  'med.subtitle': { ar: 'أرسل احتياجاتك الدوائية ليتم توجيهها إلى الصيدليات والتحقق من التوفر وإرسال التعليمات اللاحقة.', en: 'Submit medication needs for pharmacy routing, availability checks, and follow-up instructions.' },
  'med.newRequest': { ar: 'طلب جديد', en: 'New Request' },
  'med.medication': { ar: 'الدواء', en: 'Medication' },
  'med.selectMed': { ar: 'اختر الدواء...', en: 'Select medication...' },
  'med.urgency': { ar: 'مستوى الاستعجال', en: 'Urgency Level' },
  'med.notes': { ar: 'ملاحظات (اختياري)', en: 'Notes (optional)' },
  'med.submit': { ar: 'إرسال الطلب', en: 'Submit Request' },
  'med.submitted': { ar: '✓ تم إرسال الطلب', en: '✓ Request Submitted' },
  'med.yourRequests': { ar: 'طلباتك', en: 'Your Requests' },
  'med.loginRequired': { ar: 'يجب تسجيل الدخول لإرسال طلب', en: 'Login required to submit a request' },
  'med.low': { ar: 'منخفض', en: 'low' },
  'med.medium': { ar: 'متوسط', en: 'medium' },
  'med.high': { ar: 'مرتفع', en: 'high' },
  'med.critical': { ar: 'حرج', en: 'critical' },

  // Volunteers
  'vol.title': { ar: 'شبكة المستجيبين', en: 'Responder Network' },
  'vol.subtitle': { ar: 'يتم تنسيق المستجيبين حسب المهارات والتوفر وأولوية الحالة.', en: 'Responders are coordinated by skills, availability, and case priority.' },
  'vol.register': { ar: 'انضم إلى الشبكة', en: 'Join Network' },
  'vol.skills': { ar: 'المهارات', en: 'Skills' },
  'vol.selectSkills': { ar: 'اختر مهاراتك', en: 'Select your skills' },
  'vol.bio': { ar: 'نبذة عنك', en: 'About you' },
  'vol.bioPlaceholder': { ar: 'اكتب نبذة قصيرة...', en: 'Brief bio...' },
  'vol.submitRegistration': { ar: 'انضم إلى شبكة المستجيبين', en: 'Join Responder Network' },
  'vol.registered': { ar: '✓ تم الانضمام إلى شبكة المستجيبين', en: '✓ Joined Responder Network' },
  'vol.loginRequired': { ar: 'يجب تسجيل الدخول للتسجيل كمتطوع', en: 'Login required to register' },
  'vol.available': { ar: 'متاح', en: 'available' },
  'vol.assigned': { ar: 'مكلّف', en: 'assigned' },
  'vol.unavailable': { ar: 'غير متاح', en: 'unavailable' },

  // SOS
  'sos.title': { ar: 'طوارئ SOS', en: 'SOS Emergency' },
  'sos.subtitle': { ar: 'أرسل طلب طوارئ ليتم فرزه فوراً وتوجيهه إلى فريق الاستجابة المناسب.', en: 'Send an emergency request for immediate triage and routing to the appropriate response team.' },
  'sos.placeholder': { ar: 'صف حالة الطوارئ (اختياري)...', en: 'Describe your emergency (optional)...' },
  'sos.locationAuto': { ar: 'سيتم تصنيف طلبك وتوجيهه دون تتبع للموقع', en: 'Your request will be classified and routed without location tracking' },
  'sos.send': { ar: 'إرسال تنبيه SOS', en: 'SEND SOS ALERT' },
  'sos.sent': { ar: 'تم إرسال التنبيه', en: 'Alert Sent' },
  'sos.sentMessage': { ar: 'دخل طلب SOS الخاص بك إلى قائمة الأولويات. سيتواصل معك أحد المستجيبين عبر المراسلة الآمنة.', en: 'Your SOS request has entered the priority queue. A responder will coordinate with you through secure messaging.' },
  'sos.sendAnother': { ar: 'إرسال تنبيه آخر', en: 'Send Another Alert' },
  'sos.loginRequired': { ar: 'يجب تسجيل الدخول لإرسال تنبيه', en: 'Login required to send alert' },

  // Gas Stations
  'gas.title': { ar: 'محطات الوقود', en: 'Gas Stations' },
  'gas.subtitle': { ar: 'محطات الوقود التي تشارك تحديثات التشغيل عبر المنصة.', en: 'Fuel stations sharing operating updates through the platform.' },
  'gas.searchPlaceholder': { ar: 'ابحث عن محطة بالاسم...', en: 'Search by station name...' },
  'gas.noResults': { ar: 'لا توجد محطات وقود', en: 'No gas stations found' },
  'nav.gas': { ar: 'الوقود', en: 'Gas' },
  'home.findGas': { ar: 'محطات الوقود', en: 'Gas Stations' },
  'home.findGasDesc': { ar: 'ابحث عن محطات الوقود المفتوحة', en: 'Find open gasoline stations' },

  // Chat
  'home.chat': { ar: 'المراسلة الآمنة', en: 'Secure Messaging' },
  'home.chatDesc': { ar: 'أرسل رسائل مشفرة وتابع تحديثات الحالة', en: 'Send encrypted messages and receive case updates' },
  'nav.chat': { ar: 'دردشة آمنة', en: 'Secure Chat' },

  // Food
  'food.title': { ar: 'توزيع الطعام', en: 'Food Distribution' },
  'food.subtitle': { ar: 'نقاط توزيع الطعام النشطة التي ينسقها الشركاء عبر AidLine.', en: 'Active food distribution points coordinated by partners through AidLine.' },
  'food.open': { ar: 'مفتوح', en: 'Open' },
  'food.closed': { ar: 'مغلق', en: 'Closed' },

  // Auth
  'auth.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'auth.signup': { ar: 'إنشاء حساب', en: 'Sign Up' },
  'auth.logout': { ar: 'تسجيل الخروج', en: 'Logout' },
  'auth.email': { ar: 'البريد الإلكتروني', en: 'Email' },
  'auth.password': { ar: 'كلمة المرور', en: 'Password' },
  'auth.fullName': { ar: 'الاسم الكامل', en: 'Full Name' },
  'auth.role': { ar: 'الدور', en: 'Role' },
  'auth.displaced': { ar: 'نازح', en: 'Displaced Person' },
  'auth.volunteer': { ar: 'متطوع', en: 'Volunteer' },
  'auth.ngoAdmin': { ar: 'مدير منظمة', en: 'NGO Admin' },
  'auth.noAccount': { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  'auth.hasAccount': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  'auth.forgotPassword': { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },

  // Common
  'common.loading': { ar: 'جاري التحميل...', en: 'Loading...' },
  'common.error': { ar: 'حدث خطأ', en: 'An error occurred' },
  'common.retry': { ar: 'إعادة المحاولة', en: 'Retry' },
  'common.by': { ar: 'بواسطة', en: 'By' },
} as const;

export type TranslationKey = keyof typeof translations;
