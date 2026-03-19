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
   'home.tagline': { ar: 'نسّق طلبات الأزمات حسب الحاجة والأولوية. يوجّه AidLine الرعاية الصحية والأدوية والدعم الإنساني عبر قنوات آمنة من دون تتبع الموقع.', en: 'Coordinate crisis requests by need and urgency. AidLine routes healthcare, medication, and humanitarian support through secure channels without location tracking.' },
  'home.sos': { ar: 'طوارئ SOS', en: 'SOS Emergency' },
  'home.findShelter': { ar: 'ابحث عن ملجأ', en: 'Find Shelter' },
  'home.findShelterDesc': { ar: 'اطّلع على الملاجئ المتاحة ضمن شبكة الاستجابة', en: 'View available shelters across the response network' },
  'home.findFood': { ar: 'ابحث عن طعام', en: 'Find Food' },
  'home.findFoodDesc': { ar: 'نقاط توزيع الطعام النشطة', en: 'Active food distribution points' },
  'home.findClinics': { ar: 'ابحث عن عيادات', en: 'Find Clinics' },
 'home.medicationDesc': { ar: 'وجّه احتياجات الأدوية إلى الصيدليات وشركاء الدعم', en: 'Route medication needs to pharmacies and aid partners' },
  'home.medication': { ar: 'الأدوية', en: 'Medication' },
  'home.medicationDesc': { ar: 'سجّل احتياجاتك الدوائية', en: 'Register medication needs' },
  'home.volunteer': { ar: 'تطوّع', en: 'Volunteer' },
  'home.volunteerDesc': { ar: 'home.volunteerDesc': { ar: 'سجّل مهاراتك للمهام المنظمة', en: 'Register skills for structured assignments' },
  'home.activeShelters': { ar: 'ملاجئ نشطة', en: 'Active Shelters' },
  'home.volunteersCount': { ar: 'متطوعون', en: 'Volunteers' },
  'home.ngosActive': { ar: 'منظمات نشطة', en: 'NGOs Active' },

   'home.pipelineTitle': { ar: 'كيف يعمل AidLine بدون موقع', en: 'How AidLine works without location data' },
  'home.pipelineSubtitle': { ar: 'تنتقل كل حالة من الإدخال إلى الفرز ثم التوجيه والاتصال الآمن حتى الإغلاق، بينما تغذي البيانات المجهولة لوحات التحليل المؤسسي.', en: 'Every case moves from intake to triage, routing, secure communication, and resolution, while anonymous data feeds institutional intelligence.' },
  'home.pipeline.request.title': { ar: 'إدخال الطلب', en: 'Request entry' },
  'home.pipeline.request.body': { ar: 'يرسل المستخدم نوع المساعدة والوصف ومستوى الاستعجال والمرفقات الاختيارية.', en: 'The user submits assistance type, description, urgency, and any optional attachments.' },
  'home.pipeline.triage.title': { ar: 'الفرز الذكي', en: 'AI triage' },
  'home.pipeline.triage.body': { ar: 'يتم تصنيف الحالة تلقائياً حسب الفئة والأولوية ونوع المستجيب المطلوب.', en: 'The case is automatically classified by category, priority, and responder type.' },
  'home.pipeline.routing.title': { ar: 'توجيه الخدمة', en: 'Service routing' },
  'home.pipeline.routing.body': { ar: 'تُرسل الحالة إلى شبكة الرعاية الصحية أو الأدوية أو تنسيق المنظمات بحسب الحاجة.', en: 'The case is routed to healthcare, medication, or NGO coordination based on need.' },
  'home.pipeline.communication.title': { ar: 'اتصال آمن', en: 'Secure communication' },
  'home.pipeline.communication.body': { ar: 'بعد قبول الحالة تصبح الرسائل الآمنة قناة التنسيق الأساسية مع المستخدم.', en: 'Once accepted, secure messaging becomes the primary coordination channel with the user.' },
  'home.pipeline.resolution.title': { ar: 'حل الحالة', en: 'Case resolution' },
  'home.pipeline.resolution.body': { ar: 'يقدم المستجيب التعليمات أو التأكيد أو المتابعة حتى إغلاق الحالة.', en: 'Responders provide instructions, confirmations, or follow-up until the case is closed.' },
  'home.pipeline.intelligence.title': { ar: 'ذكاء الأزمات', en: 'Crisis intelligence' },
  'home.pipeline.intelligence.body': { ar: 'تُجمع المؤشرات المجهولة لإظهار أحجام الطلبات والضغط على الخدمات واتجاهات النقص.', en: 'Anonymous metrics are aggregated to expose request volumes, service stress, and shortage trends.' },
  'shelters.gpsSearch': { ar: 'نظرة على التوجيه', en: 'Routing overview' },
  'shelters.manualSearch': { ar: 'استعراض الخدمات', en: 'Browse services' },
                           'shelters.searchPlaceholder': { ar: 'ابحث عن ملجأ بالاسم أو العنوان...', en: 'Search by name or address...' },
  'shelters.locating': { ar: 'جاري تحديد موقعك...', en: 'Locating you...' },
  'shelters.noResults': { ar: 'لا توجد ملاجئ', en: 'No shelters found' },
                         
  
  // Clinics
  'clinics.title': { ar: 'العيادات والصيدليات', en: 'Clinics & Pharmacies' },
  'clinics.subtitle': { ar: 'المرافق الطبية المتاحة داخل شبكة AidLine مع تفاصيل الخدمات.', en: 'Medical facilities available in the AidLine network with service details.' },
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
  'vol.subtitle': { ar: 'متطوعون ماهرون يتم تكليفهم حسب الأولوية والخبرة.', en: 'Skilled volunteers assigned by priority and expertise.' },
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
  'sos.subtitle': { ar: 'أرسل تنبيه طوارئ ليتم تصنيفه وتوجيهه فوراً إلى الجهات المناسبة.', en: 'Send an emergency alert for immediate triage and routing to the right responders.' },
  'sos.placeholder': { ar: 'صف حالة الطوارئ (اختياري)...', en: 'Describe your emergency (optional)...' },
  'sos.locationAuto': { ar: 'لا يتم جمع أي بيانات موقع', en: 'No location data is collected' },
  'sos.send': { ar: 'إرسال تنبيه SOS', en: 'SEND SOS ALERT' },
  'sos.sent': { ar: 'تم إرسال التنبيه', en: 'Alert Sent' },
  'sos.sentMessage': { ar: 'تم إرسال تنبيهك إلى محرك الفرز والتوجيه وسيتم التواصل معك عبر القناة الآمنة.', en: 'Your alert was sent to the triage and routing engine. Responders will contact you through secure messaging.' },
  'sos.sendAnother': { ar: 'إرسال تنبيه آخر', en: 'Send Another Alert' },
  'sos.loginRequired': { ar: 'يجب تسجيل الدخول لإرسال تنبيه', en: 'Login required to send alert' },


  // Chat
  'home.chat': { ar: 'الدردشة والدعم', en: 'Chat & Support' },
  'home.chatDesc': { ar: 'تواصل مع فريق الدعم بشكل مجهول', en: 'Contact support anonymously' },
  'nav.chat': { ar: 'الدعم', en: 'Support' },

  // Food
  'food.title': { ar: 'توزيع الطعام', en: 'Food Distribution' },
  'food.subtitle': { ar: 'نقاط توزيع الطعام النشطة داخل شبكة المنصة.', en: 'Active food distribution points within the platform network.' },
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
