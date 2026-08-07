import React, { useState } from 'react';
import { Point2D, AREngineType, SoilType } from '../types';
import { ARCameraView } from './ARCameraView';
import { DEPTH_STEPS, DEFAULT_SOIL_TYPES, ARABIC_STRINGS } from '../constants/arabicStrings';
import { 
  Ruler, 
  Layers, 
  Package, 
  DollarSign, 
  Scale, 
  HelpCircle, 
  Info, 
  Check, 
  ChevronDown, 
  Sparkles 
} from 'lucide-react';

interface ARSurfaceCalculatorProps {
  engine: AREngineType;
}

export const ARSurfaceCalculator: React.FC<ARSurfaceCalculatorProps> = ({ engine }) => {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [surfaceAreaM2, setSurfaceAreaM2] = useState<number>(12.5); // Default sample area
  
  // Strict sequence depth dropdown: 0.05m to 0.95m in 0.05m steps
  const [selectedDepthIndex, setSelectedDepthIndex] = useState<number>(1); // Default 0.10m
  const [selectedSoilType, setSelectedSoilType] = useState<SoilType>(DEFAULT_SOIL_TYPES[0]);
  const [bagPriceSar, setBagPriceSar] = useState<number>(25);

  const currentDepthM = DEPTH_STEPS[selectedDepthIndex].valueM;
  const soilVolumeM3 = Math.round((surfaceAreaM2 * currentDepthM) * 1000) / 1000;
  
  // Weight & Bags calculations
  const weightKg = Math.round(soilVolumeM3 * selectedSoilType.densityKgPerM3);
  const weightTons = (weightKg / 1000).toFixed(2);
  const bagsCount50L = Math.ceil((soilVolumeM3 * 1000) / 50);
  const bagsCount25L = Math.ceil((soilVolumeM3 * 1000) / 25);
  const estimatedCostSar = Math.round(bagsCount50L * bagPriceSar);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-emerald-600" />
              {ARABIC_STRINGS.surfaceTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {ARABIC_STRINGS.surfaceDesc}
            </p>
          </div>

          <div className="hidden sm:block text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            Feature A Active
          </div>
        </div>
      </div>

      {/* Grid Layout: AR Camera View & Controls/Results Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Main Column: AR View (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <ARCameraView
            mode="SURFACE"
            points={points}
            setPoints={setPoints}
            engine={engine}
            onAreaCalculated={(area) => setSurfaceAreaM2(area)}
          />

          {/* Quick Manual Area Override */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              تعديل يدوي للمساحة (م²):
            </label>
            <input
              id="manual-area-input"
              type="number"
              step="0.1"
              min="0.1"
              max="500"
              value={surfaceAreaM2}
              onChange={(e) => setSurfaceAreaM2(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-28 bg-slate-50 border border-slate-200 text-emerald-700 font-bold text-center text-sm rounded-xl py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Right Column: Parameters & Calculation Results (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Depth Dropdown Selector (Strict 0.05m to 0.95m sequence) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <label className="block text-sm font-bold text-slate-900">
              <span className="flex items-center gap-2 text-emerald-700 mb-1">
                <Layers className="w-4 h-4 text-emerald-600" />
                {ARABIC_STRINGS.selectDepthLabel}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                تسلسل الزيادة المعياري: 0.05 م (5 سم) حتى 0.95 م
              </span>
            </label>

            <div className="relative">
              <select
                id="depth-dropdown-select"
                value={selectedDepthIndex}
                onChange={(e) => setSelectedDepthIndex(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base rounded-xl p-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer shadow-xs"
              >
                {DEPTH_STEPS.map((step, idx) => (
                  <option key={step.valueM} value={idx} className="bg-white text-slate-900 py-2">
                    {step.labelAr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Visual Depth Progression Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>0.05 م (5 سم)</span>
                <span className="text-emerald-700 font-bold">{currentDepthM} م</span>
                <span>0.95 م (95 سم)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(currentDepthM / 0.95) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Soil Type Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <label className="block text-sm font-bold text-slate-900 flex items-center gap-2 text-amber-700">
              <Package className="w-4 h-4 text-amber-600" />
              {ARABIC_STRINGS.selectSoilTypeLabel}
            </label>

            <div className="space-y-2">
              {DEFAULT_SOIL_TYPES.map((soil) => (
                <button
                  key={soil.id}
                  onClick={() => setSelectedSoilType(soil)}
                  className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                    selectedSoilType.id === soil.id
                      ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {soil.nameAr}
                      {selectedSoilType.id === soil.id && (
                        <Check className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-slate-500 mt-1">{soil.descriptionAr}</p>
                  </div>
                  <span className="text-[10px] bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-600 whitespace-nowrap font-medium">
                    {soil.densityKgPerM3} كجم/م³
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Calculations Output */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                ملخص حسابات كمية التربة
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                جاهز للتنفيذ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">{ARABIC_STRINGS.surfaceAreaResult}</span>
                <span className="text-3xl font-black text-emerald-900">{surfaceAreaM2} م²</span>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">{ARABIC_STRINGS.volumeResult}</span>
                <span className="text-3xl font-black text-blue-900">{soilVolumeM3} م³</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-xs text-slate-700">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Scale className="w-4 h-4 text-amber-600" />
                  {ARABIC_STRINGS.soilWeightResult}
                </span>
                <span className="font-bold text-amber-800">{weightKg} كجم ({weightTons} طن)</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Package className="w-4 h-4 text-sky-600" />
                  {ARABIC_STRINGS.bags50LCount}
                </span>
                <span className="font-bold text-sky-800">{bagsCount50L} كيس (سعة 50 ليتر)</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Package className="w-4 h-4 text-sky-600" />
                  {ARABIC_STRINGS.bags25LCount}
                </span>
                <span className="font-bold text-sky-800">{bagsCount25L} كيس (سعة 25 ليتر)</span>
              </div>

              <div className="flex justify-between items-center bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  {ARABIC_STRINGS.costEstimate}
                </span>
                <span className="font-extrabold text-base text-emerald-900">{estimatedCostSar} ر.س</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
