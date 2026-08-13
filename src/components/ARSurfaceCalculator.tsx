import React, { useState } from 'react';
import { Point2D, AREngineType, PlantSelectorItem, PlantSelectorType, PreCaptureMeasurementMode } from '../types';
import { ARCameraView, formatAreaArabicDetailed } from './ARCameraView';
import { PreCaptureSelectionModal } from './PreCaptureSelectionModal';
import { TURF_SEEDLING_OPTIONS, PLANT_SELECTOR_DEFAULTS, ARABIC_STRINGS } from '../constants/arabicStrings';
import { 
  Ruler, 
  Layers, 
  Info, 
  ChevronDown, 
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  Flower2,
  TreeDeciduous,
  Sprout,
  Sliders,
  Camera
} from 'lucide-react';

interface ARSurfaceCalculatorProps {
  engine: AREngineType;
}

export const ARSurfaceCalculator: React.FC<ARSurfaceCalculatorProps> = ({ engine }) => {
  const [points, setPoints] = useState<Point2D[]>([]);
  const [totalGardenAreaM2, setTotalGardenAreaM2] = useState<number>(20); // Starts cleanly with 20 m2 default or AR calculated

  // Pre-Capture Measurement Mode State
  const [preCaptureMode, setPreCaptureMode] = useState<PreCaptureMeasurementMode>('REAL_AREA');
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState<boolean>(false);

  // Plant Selectors List
  const [selectors, setSelectors] = useState<PlantSelectorItem[]>([
    {
      id: 'sel-1',
      type: 'large',
      nameAr: 'محدد كبير (عرض 30 سم)',
      varietyName: 'أصناف شجيرات الورد والزهور العالية',
      widthM: 0.30,
      lengthM: 5.0, // 0.30m x 5.0m = 1.50 m²
    },
    {
      id: 'sel-2',
      type: 'medium',
      nameAr: 'محدد متوسط (عرض 20 سم)',
      varietyName: 'نباتات التسييج والزهور المتوسطة',
      widthM: 0.20,
      lengthM: 4.0, // 0.20m x 4.0m = 0.80 m²
    },
    {
      id: 'sel-3',
      type: 'small',
      nameAr: 'محدد صغير (عرض 10 سم)',
      varietyName: 'أصناف نباتات التحديد الخفيفة',
      widthM: 0.10,
      lengthM: 3.0, // 0.10m x 3.0m = 0.30 m²
    },
  ]);

  // Drop-down selector choice for adding new plant item
  const [selectedAddType, setSelectedAddType] = useState<PlantSelectorType>('large');
  const [newVarietyName, setNewVarietyName] = useState<string>('');
  const [newLengthM, setNewLengthM] = useState<number>(2.0);

  // Edit selector state
  const [editingSelectorId, setEditingSelectorId] = useState<string | null>(null);
  const [editVarietyName, setEditVarietyName] = useState<string>('');
  const [editLengthM, setEditLengthM] = useState<number>(1.0);

  // Turf Seedlings per m² choice - EXCLUSIVELY (10, 15, 20, 25, 30 seedlings/m²)
  const [selectedSeedlingsPerM2, setSelectedSeedlingsPerM2] = useState<number>(10); // Default 10 seedlings/m²

  // Calculate Reserved Area by Selectors
  const reservedSelectorsAreaM2 = Math.round(
    selectors.reduce((sum, item) => sum + item.widthM * item.lengthM, 0) * 100
  ) / 100;

  // Calculate Remaining Garden Area for Turf (Ground/Lawn)
  const remainingTurfAreaM2 = Math.max(0, Math.round((totalGardenAreaM2 - reservedSelectorsAreaM2) * 100) / 100);

  // Calculate Total Turf Seedlings Count = Remaining Area (m²) x Selected Seedlings per m²
  const totalTurfSeedlingsCount = Math.round(remainingTurfAreaM2 * selectedSeedlingsPerM2);

  // Add new Plant Selector from Dropdown
  const handleAddSelector = () => {
    const config = PLANT_SELECTOR_DEFAULTS.find((p) => p.type === selectedAddType) || PLANT_SELECTOR_DEFAULTS[0];
    const newSelector: PlantSelectorItem = {
      id: `sel-${Date.now()}`,
      type: selectedAddType,
      nameAr: `${config.nameAr} (${config.labelWidthAr})`,
      varietyName: newVarietyName.trim() || `صنف نباتات ${config.nameAr}`,
      widthM: config.widthM,
      lengthM: Math.max(0.1, newLengthM || 1.0),
    };

    setSelectors([...selectors, newSelector]);
    setNewVarietyName('');
    setNewLengthM(2.0);
  };

  // Start editing selector
  const handleStartEdit = (item: PlantSelectorItem) => {
    setEditingSelectorId(item.id);
    setEditVarietyName(item.varietyName);
    setEditLengthM(item.lengthM);
  };

  // Save edited selector
  const handleSaveEdit = (id: string) => {
    setSelectors(
      selectors.map((item) =>
        item.id === id
          ? {
              ...item,
              varietyName: editVarietyName.trim() || item.varietyName,
              lengthM: Math.max(0.1, editLengthM || 0.1),
            }
          : item
      )
    );
    setEditingSelectorId(null);
  };

  // Delete selector
  const handleDeleteSelector = (id: string) => {
    setSelectors(selectors.filter((item) => item.id !== id));
  };

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

      {/* Header Info Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-emerald-600" />
              {ARABIC_STRINGS.surfaceTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {ARABIC_STRINGS.surfaceDesc}
            </p>
          </div>

          <button
            onClick={() => setIsSelectionModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Sliders className="w-4 h-4 text-emerald-200" />
            <span>شاشة اختيار وضع القياس قبل الكاميرا 🎯</span>
          </button>
        </div>

        {/* Selected Mode Quick Tag */}
        <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
            <span>الوضع المحظور/النشط المختار للقياس قبل التصوير:</span>
            <span className="font-extrabold text-emerald-950">
              {preCaptureMode === 'REAL_AREA' && 'حساب المساحة الحقيقية (Real Area)'}
              {preCaptureMode === 'REAL_DEPTH' && 'حساب العمق الحقيقي (Real Depth)'}
              {preCaptureMode === 'REAL_AREA_AND_DEPTH' && 'حساب المساحة والعمق الحقيقي معاً'}
            </span>
          </div>

          <button
            onClick={() => setIsSelectionModalOpen(true)}
            className="text-[11px] text-emerald-700 underline font-bold hover:text-emerald-900"
          >
            تغيير الوضع
          </button>
        </div>
      </div>

      {/* Grid Layout: AR Camera View & Controls/Results Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AR Camera View (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <ARCameraView
            mode="SURFACE"
            preCaptureMode={preCaptureMode}
            onOpenModeSelection={() => setIsSelectionModalOpen(true)}
            points={points}
            setPoints={setPoints}
            engine={engine}
            onAreaCalculated={(area) => setTotalGardenAreaM2(area > 0 ? area : totalGardenAreaM2)}
          />

          {/* Quick Manual Area Override */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600" />
              المساحة الكلية للحديقة (م²):
            </label>
            <input
              id="manual-total-area-input"
              type="number"
              step="0.5"
              min="0.1"
              max="1000"
              value={totalGardenAreaM2}
              onChange={(e) => setTotalGardenAreaM2(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-28 bg-slate-50 border border-slate-200 text-emerald-700 font-bold text-center text-sm rounded-xl py-1.5 px-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Right Column: Plant Selectors & Turf Calculations (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Drop-down Selectors Section for Plant Varieties & Widths */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flower2 className="w-4 h-4 text-emerald-600" />
                {ARABIC_STRINGS.selectorsHeader}
              </h3>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                أصناف النباتات
              </span>
            </div>

            {/* Selector Dropdown Input Controls */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  اختر حجم محدد النبات:
                </label>
                <div className="relative">
                  <select
                    id="selector-size-dropdown"
                    value={selectedAddType}
                    onChange={(e) => setSelectedAddType(e.target.value as PlantSelectorType)}
                    className="w-full bg-white border border-slate-200 text-slate-900 font-bold rounded-xl p-2.5 pr-8 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="large">محدد كبير (عرض 30 سم / 0.30 م)</option>
                    <option value="medium">محدد متوسط (عرض 20 سم / 0.20 م)</option>
                    <option value="small">محدد صغير (عرض 10 سم / 0.10 م)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اسم/صنف النبات:</label>
                  <input
                    type="text"
                    placeholder="مثال: شجيرات الورد"
                    value={newVarietyName}
                    onChange={(e) => setNewVarietyName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الطول (متر):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={newLengthM}
                    onChange={(e) => setNewLengthM(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                id="add-plant-selector-btn"
                onClick={handleAddSelector}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                إضافة المحدد وحجز مساحته
              </button>
            </div>

            {/* List of Placed Selectors with Edit/Delete */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                المحددات المضافة على الشاشة ({selectors.length}):
              </span>

              {selectors.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  لم يتم إضافة محددات بعد. أضف محددات لحجز مساحتها من الحديقة.
                </div>
              ) : (
                selectors.map((item) => {
                  const areaM2 = Math.round(item.widthM * item.lengthM * 100) / 100;
                  const isEditing = editingSelectorId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-2 transition-all hover:bg-slate-100/80"
                    >
                      {isEditing ? (
                        <div className="space-y-2 bg-white p-2.5 rounded-lg border border-emerald-300">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block">الصنف:</label>
                              <input
                                type="text"
                                value={editVarietyName}
                                onChange={(e) => setEditVarietyName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1 font-bold text-slate-900 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block">الطول (متر):</label>
                              <input
                                type="number"
                                step="0.5"
                                value={editLengthM}
                                onChange={(e) => setEditLengthM(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1 font-bold text-slate-900 text-xs text-center"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-md font-bold text-[11px] flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> حفظ
                            </button>
                            <button
                              onClick={() => setEditingSelectorId(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-md font-medium text-[11px]"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                              {item.nameAr}
                            </div>
                            <p className="text-slate-600 text-[11px] mt-0.5 font-medium">
                              {item.varietyName} • الطول: <span className="font-bold text-emerald-800">{item.lengthM}م</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
                              {areaM2} م²
                            </span>
                            <button
                              onClick={() => handleStartEdit(item)}
                              title="تعديل"
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSelector(item.id)}
                              title="مسح"
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Total Reserved Selectors Summary */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-medium">
              <span>{ARABIC_STRINGS.reservedSelectorsAreaResult}</span>
              <span className="font-extrabold text-sm text-emerald-900">{reservedSelectorsAreaM2} م²</span>
            </div>
          </div>

          {/* Turf Seedlings per m² Dropdown Menu (Strictly 10, 15, 20, 25, 30 seedlings/m²) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <label className="block text-sm font-bold text-slate-900">
              <span className="flex items-center gap-2 text-teal-700 mb-1">
                <Layers className="w-4 h-4 text-teal-600" />
                {ARABIC_STRINGS.selectTurfThicknessLabel}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                الخيارات المعيارية لعدد شتلات النجيلة المفرودة في المتر المربع:
              </span>
            </label>

            <div className="relative">
              <select
                id="turf-seedlings-dropdown-select"
                value={selectedSeedlingsPerM2}
                onChange={(e) => setSelectedSeedlingsPerM2(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base rounded-xl p-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer shadow-xs"
              >
                {TURF_SEEDLING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-white text-slate-900 py-2">
                    {option.labelAr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Turf Calculation Results Output */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                ملخص حساب المساحة وشتول النجيلة
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                جاهز للزراعة
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">المساحة الكلية للحديقة:</span>
                <span className="text-lg sm:text-xl font-black text-slate-800">{formatAreaArabicDetailed(totalGardenAreaM2).primary}</span>
                <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">({formatAreaArabicDetailed(totalGardenAreaM2).detailed})</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-800 block mb-1">المساحة المحجوزة للمحددات:</span>
                <span className="text-lg sm:text-xl font-black text-amber-900">-{formatAreaArabicDetailed(reservedSelectorsAreaM2).primary}</span>
                <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">({formatAreaArabicDetailed(reservedSelectorsAreaM2).detailed})</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1 text-center">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                {ARABIC_STRINGS.remainingTurfAreaResult}
              </span>
              <span className="text-3xl font-black text-emerald-950">{formatAreaArabicDetailed(remainingTurfAreaM2).primary}</span>
              <span className="text-xs font-bold text-emerald-800 block">({formatAreaArabicDetailed(remainingTurfAreaM2).detailed})</span>
            </div>

            <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block">
                {ARABIC_STRINGS.turfVolumeResult}
              </span>
              <span className="text-3xl font-black text-teal-950">{totalTurfSeedlingsCount} شتلة</span>
              <p className="text-[11px] text-teal-800 font-medium pt-1">
                (المساحة المتبقية {remainingTurfAreaM2} م² × {selectedSeedlingsPerM2} شتلة/م²)
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

