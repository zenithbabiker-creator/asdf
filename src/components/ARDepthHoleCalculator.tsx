import React, { useState } from 'react';
import { AREngineType, PreCaptureMeasurementMode, Point2D } from '../types';
import { ARCameraView, formatAreaArabicDetailed } from './ARCameraView';
import { PreCaptureSelectionModal } from './PreCaptureSelectionModal';
import { ARABIC_STRINGS } from '../constants/arabicStrings';
import { 
  Layers, 
  HelpCircle, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  BarChart2, 
  Package,
  Sliders,
  Ruler,
  Truck,
  Droplets,
  Box,
  Scale
} from 'lucide-react';

interface ARDepthHoleCalculatorProps {
  engine: AREngineType;
}

export type HoleGeometryType = 'RECTANGULAR' | 'CIRCULAR' | 'BOWL' | 'TRENCH';

export interface SoilDensityPreset {
  id: string;
  nameAr: string;
  densityKgM3: number;
  descriptionAr: string;
}

const SOIL_PRESETS: SoilDensityPreset[] = [
  {
    id: 'topsoil',
    nameAr: 'تربة زراعية مسمدة (Topsoil Mix)',
    densityKgM3: 1250,
    descriptionAr: 'تربة خليطة غنية بالمادة العضوية والكمبوست مناسبة للأشجار والحدائق',
  },
  {
    id: 'sand',
    nameAr: 'رمل زراعي نهري مغسول (Washed Sand)',
    densityKgM3: 1600,
    descriptionAr: 'رمل ناعم لتحسين الصرف ومزج المسطحات الخضراء وقيعان الحفر',
  },
  {
    id: 'potting',
    nameAr: 'بيتموس وبيرلايت خفيف (Potting Mix)',
    densityKgM3: 450,
    descriptionAr: 'وسط زراعي مسامي خفيف جداً لتهوية الجذور والشجيرات الحساسة',
  },
  {
    id: 'gravel',
    nameAr: 'حصى وبحص تصريف مياه (Drainage Gravel)',
    densityKgM3: 1550,
    descriptionAr: 'حصى خشن يوضع في قاع الحفرة لتصريف المياه الفائضة ومنع تعفن الجذور',
  },
  {
    id: 'clay',
    nameAr: 'تربة طينية متماسكة (Clay Soil)',
    densityKgM3: 1400,
    descriptionAr: 'تربة ثقيلة تحتفظ بالرطوبة والمغذيات',
  },
];

export const ARDepthHoleCalculator: React.FC<ARDepthHoleCalculatorProps> = ({ engine }) => {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [holeWidthM, setHoleWidthM] = useState<number>(2.0);
  const [holeLengthM, setHoleLengthM] = useState<number>(1.5);
  const [measuredAreaOverrideM2, setMeasuredAreaOverrideM2] = useState<number | null>(null);
  const [maxDepthM, setMaxDepthM] = useState<number>(0.45);
  const [avgDepthM, setAvgDepthM] = useState<number>(0.30);

  // Geometric Profile & Material Selection
  const [geometryType, setGeometryType] = useState<HoleGeometryType>('RECTANGULAR');
  const [selectedSoilId, setSelectedSoilId] = useState<string>('topsoil');
  const [compactionRatePercent, setCompactionRatePercent] = useState<number>(15); // Standard 15%

  // Pre-Capture Measurement Mode State
  const [preCaptureMode, setPreCaptureMode] = useState<PreCaptureMeasurementMode>('REAL_DEPTH');
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState<boolean>(false);

  // Selected soil density
  const activeSoil = SOIL_PRESETS.find((s) => s.id === selectedSoilId) || SOIL_PRESETS[0];

  // Calculated surface area (from AR camera boundary or W x L)
  const surfaceAreaM2 = measuredAreaOverrideM2 && measuredAreaOverrideM2 > 0
    ? measuredAreaOverrideM2
    : Math.round((holeWidthM * holeLengthM) * 100) / 100;

  // Exact Physical Volume according to Geometric Shape
  let netVolumeM3 = 0;
  if (geometryType === 'RECTANGULAR') {
    // Prismatic excavation: V = Area * Depth_avg
    netVolumeM3 = surfaceAreaM2 * avgDepthM;
  } else if (geometryType === 'CIRCULAR') {
    // Cylindrical basin: V = Area * Depth_avg
    netVolumeM3 = surfaceAreaM2 * avgDepthM;
  } else if (geometryType === 'BOWL') {
    // Paraboloid / Spherical Bowl for tree root ball: V = 0.67 * Area * Depth_max
    netVolumeM3 = surfaceAreaM2 * maxDepthM * 0.67;
  } else if (geometryType === 'TRENCH') {
    // Sloped Trench: V = 0.85 * Area * Depth_avg
    netVolumeM3 = surfaceAreaM2 * avgDepthM * 0.85;
  }
  netVolumeM3 = Math.round(netVolumeM3 * 1000) / 1000;

  // Compaction & Settlement compensation (+10%, +15%, +20%)
  const compactionFactor = 1 + (compactionRatePercent / 100);
  const compactedVolumeM3 = Math.round((netVolumeM3 * compactionFactor) * 1000) / 1000;
  const compactedVolumeLiters = Math.round(compactedVolumeM3 * 1000);

  // Weight Calculations
  const soilWeightKg = Math.round(compactedVolumeM3 * activeSoil.densityKgM3);
  const soilWeightTons = (soilWeightKg / 1000).toFixed(2);

  // Standard Packaging breakdown
  const bagsCount50L = Math.ceil(compactedVolumeLiters / 50);
  const bagsCount25L = Math.ceil(compactedVolumeLiters / 25);
  const truckLoads1_5M3 = (compactedVolumeM3 / 1.5).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Pre-Capture Measurement Mode Selection Modal */}
      <PreCaptureSelectionModal
        isOpen={isSelectionModalOpen}
        selectedMode={preCaptureMode}
        onSelectMode={(mode) => {
          setPreCaptureMode(mode);
          setIsSelectionModalOpen(false);
        }}
        onClose={() => setIsSelectionModalOpen(false)}
      />

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-600" />
              {ARABIC_STRINGS.depthHoleTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {ARABIC_STRINGS.depthHoleDesc}
            </p>
          </div>

          <button
            onClick={() => setIsSelectionModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Sliders className="w-4 h-4 text-amber-200" />
            <span>شاشة اختيار وضع القياس قبل الكاميرا 🎯</span>
          </button>
        </div>

        {/* Selected Mode Quick Tag */}
        <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
            <span>وضع القياس قبل التصوير المختار:</span>
            <span className="font-extrabold text-amber-950">
              {preCaptureMode === 'REAL_AREA' && 'حساب المساحة الحقيقية (Real Area)'}
              {preCaptureMode === 'REAL_DEPTH' && 'حساب العمق الحقيقي (Real Depth)'}
              {preCaptureMode === 'REAL_AREA_AND_DEPTH' && 'حساب المساحة والعمق الحقيقي معاً'}
            </span>
          </div>

          <button
            onClick={() => setIsSelectionModalOpen(true)}
            className="text-[11px] text-amber-800 underline font-bold hover:text-amber-950"
          >
            تغيير الوضع
          </button>
        </div>
      </div>

      {/* Grid: AR Camera View & Depth Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* AR Camera & Heatmap Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <ARCameraView
            mode="HOLE_DEPTH"
            preCaptureMode={preCaptureMode}
            onOpenModeSelection={() => setIsSelectionModalOpen(true)}
            points={points}
            setPoints={setPoints}
            engine={engine}
            onAreaCalculated={(area, perim, w, l) => {
              if (area && area > 0) {
                setMeasuredAreaOverrideM2(area);
                if (w) setHoleWidthM(w);
                if (l) setHoleLengthM(l);
              }
            }}
            onDepthCalculated={(maxD, avgD, vol, area, w, l) => {
              setMaxDepthM(maxD);
              setAvgDepthM(avgD);
              if (area && area > 0) {
                setMeasuredAreaOverrideM2(area);
              }
              if (w) setHoleWidthM(w);
              if (l) setHoleLengthM(l);
            }}
          />

          {/* Interactive Depth Cross-Section Mesh Visualizer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-amber-700">
                <BarChart2 className="w-4 h-4 text-amber-600" />
                رسم المقطع العرضي لعمق الحفرة (Depth Cross-Section Profile):
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {geometryType === 'BOWL' ? 'مقطع مقعر وعائي' : geometryType === 'TRENCH' ? 'مقطع خندق مائل' : 'مقطع رأسي مستوٍ'}
              </span>
            </div>

            {/* Depth Profile Graphic Bar */}
            <div className="relative h-28 bg-slate-900 rounded-xl border border-slate-800 p-2 overflow-hidden flex items-end justify-between gap-1">
              {/* Zero Ground Line */}
              <div className="absolute top-4 left-0 right-0 border-b border-dashed border-sky-400/60 text-[10px] text-sky-300 px-2 flex justify-between">
                <span>مستوى سطح الأرض (0.00 م)</span>
                <span>Ground Level</span>
              </div>

              {/* Dynamic Depth Bars based on chosen shape & max depth */}
              {Array.from({ length: 8 }).map((_, i) => {
                const normX = (i + 0.5) / 8;
                let barFraction = 1.0;
                if (geometryType === 'BOWL') {
                  barFraction = Math.sin(normX * Math.PI);
                } else if (geometryType === 'TRENCH') {
                  barFraction = normX < 0.2 || normX > 0.8 ? 0.6 : 0.95;
                } else {
                  barFraction = 0.75 + 0.25 * Math.sin(i * 1.5);
                }
                const currentD = Math.round(maxDepthM * barFraction * 100) / 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full pt-6">
                    <div
                      className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300/80 rounded-t transition-all duration-300"
                      style={{ height: `${Math.min(100, (currentD / Math.max(0.6, maxDepthM * 1.1)) * 100)}%` }}
                    />
                    <span className="text-[9px] text-slate-400 mt-1 font-mono">-{currentD}م</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Backfill Calculations (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Hole Geometry & Dimensions Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-600" />
                شكل وأبعاد الحفرة الهندسية:
              </span>
              {measuredAreaOverrideM2 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  مقاسة بالكاميرا AR
                </span>
              )}
            </h4>

            {/* Shape selection pills */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setGeometryType('RECTANGULAR')}
                className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  geometryType === 'RECTANGULAR'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                مستطيل / مربع رأسي
              </button>
              <button
                onClick={() => setGeometryType('BOWL')}
                className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  geometryType === 'BOWL'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                حوض مقعر لشجرة
              </button>
              <button
                onClick={() => setGeometryType('CIRCULAR')}
                className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  geometryType === 'CIRCULAR'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                حفرة أسطوانية دائرية
              </button>
              <button
                onClick={() => setGeometryType('TRENCH')}
                className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                  geometryType === 'TRENCH'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                خندق مائل الجوانب
              </button>
            </div>

            {/* Dimension Inputs */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">العرض (متر):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={holeWidthM}
                  onChange={(e) => {
                    setHoleWidthM(Math.max(0.1, parseFloat(e.target.value) || 0.1));
                    setMeasuredAreaOverrideM2(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold p-2 rounded-xl text-center focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الطول (متر):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={holeLengthM}
                  onChange={(e) => {
                    setHoleLengthM(Math.max(0.1, parseFloat(e.target.value) || 0.1));
                    setMeasuredAreaOverrideM2(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold p-2 rounded-xl text-center focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">العمق المتوسط (متر):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="5.0"
                  value={avgDepthM}
                  onChange={(e) => {
                    const newAvg = Math.max(0.05, parseFloat(e.target.value) || 0.05);
                    setAvgDepthM(newAvg);
                    if (newAvg > maxDepthM) setMaxDepthM(Math.round(newAvg * 1.3 * 100) / 100);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold p-2 rounded-xl text-center focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="text-xs bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex justify-between items-center text-amber-900 font-medium">
              <span>مساحة سطح فوهة الحفرة:</span>
              <span className="font-extrabold text-amber-950 text-sm">
                {surfaceAreaM2.toFixed(2)} م²
              </span>
            </div>
          </div>

          {/* Material & Soil Density Preset */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                نوع تربة / مادة الردم:
              </span>
              <span className="text-xs text-emerald-700 font-mono font-bold">
                {activeSoil.densityKgM3} كجم/م³
              </span>
            </h4>

            <select
              value={selectedSoilId}
              onChange={(e) => setSelectedSoilId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SOIL_PRESETS.map((soil) => (
                <option key={soil.id} value={soil.id}>
                  {soil.nameAr} - ({soil.densityKgM3} كجم/م³)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {activeSoil.descriptionAr}
            </p>

            {/* Compaction Rate */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">نسبة الهبوط والدك الميكانيكي:</span>
              <div className="flex items-center gap-1">
                {[10, 15, 20].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setCompactionRatePercent(rate)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      compactionRatePercent === rate
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    +{rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Backfill Volume Results Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                حجم الردم المطلوب (Backfill Volume)
              </h3>
              <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200 font-semibold">
                حساب فيزيائي دقيق
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  أقصى عمق مقاس:
                </span>
                <span className="text-2xl font-black text-amber-900">-{maxDepthM.toFixed(2)} م</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                  العمق المتوسط:
                </span>
                <span className="text-2xl font-black text-amber-800">-{avgDepthM.toFixed(2)} م</span>
              </div>
            </div>

            {/* Primary Volume Callout */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                حجم الردم الإجمالي بعد الدك والهبوط (+{compactionRatePercent}%):
              </span>
              <span className="text-3xl font-black text-blue-950">
                {compactedVolumeM3.toFixed(3)} م³
              </span>
              <span className="text-xs text-blue-700 font-bold block">
                ({compactedVolumeLiters} لتر مكعب • الحجم الصافي: {netVolumeM3.toFixed(3)} م³)
              </span>
            </div>

            {/* Logistics & Materials Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  الوزن التقديري لمادة الردم:
                </span>
                <span className="font-bold text-slate-900">{soilWeightKg} كجم ({soilWeightTons} طن)</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Package className="w-4 h-4 text-sky-600" />
                  أكياس الردم القياسية (سعة 50 لتر):
                </span>
                <span className="font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md">{bagsCount50L} كيس</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Package className="w-4 h-4 text-teal-600" />
                  أكياس الردم الصغيرة (سعة 25 لتر):
                </span>
                <span className="font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded-md">{bagsCount25L} كيس</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Truck className="w-4 h-4 text-amber-600" />
                  حمولة سيارة نقل ردم صغيرة (1.5 م³):
                </span>
                <span className="font-bold text-amber-900">{truckLoads1_5M3} حمولة نقل</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

