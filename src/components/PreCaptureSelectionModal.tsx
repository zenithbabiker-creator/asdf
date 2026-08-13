import React from 'react';
import { PreCaptureMeasurementMode } from '../types';
import { 
  Ruler, 
  TrendingDown, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Camera, 
  Target, 
  Maximize2, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface PreCaptureSelectionModalProps {
  isOpen: boolean;
  selectedMode: PreCaptureMeasurementMode;
  onSelectMode: (mode: PreCaptureMeasurementMode) => void;
  onClose?: () => void;
}

export const PreCaptureSelectionModal: React.FC<PreCaptureSelectionModalProps> = ({
  isOpen,
  selectedMode,
  onSelectMode,
  onClose,
}) => {
  if (!isOpen) return null;

  const modesConfig = [
    {
      id: 'REAL_AREA' as PreCaptureMeasurementMode,
      title: 'حساب المساحة الحقيقية (Real Area)',
      subtitle: 'لقياس أبعاد السطح (الطول والعرض) والمساحة بالمتر المربع والسم²',
      icon: Ruler,
      colorTheme: 'emerald',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-300',
      activeBorder: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-100/90',
      iconBg: 'bg-emerald-600 text-white',
      badgeText: 'قياس السطح والأضلاع 📐',
      features: [
        'معايرة تتبع الأسطح الأفقية لحساب الأطوال والمساحة.',
        'إظهار القياسات الفيزيائية بالسنتيمتر المربع والأمتار فوراً.',
        'حساب مساحة الحديقة المتبقية لشتول النجيلة.',
      ],
    },
    {
      id: 'REAL_DEPTH' as PreCaptureMeasurementMode,
      title: 'حساب العمق الحقيقي (Real Depth)',
      subtitle: 'لقياس المسافة والعمق بين الكاميرا والهدف بدقة',
      icon: TrendingDown,
      colorTheme: 'amber',
      bgColor: 'bg-amber-50 hover:bg-amber-100/80 border-amber-300',
      activeBorder: 'ring-2 ring-amber-500 border-amber-500 bg-amber-100/90',
      iconBg: 'bg-amber-600 text-white',
      badgeText: 'مستشعر العمق AR Depth 🎯',
      features: [
        'استخدام مستشعر العمق TrueDepth لقياس المسافة الحقيقية.',
        'مسح عمق الحفر والخنادق ومستوى الأرض غير المستوية.',
        'حساب حجم الردم (Backfill Volume) بالمتر المكعب.',
      ],
    },
    {
      id: 'REAL_AREA_AND_DEPTH' as PreCaptureMeasurementMode,
      title: 'حساب المساحة والعمق الحقيقي معاً',
      subtitle: 'القياس الكامل المزدوج لأبعاد السطح والعمق والمسافة بنفس الوقت',
      icon: Layers,
      colorTheme: 'teal',
      bgColor: 'bg-teal-50 hover:bg-teal-100/80 border-teal-300',
      activeBorder: 'ring-2 ring-teal-500 border-teal-500 bg-teal-100/90',
      iconBg: 'bg-teal-700 text-white',
      badgeText: 'قياس مزدوج شامـل ⚡',
      features: [
        'تراكب حي متزامن لأبعاد السطح + خريطة العمق الفيزيائية.',
        'عرض أرقام المساحة والمسافة/العمق معاً على بث الكاميرا المباشر.',
        'دقة كاملة مطابقة للواقع الفعلي للمادة أو المساحة المقاسة.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in dir-rtl" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header Title */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <Zap className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>نظام القياس الفيزيائي الحقيقي (Pre-Capture Measurement Mode)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            شاشة اختيار وضع القياس قبل الكاميرا
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            اختر أحد الأوضاع الخمسة القادمة لمعايرة مستشعرات الجهاز وإظهار نتائج القياس الحقيقي (المساحة أو العمق) مباشرة على الشاشة فور توجيه الكاميرا وقبل التقاط الصورة.
          </p>
        </div>

        {/* 3 Exclusive Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modesConfig.map((mode) => {
            const IconComp = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`cursor-pointer border p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs relative group ${
                  isSelected ? mode.activeBorder : mode.bgColor
                }`}
              >
                {/* Badge Tag */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-700">
                    {mode.badgeText}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                </div>

                {/* Main Content */}
                <div className="space-y-2">
                  <div className={`w-12 h-12 rounded-xl ${mode.iconBg} flex items-center justify-center shadow-md`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {mode.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {mode.subtitle}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-700">
                  {mode.features.map((ft, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span className="leading-tight">{ft}</span>
                    </div>
                  ))}
                </div>

                {/* Select Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMode(mode.id);
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'الوضع المختار ✅' : 'اختيار الوضع وتفعيل البث'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Physical Sensor Calibration Guarantee Banner */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-emerald-300 block">دقة فيزيائية حقيقية (Physical Depth Calibration)</span>
              <span className="text-[11px] text-slate-300">
                تعتمد الحسابات على مستشعرات الكاميرا الحقيقية ومستشعر العمق TrueDepth بدلاً من التقديرات البصرية.
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all whitespace-nowrap"
            >
              متابعة للبث المباشر 📸
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
