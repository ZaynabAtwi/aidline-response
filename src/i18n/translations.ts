export type Language = 'ar' | 'en';

export const translations = {
  // Navigation
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.shelters': { ar: 'الملاجئ', en: 'Shelters' },
  'nav.clinics': { ar: 'العيادات', en: 'Clinics' },
  'nav.medication': { ar: 'الأدوية', en: 'Medication' },
  'nav.volunteers': { ar: 'المتطوعون', en: 'Volunteers' },
  'nav.food': { ar: 'الطعام', en: 'Food' },
  'nav.sos': { ar: 'طوارئ', en: 'SOS' },

  // Home page
  'home.tagline': { ar: 'منصة تنسيق أزمات مركزية. قدّم طلبك وسيتم فرزه وتوجيهه للجهة المناسبة فوراً.', en: 'A centralized crisis coordination platform. Submit your request and it is triaged and routed to the right responder instantly.' },
  'home.sos': { ar: 'طوارئ SOS', en: 'SOS Emergency' },
  'home.findShelter': { ar: 'ابحث عن ملجأ', en: 'Find Shelter' },
  'home.findShelterDesc': { ar: 'نسّق طلب المأوى عبر جهات الدعم المسجلة', en: 'Coordinate shelter support through registered responders' },
  'home.findFood': { ar: 'ابحث عن طعام', en: 'Find Food' },
  'home.findFoodDesc': { ar: 'نسّق طلبات الدعم الغذائي عبر المنصة', en: 'Coordinate food assistance requests through the platform' },
  'home.findClinics': { ar: 'ابحث عن عيادات', en: 'Find Clinics' },
  'home.findClinicsDesc': { ar: 'الوصول إلى الشبكات الطبية المسجلة', en: 'Access registered healthcare and pharmacy networks' },
  'home.medication': { ar: 'الأدوية', en: 'Medication' },
  'home.medicationDesc': { ar: 'سجّل احتياجاتك الدوائية', en: 'Register medication needs' },
  'home.volunteer': { ar: 'تطوّع', en: 'Volunteer' },
  'home.volunteerDesc': { ar: 'سجّل مهاراتك واحصل على مهام', en: 'Register skills & get matched' },
  'home.activeShelters': { ar: 'ملاجئ نشطة', en: 'Active Shelters' },
  'home.volunteersCount': { ar: 'متطوعون', en: 'Volunteers' },
  'home.ngosActive': { ar: 'منظمات نشطة', en: 'NGOs Active' },

  // Shelters
  'shelters.title': { ar: 'الملاجئ', en: 'Shelters' },
  'shelters.subtitle': { ar: 'الملاجئ المتاحة ضمن شبكة المنصة مع حالة السعة الحالية.', en: 'Available shelters in the platform network with current capacity status.' },
  'shelters.available': { ar: 'متاح', en: 'available' },
  'shelters.gpsSearch': { ar: 'توجيه ذكي للطلبات', en: 'Smart request routing' },
  'shelters.manualSearch': { ar: 'البحث يدوياً', en: 'Manual Search' },
  'shelters.searchPlaceholder': { ar: 'ابحث عن ملجأ بالاسم أو العنوان...', en: 'Search by name or address...' },
  'shelters.locating': { ar: 'جاري توجيه الطلب...', en: 'Routing your request...' },
  'shelters.noResults': { ar: 'لا توجد ملاجئ', en: 'No shelters found' },

  // Clinics
  'clinics.title': { ar: 'العيادات والصيدليات', en: 'Clinics & Pharmacies' },
  'clinics.subtitle': { ar: 'المرافق الطبية المشاركة في المنصة مع تفاصيل الخدمات.', en: 'Medical facilities participating in the platform with service details.' },
  'clinics.open': { ar: 'مفتوح', en: 'Open' },
  'clinics.closed': { ar: 'مغلق', en: 'Closed' },

  // Medication
  'med.title': { ar: 'سجل الأدوية', en: 'Medication Registry' },
  'med.subtitle': { ar: 'سجّل احتياجات الأدوية المزمنة ليتم تلبيتها من المنظمات.', en: 'Register chronic medication needs for NGO fulfillment.' },
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
  'vol.title': { ar: 'المتطوعون', en: 'Volunteers' },
  'vol.subtitle': { ar: 'متطوعون ماهرون يتم توجيههم حسب نوع الطلب والأولوية.', en: 'Skilled volunteers are assigned by request type and urgency.' },
  'vol.register': { ar: 'سجّل كمتطوع', en: 'Register as Volunteer' },
  'vol.skills': { ar: 'المهارات', en: 'Skills' },
  'vol.selectSkills': { ar: 'اختر مهاراتك', en: 'Select your skills' },
  'vol.bio': { ar: 'نبذة عنك', en: 'About you' },
  'vol.bioPlaceholder': { ar: 'اكتب نبذة قصيرة...', en: 'Brief bio...' },
  'vol.submitRegistration': { ar: 'تسجيل', en: 'Register' },
  'vol.registered': { ar: '✓ تم التسجيل بنجاح', en: '✓ Registered Successfully' },
  'vol.loginRequired': { ar: 'يجب تسجيل الدخول للتسجيل كمتطوع', en: 'Login required to register' },
  'vol.available': { ar: 'متاح', en: 'available' },
  'vol.assigned': { ar: 'مكلّف', en: 'assigned' },
  'vol.unavailable': { ar: 'غير متاح', en: 'unavailable' },

  // SOS
  'sos.title': { ar: 'طوارئ SOS', en: 'SOS Emergency' },
  'sos.subtitle': { ar: 'أرسل تنبيه طوارئ ليتم تصنيفه وتوجيهه فوراً إلى جهة الاستجابة المناسبة.', en: 'Send an emergency alert that is immediately classified and routed to the right response team.' },
  'sos.placeholder': { ar: 'صف حالة الطوارئ (اختياري)...', en: 'Describe your emergency (optional)...' },
  'sos.locationAuto': { ar: 'يتم التوجيه عبر الفرز الذكي بدون مشاركة الموقع', en: 'Requests are triaged and routed without location sharing' },
  'sos.send': { ar: 'إرسال تنبيه SOS', en: 'SEND SOS ALERT' },
  'sos.sent': { ar: 'تم إرسال التنبيه', en: 'Alert Sent' },
  'sos.sentMessage': { ar: 'تم استقبال تنبيهك وإدخاله في مسار الفرز والتوجيه الآمن. ستتواصل معك جهة الاستجابة عبر المنصة.', en: 'Your alert was received and entered into secure triage and routing. A responder will coordinate with you through the platform.' },
  'sos.sendAnother': { ar: 'إرسال تنبيه آخر', en: 'Send Another Alert' },
  'sos.loginRequired': { ar: 'يجب تسجيل الدخول لإرسال تنبيه', en: 'Login required to send alert' },

  // Gas Stations
  'gas.title': { ar: 'محطات الوقود', en: 'Gas Stations' },
  'gas.subtitle': { ar: 'محطات الوقود حسب المنطقة مع حالة التشغيل.', en: 'Gas stations by district with operating status.' },
  'gas.searchPlaceholder': { ar: 'ابحث عن محطة بالاسم...', en: 'Search by station name...' },
  'gas.noResults': { ar: 'لا توجد محطات وقود', en: 'No gas stations found' },
  'nav.gas': { ar: 'الوقود', en: 'Gas' },
  'home.findGas': { ar: 'محطات الوقود', en: 'Gas Stations' },
  'home.findGasDesc': { ar: 'ابحث عن محطات الوقود المفتوحة', en: 'Find open gasoline stations' },

  // Chat
  'home.chat': { ar: 'الدردشة والدعم', en: 'Chat & Support' },
  'home.chatDesc': { ar: 'تواصل مع فريق الدعم بشكل مجهول', en: 'Contact support anonymously' },
  'nav.chat': { ar: 'الدعم', en: 'Support' },

  // Food
  'food.title': { ar: 'توزيع الطعام', en: 'Food Distribution' },
  'food.subtitle': { ar: 'طلبات الدعم الغذائي التي تتم إدارتها عبر شبكة المساعدة.', en: 'Food assistance requests managed through the service network.' },
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
