import React, { useState } from 'react';
import { AREngineType } from '../types';
import { ARCameraView } from './ARCameraView';
import { ARABIC_STRINGS } from '../constants/arabicStrings';
import { 
  Layers, 
  HelpCircle, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  BarChart2, 
  Package 
} from 'lucide-react';

interface ARDepthHoleCalculatorProps {
  engine: AREngineType;
}

export const ARDepthHoleCalculator: React.FC<ARDepthHoleCalculatorProps> = ({ engine }) => {
  const [points, setPoints] = useState<any[]>([]);
  const [holeWidthM, setHoleWidthM] = useState<number>(2.0);
  const [holeLengthM, setHoleLengthM] = useState<number>(3.0);
  const [maxDepthM, setMaxDepthM] = useState<number>(0.45);
  const [avgDepthM, setAvgDepthM] = useState<number>(0.30);

  // Surface Area = Width x Length
  const calculatedAreaM2 = Math.round((holeWidthM * holeLengthM) * 100) / 100;

  // Formula: Volume (m³) = Area (m²) × Average Depth (m)
  const backfillVolumeM3 = Math.round((calculatedAreaM2 * avgDepthM) * 1000) / 1000;

  // Calculate soil needed for backfill
  const densityKgM3 = 1300; // Soil backfill density
  const soilWeightKg = Math.round(backfillVolumeM3 * densityKgM3);
  const soilWeightTons = (soilWeightKg / 1000).toFixed(2);
  const bagsCount50L = Math.ceil((backfillVolumeM3 * 1000) / 50);
  const bagsCount25L = Math.ceil((backfillVolumeM3 * 1000) / 25);

  // Recommended extra 10% volume for compaction/settlement
  const compactedVolumeM3 = Math.round((backfillVolumeM3 * 1.10) * 1000) / 1000;
  const compactedBags50L = Math.ceil((compactedVolumeM3 * 1000) / 50);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-600" />
              {ARABIC_STRINGS.depthHoleTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {ARABIC_STRINGS.depthHoleDesc}
            </p>
          </div>

          <div className="hidden sm:block text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
            Feature B Active (AR Depth API)
          </div>
        </div>
      </div>

      {/* Grid: AR Camera View & Depth Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* AR Camera & Heatmap Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <ARCameraView
            mode="HOLE_DEPTH"
            points={points}
            setPoints={setPoints}
            engine={engine}
            onDepthCalculated={(maxD, avgD) => {
              setMaxDepthM(maxD);
              setAvgDepthM(avgD);
            }}
          />

          {/* Interactive Depth Depth Profile Canvas Simulator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="font-bold flex items-center gap-1.5 text-amber-700">
                <BarChart2 className="w-4 h-4 text-amber-600" />
                رسم المقطع العرضي لعمق الحفرة (Depth Cross-Section Profile):
              </span>
              <span className="text-slate-500 font-mono text-[11px]">AR Depth Mesh</span>
            </div>

            {/* Depth Profile Graphic Bar */}
            <div className="relative h-28 bg-slate-900 rounded-xl border border-slate-800 p-2 overflow-hidden flex items-end justify-between gap-1">
              {/* Zero Ground Line */}
              <div className="absolute top-4 left-0 right-0 border-b border-dashed border-sky-400/60 text-[10px] text-sky-300 px-2 flex justify-between">
                <span>مستوى سطح الأرض (0.00 م)</span>
                <span>Ground Level</span>
              </div>

              {/* Depth Bars Simulation */}
              {[0.12, 0.25, 0.38, 0.45, 0.42, 0.32, 0.18, 0.05].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full pt-6">
                  <div
                    className="w-full bg-gradient-to-t from-amber-600 to-amber-400/80 rounded-t transition-all duration-300"
                    style={{ height: `${(d / 0.50) * 100}%` }}
                  />
                  <span className="text-[9px] text-slate-400 mt-1 font-mono">-{d}م</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Backfill Calculations (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Hole Dimensions Input & Controls Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-amber-600" />
              أبعاد وقياسات الحفرة (السطح غير المستوي):
            </h4>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">العرض (متر):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={holeWidthM}
                  onChange={(e) => setHoleWidthM(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
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
                  onChange={(e) => setHoleLengthM(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
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
                  onChange={(e) => setAvgDepthM(Math.max(0.05, parseFloat(e.target.value) || 0.05))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold p-2 rounded-xl text-center focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="text-xs bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex justify-between items-center text-amber-900 font-medium">
              <span>المساحة المحسوبة للحفرة:</span>
              <span className="font-extrabold text-amber-950 text-sm">{calculatedAreaM2} م²</span>
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
                AR Depth Scan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">{ARABIC_STRINGS.maxDepthLabel}</span>
                <span className="text-2xl font-black text-amber-900">-{maxDepthM} م</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">{ARABIC_STRINGS.avgDepthLabel}</span>
                <span className="text-2xl font-black text-amber-800">-{avgDepthM} م</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">{ARABIC_STRINGS.backfillVolumeLabel}</span>
              <span className="text-3xl font-black text-blue-900">{backfillVolumeM3} م³</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-700 font-medium">الوزن الكلي للردم:</span>
                <span className="font-bold text-slate-900">{soilWeightKg} كجم ({soilWeightTons} طن)</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Package className="w-4 h-4 text-sky-600" />
                  أكياس الردم القياسية (50L):
                </span>
                <span className="font-bold text-sky-800">{bagsCount50L} كيس</span>
              </div>
            </div>
          </div>

          {/* Leveling & Compaction Recommendation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              توصية الهبوط والدك (Compaction Ratio):
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              عند ردم الحفر والخنادق، تنكمش التربة بنسبة 10-15% بعد الرش بالماء والدك الميكانيكي. ينصح بطلب كمية معوضة قدرها:
            </p>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
              <span className="text-amber-900 font-semibold">حجم الردم بعد تعويض الهبوط (+10%):</span>
              <span className="font-extrabold text-amber-900 text-sm">{compactedVolumeM3} م³ ({compactedBags50L} كيس)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
