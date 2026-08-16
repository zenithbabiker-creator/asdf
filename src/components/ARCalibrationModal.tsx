import React, { useState } from 'react';
import { 
  ReferenceCalibrationObject, 
  CalibrationSettings, 
  LiveSensorOrientation 
} from '../types';
import { 
  STANDARD_CALIBRATION_OBJECTS, 
  computeCalibrationScaleFactor,
  computeLinearCalibrationScaleFactor 
} from '../utils/arPrecisionMath';
import { 
  Sliders, 
  CheckCircle2, 
  Compass, 
  Maximize2, 
  Ruler, 
  RotateCcw, 
  Info, 
  X, 
  Sparkles,
  Smartphone,
  Layers,
  Check
} from 'lucide-react';

interface ARCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CalibrationSettings;
  onUpdateSettings: (newSettings: CalibrationSettings) => void;
  sensorOrientation: LiveSensorOrientation;
  currentMeasuredAreaM2: number;
  currentMeasuredPerimeterM: number;
}

export const ARCalibrationModal: React.FC<ARCalibrationModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  sensorOrientation,
  currentMeasuredAreaM2,
  currentMeasuredPerimeterM,
}) => {
  const [selectedRefObjId, setSelectedRefObjId] = useState<string>(
    settings.activeReferenceObject?.id || 'calib_a4'
  );
  const [customRealWidthCm, setCustomRealWidthCm] = useState<number>(100);
  const [customRealHeightCm, setCustomRealHeightCm] = useState<number>(100);
  const [customRealLengthM, setCustomRealLengthM] = useState<number>(1.0);
  const [calibrationFeedback, setCalibrationFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedRef = STANDARD_CALIBRATION_OBJECTS.find((o) => o.id === selectedRefObjId);

  // Apply calibration using currently selected reference object
  const handleApplyReferenceCalibration = () => {
    if (!selectedRef) return;

    if (currentMeasuredAreaM2 <= 0.0001) {
      setCalibrationFeedback('يرجى تحديد أو رسم حدود الجسم المرجعي أولاً على الشاشة قبل الضغط على المعايرة.');
      return;
    }

    const calculatedFactor = computeCalibrationScaleFactor(
      currentMeasuredAreaM2,
      selectedRef.realAreaM2
    );

    onUpdateSettings({
      ...settings,
      scaleFactor: calculatedFactor,
      activeReferenceObject: selectedRef,
    });

    setCalibrationFeedback(
      `تمت المعايرة بنجاح! تم تطبيق معامل تصحيح الدقة (${calculatedFactor.toFixed(3)}x) بناءً على ${selectedRef.nameAr}.`
    );
  };

  // Apply custom linear calibration
  const handleApplyCustomLinearCalibration = () => {
    if (currentMeasuredPerimeterM <= 0.01) {
      setCalibrationFeedback('يرجى رسم أو تحديد نقطتين على الأقل على الشاشة قبل المعايرة.');
      return;
    }

    // Estimate first edge or perimeter
    const calculatedFactor = computeLinearCalibrationScaleFactor(
      currentMeasuredPerimeterM,
      customRealLengthM
    );

    onUpdateSettings({
      ...settings,
      scaleFactor: calculatedFactor,
    });

    setCalibrationFeedback(
      `تمت المعايرة الخطية بنجاح! معامل التصحيح الجديد: (${calculatedFactor.toFixed(3)}x).`
    );
  };

  // Reset to factory defaults
  const handleResetCalibration = () => {
    onUpdateSettings({
      ...settings,
      scaleFactor: 1.0,
      cameraHeightM: 1.40,
      useLiveSensorOrientation: true,
      orthogonalSnapEnabled: false,
      activeReferenceObject: undefined,
    });
    setCalibrationFeedback('تمت استعادة إعدادات المعايرة الافتراضية بنجاح (1.000x).');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                منظومة المعايرة والضبط المكاني المتكاملة
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AR Precision Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ضبط مقاييس الكاميرا وحساسات الميل ومعايرة الأبعاد للحصول على دقة 100%
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Feedback notification */}
          {calibrationFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{calibrationFeedback}</span>
            </div>
          )}

          {/* Section 1: Live Sensor Status */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                حساسات التوجيه والميل الحية (Device Orientation)
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                sensorOrientation.isAvailable 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {sensorOrientation.isAvailable ? 'حساسات نشطة ومربوطة' : 'محاكاة رياضية ثابتة'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block mb-1">زاوية الميل للأرض (Pitch)</span>
                <span className="text-sm font-bold text-white font-mono">
                  {sensorOrientation.pitchDeg.toFixed(1)}°
                </span>
                <span className={`text-[9px] block mt-0.5 ${
                  sensorOrientation.isOptimalGroundAngle ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {sensorOrientation.isOptimalGroundAngle ? 'زاوية مثالية' : 'مائل جداً/أفقي'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block mb-1">الميلان الجانبي (Roll)</span>
                <span className="text-sm font-bold text-white font-mono">
                  {sensorOrientation.rollDeg.toFixed(1)}°
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {Math.abs(sensorOrientation.rollDeg) < 5 ? 'مستوي وموزون' : 'انحراف جانبي'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block mb-1">معامل التصحيح (Scale)</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {settings.scaleFactor.toFixed(3)}x
                </span>
                <span className="text-[9px] text-emerald-300 block mt-0.5">
                  {settings.scaleFactor === 1.0 ? 'قياسي (1:1)' : 'مصحح بدقة'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Camera Height Setting */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-emerald-400" />
                ارتفاع الهاتف عن سطح الأرض (Camera Height)
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {settings.cameraHeightM.toFixed(2)} م ({Math.round(settings.cameraHeightM * 100)} سم)
              </span>
            </div>

            {/* Quick Height Presets */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'وقوف قياسي (1.40 م)', height: 1.40 },
                { label: 'انحناء / ركوع (0.85 م)', height: 0.85 },
                { label: 'ماكرو / قريب (0.40 م)', height: 0.40 },
              ].map((preset) => (
                <button
                  key={preset.height}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, cameraHeightM: preset.height })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                    Math.abs(settings.cameraHeightM - preset.height) < 0.05
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="pt-2">
              <input
                type="range"
                min="0.20"
                max="2.20"
                step="0.05"
                value={settings.cameraHeightM}
                onChange={(e) => onUpdateSettings({ ...settings, cameraHeightM: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.20 م (قريب جداً)</span>
                <span>1.40 م (مستوى الصدر)</span>
                <span>2.20 م (مرتفع)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Reference Object Calibration */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                المعايرة الذاتية بجسم مرجعي حقيقي (One-Tap Reference Calibration)
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              ضع جسماً معلوم القياس على الأرض، وحدد حدوده على شاشة الكاميرا، ثم اضغط "معايرة فورية" ليقوم النظام بضبط معامل الدقة تلقائياً:
            </p>

            <div className="space-y-2">
              {STANDARD_CALIBRATION_OBJECTS.map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => setSelectedRefObjId(obj.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedRefObjId === obj.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedRefObjId === obj.id ? 'border-emerald-400 bg-emerald-500' : 'border-slate-500'
                    }`}>
                      {selectedRefObjId === obj.id && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{obj.nameAr}</span>
                      <span className="text-[10px] text-slate-400">{obj.descriptionAr}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                    {(obj.realAreaM2 * 10000).toFixed(0)} سم²
                  </span>
                </div>
              ))}
            </div>

            {/* Current measurement info */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/70 text-xs flex items-center justify-between">
              <span className="text-slate-400">المساحة المقاسة حالياً على الشاشة:</span>
              <span className="font-mono font-bold text-white">
                {currentMeasuredAreaM2 > 0 
                  ? `${currentMeasuredAreaM2.toFixed(4)} م² (${(currentMeasuredAreaM2 * 10000).toFixed(0)} سم²)` 
                  : 'لم يتم رسم أي مضلع بعد'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleApplyReferenceCalibration}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              تطبيق المعايرة الفورية الآن
            </button>
          </div>

          {/* Section 4: Manual Scale Factor & Orthogonal Snapping */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                الضبط المخصص والتعامد التلقائي
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
              <div>
                <span className="text-xs font-bold text-slate-200 block">المحاذاة للزوايا القائمة (90°)</span>
                <span className="text-[10px] text-slate-400">تصحيح الأضلاع المتعامدة للأحواض والمستطيلات</span>
              </div>
              <input
                type="checkbox"
                checked={settings.orthogonalSnapEnabled}
                onChange={(e) => onUpdateSettings({ ...settings, orthogonalSnapEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetCalibration}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إعادة ضبط المصنع (1.0x)
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
