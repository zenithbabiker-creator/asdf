import { TurfSeedlingOption } from '../types';

// Turf / Grass seedlings options per square meter exclusively: 10, 15, 20, 25, 30 seedlings/m²
export const TURF_SEEDLING_OPTIONS: TurfSeedlingOption[] = [
  { value: 10, labelAr: '10 شتلات في المتر المربع (10 شتلة/م²)' },
  { value: 15, labelAr: '15 شتلة في المتر المربع (15 شتلة/م²)' },
  { value: 20, labelAr: '20 شتلة في المتر المربع (20 شتلة/م²)' },
  { value: 25, labelAr: '25 شتلة في المتر المربع (25 شتلة/م²)' },
  { value: 30, labelAr: '30 شتلة في المتر المربع (30 شتلة/م²)' },
];

export const PLANT_SELECTOR_DEFAULTS = [
  { type: 'large', nameAr: 'محدد كبير', widthM: 0.30, labelWidthAr: 'عرض 30 سم' },
  { type: 'medium', nameAr: 'محدد متوسط', widthM: 0.20, labelWidthAr: 'عرض 20 سم' },
  { type: 'small', nameAr: 'محدد صغير', widthM: 0.10, labelWidthAr: 'عرض 10 سم' },
] as const;

export const ARABIC_STRINGS = {
  appTitle: 'زون لتصاميم الحدائق',
  appSubtitle: 'Zone Garden Designs & Turf Seedlings Calculator',
  dualEngineTitle: 'محرك الواقع المعزز النشط',
  googleArCore: 'Google ARCore',
  huaweiArEngine: 'Huawei AR Engine SDK',
  huaweiDetectedNotice: 'تم اكتشاف جهاز هواتف هواوي/هونر دون خدمات جوجل - تم التوجيه تلقائياً إلى Huawei AR Engine (المكتبة المحلية ./huawei-ar-sdk/)',
  googleDetectedNotice: 'تم اكتشاف دعم خدمات Google Mobile Services - تم التوجيه تلقائياً إلى Google ARCore',
  
  navSurface: 'محددات النباتات وحساب شتول النجيلة',
  navDepthHole: 'قياس الحفر وحجم الردم',
  navAndroidExport: 'تصدير كود أندرويد Kotlin',
  navAiAssistant: 'المساعد الذكي للحدائق (Gemini)',

  // Feature A - Plant Selectors & Turf
  surfaceTitle: 'محددات النباتات وحساب العدد الكلي لشتول النجيلة (العشب)',
  surfaceDesc: 'قم بوضع محددات النباتات (كبير 30 سم، متوسط 20 سم، صغير 10 سم) وتحديد أطوالها لحجز مساحتها، ثم اختر عدد شتول النجيلة في المتر المربع لحساب العدد الكلي.',
  
  selectorsHeader: 'قوائم محددات النباتات والأصناف (Drop-down Selectors):',
  largeSelectorLabel: 'محدد كبير (عرض 30 سم / 0.30 م)',
  mediumSelectorLabel: 'محدد متوسط (عرض 20 سم / 0.20 م)',
  smallSelectorLabel: 'محدد صغير (عرض 10 سم / 0.10 م)',
  
  selectTurfThicknessLabel: 'اختر عدد شتول النجيلة في المتر المربع الواحد:',
  
  totalGardenAreaResult: 'المساحة الكلية للحديقة:',
  reservedSelectorsAreaResult: 'المساحة المحجوزة للمحددات والنباتات:',
  remainingTurfAreaResult: 'المساحة المتبقية للنجيلة (العشب):',
  turfVolumeResult: 'العدد الكلي لشتول النجيلة المطلوبة (المساحة المتبقية × عدد الشتلات للمتر):',
  
  // Feature B
  depthHoleTitle: 'قياس عمق الحفر والخنادق وحساب حجم الردم (Backfill)',
  depthHoleDesc: 'استخدام تقنية AR Depth API لمسح الحفر، الخنادق، والمناطق غير المستوية لحساب حجم التربة اللازمة لردمها وتسويتها.',
  maxDepthLabel: 'أقصى عمق للحفرة:',
  avgDepthLabel: 'متوسط العمق:',
  backfillVolumeLabel: 'حجم الردم المطلوب (Backfill Volume):',
  levelingTip: 'توصية التسوية: يفضل إضافة 10% حجم إضافي لتعويض انضغاط التربة بعد الدك والري.',

  // Camera & Canvas Controls
  startCamera: 'تشغيل الكاميرا الحية والواقع المعزز',
  stopCamera: 'إيقاف الكاميرا',
  clearPoints: 'إعادة ضبط النقاط',
  addPoint: 'إضافة نقطة قياس',
  autoScanHole: 'مسح عمق الحفرة تلقائياً (AR Depth)',
  simulatedEnvironment: 'وضع محاكاة الواقع المعزز (AR Simulator Grid)',
  cameraPermissionDenied: 'يرجى السماح بالوصول للكاميرا للبدء في استخدام القياس بالواقع المعزز.',
  
  // Export
  exportTitle: 'مشروع أندرويد الكامل المكتمل (100% Standalone Android App)',
  exportSubtitle: 'كود سورس كامل بلغة Kotlin وJetpack Compose مع إعدادات Gradle للمكتبة المحلية لـ Huawei AR Engine وكود Google ARCore.',
  copyCode: 'نسخ الكود',
  copiedSuccess: 'تم النسخ بنجاح!',
  downloadZip: 'تنزيل ملفات المشروع',
};
