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
  'home.tagline': { ar: 'منصة تنسيق أزمات آمنة: أرسل طلبك وسيتم تصنيفه وتوجيهه للجهة المناسبة فوراً.', en: 'A secure crisis coordination platform: submit your request and it is triaged and routed to the right responder instantly.' },
  'home.sos': { ar: 'طوارئ SOS', en: 'SOS Emergency' },
  'home.findShelter': { ar: 'ابحث عن ملجأ', en: 'Find Shelter' },
  'home.findShelterDesc': { ar: 'نسّق الحصول على مأوى عبر المنظمات', en: 'Coordinate shelter support through partner organizations' },
  'home.findFood': { ar: 'ابحث عن طعام', en: 'Find Food' },
  'home.findFoodDesc': { ar: 'نقاط توزيع الطعام النشطة', en: 'Active food distribution points' },
  'home.findClinics': { ar: 'ابحث عن عيادات', en: 'Find Clinics' },
  'home.findClinicsDesc': { ar: 'شبكة العيادات والصيدليات المشاركة', en: 'Connected clinics and pharmacies in the network' },
  'home.medication': { ar: 'الأدوية', en: 'Medication' },
  'home.medicationDesc': { ar: 'سجّل احتياجاتك الدوائية', en: 'Register medication needs' },
  'home.volunteer': { ar: 'تطوّع', en: 'Volunteer' },
  'home.volunteerDesc': { ar: 'سجّل مهاراتك واحصل على مهام', en: 'Register skills & get matched' },
  'home.activeShelters': { ar: 'ملاجئ نشطة', en: 'Active Shelters' },
  'home.volunteersCount': { ar: 'متطوعون', en: 'Volunteers' },
  'home.ngosActive': { ar: 'منظمات نشطة', en: 'NGOs Active' },

  // Shelters
  'shelters.title': { ar: 'الملاجئ', en: 'Shelters' },
  'shelters.subtitle': { ar: 'الملاجئ المتاحة ضمن شبكة الدعم. الأخضر يعني وجود أماكن متاحة.', en: 'Available shelters in the support network. Green means beds available.' },
  'shelters.available': { ar: 'متاح', en: 'available' },
  'shelters.gpsSearch': { ar: 'بحث الشبكة', en: 'Network Search' },
  'shelters.manualSearch': { ar: 'البحث يدوياً', en: 'Manual Search' },
  'shelters.searchPlaceholder': { ar: 'ابحث عن ملجأ بالاسم أو العنوان...', en: 'Search by name or address...' },
  'shelters.locating': { ar: 'جاري تحديد موقعك...', en: 'Locating you...' },
  'shelters.noResults': { ar: 'لا توجد ملاجئ', en: 'No shelters found' },

  // Clinics
  'clinics.title': { ar: 'العيادات والصيدليات', en: 'Clinics & Pharmacies' },
  'clinics.subtitle': { ar: 'المرافق الطبية المتاحة ضمن الشبكة مع تفاصيل الخدمات.', en: 'Medical facilities available in the network with service details.' },
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
  'vol.subtitle': { ar: 'متطوعون ماهرون يتم تكليفهم حسب نوع الطلب والأولوية.', en: 'Skilled volunteers are assigned based on request type and priority.' },
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
  'sos.subtitle': { ar: 'أرسل تنبيه طوارئ وسيتم تصنيفه وتوجيهه فوراً للمستجيب المناسب.', en: 'Send an emergency alert and it will be triaged and routed to the appropriate responder immediately.' },
  'sos.placeholder': { ar: 'صف حالة الطوارئ (اختياري)...', en: 'Describe your emergency (optional)...' },
  'sos.locationAuto': { ar: 'لا يتم جمع الموقع. يتم التوجيه حسب التصنيف والأولوية.', en: 'No location data is collected. Routing is based on classification and priority.' },
  'sos.send': { ar: 'إرسال تنبيه SOS', en: 'SEND SOS ALERT' },
  'sos.sent': { ar: 'تم إرسال التنبيه', en: 'Alert Sent' },
  'sos.sentMessage': { ar: 'تم استلام طلب SOS وتصنيفه وتوجيهه إلى الجهة المناسبة. ستتلقى المتابعة عبر القناة الآمنة.', en: 'Your SOS request has been received, triaged, and routed to the right responder. Follow-up will continue in the secure channel.' },
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
  'food.subtitle': { ar: 'نقاط توزيع الطعام النشطة ضمن شبكة الاستجابة.', en: 'Active food distribution points across the response network.' },
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
