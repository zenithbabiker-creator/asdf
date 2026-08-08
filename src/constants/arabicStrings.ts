import { SoilType } from '../types';

export const DEPTH_STEPS = Array.from({ length: 19 }, (_, i) => {
  const depthM = parseFloat(((i + 1) * 0.05).toFixed(2));
  const cm = Math.round(depthM * 100);
  return {
    valueM: depthM,
    labelAr: `${depthM.toFixed(2)} م (${cm} سم)`,
    labelShortAr: `${depthM.toFixed(2)} م`,
  };
});

export const DEFAULT_SOIL_TYPES: SoilType[] = [
  {
    id: 'topsoil',
    nameAr: 'تربة زراعية خفيفة (Topsoil)',
    nameEn: 'Agricultural Topsoil',
    densityKgPerM3: 1250,
    descriptionAr: 'تربة حديقة خفيفة ممتازة لزراعة الزهور والنباتات العشبية والنجيل.',
    recommendedForAr: 'الحدائق المنزليّة والنباتات الخارجية',
  },
  {
    id: 'compost_mix',
    nameAr: 'خليط سماد عضوي وتربة (Compost Mix)',
    nameEn: 'Compost & Soil Mix',
    densityKgPerM3: 950,
    descriptionAr: 'تربة غنية بالمواد المغذية والمواد العضوية تحافظ على الرطوبة.',
    recommendedForAr: 'أحواض الخضروات والشجيرات المثمرة',
  },
  {
    id: 'potting_soil',
    nameAr: 'بيتموس وتربة أصص (Peat Moss)',
    nameEn: 'Peat Moss & Potting Mix',
    densityKgPerM3: 750,
    descriptionAr: 'تربة خفيفة ومسامية جداً جيدة التهوية وحفظ المياه.',
    recommendedForAr: 'الزهور والأحواض المرتفعة والأصص',
  },
  {
    id: 'sandy_loam',
    nameAr: 'تربة رملية طميية (Sandy Loam)',
    nameEn: 'Sandy Loam',
    densityKgPerM3: 1450,
    descriptionAr: 'تربة جيدة الصرف ومناسبة للمناطق الحارة والحدائق الخارجية.',
    recommendedForAr: 'الأشجار الكبيرة والمسطحات الخضراء المفتوحة',
  },
  {
    id: 'heavy_clay',
    nameAr: 'تربة طينية مخصبة (Enriched Clay)',
    nameEn: 'Enriched Clay Soil',
    densityKgPerM3: 1600,
    descriptionAr: 'تربة ثقيلة تحتفظ بالماء بشكل عالي وتحتاج لتعديل تهوية.',
    recommendedForAr: 'أشجار الفاكهة والصدات',
  },
];

export const ARABIC_STRINGS = {
  appTitle: 'زون لتصاميم الحدائق',
  appSubtitle: 'Zone Garden Designs & AR Soil Calculator',
  dualEngineTitle: 'محرك الواقع المعزز النشط',
  googleArCore: 'Google ARCore',
  huaweiArEngine: 'Huawei AR Engine SDK',
  huaweiDetectedNotice: 'تم اكتشاف جهاز هواتف هواوي/هونر دون خدمات جوجل - تم التوجيه تلقائياً إلى Huawei AR Engine (المكتبة المحلية ./huawei-ar-sdk/)',
  googleDetectedNotice: 'تم اكتشاف دعم خدمات Google Mobile Services - تم التوجيه تلقائياً إلى Google ARCore',
  
  navSurface: 'قياس المسطحات والتربة (Feature A)',
  navDepthHole: 'قياس الحفر وحجم الردم (Feature B)',
  navAndroidExport: 'تصدير كود أندرويد Kotlin',
  navAiAssistant: 'المساعد الذكي للتربة (Gemini)',

  // Feature A
  surfaceTitle: 'قياس مساحة السطح وحساب كمية التربة المطلوبة',
  surfaceDesc: 'قم بمسح سطح الأرض بالواقع المعزز، حدد النقاط لحساب المساحة، واختر سمك التربة المطلوب من القائمة.',
  selectDepthLabel: 'حدد سمك / عمق التربة المطلوب (متر / سم):',
  selectSoilTypeLabel: 'نوع التربة أو الخليط الزراعي:',
  surfaceAreaResult: 'المساحة السطحية:',
  volumeResult: 'حجم التربة المطلوبة:',
  soilWeightResult: 'الوزن التقديري للتربة:',
  bags50LCount: 'عدد أكياس التربة (سعة 50 ليتر):',
  bags25LCount: 'عدد أكياس التربة (سعة 25 ليتر):',
  costEstimate: 'التكلفة التقديرية (بناءً على متوسط 25 ر.س / 50L):',
  
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
