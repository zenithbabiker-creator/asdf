import React, { useState } from 'react';
import { Sparkles, Send, Loader2, CheckCircle, Info, Layers, BookOpen } from 'lucide-react';

export const AISoilAssistant: React.FC = () => {
  const [areaM2, setAreaM2] = useState<number>(15);
  const [depthM, setDepthM] = useState<number>(0.20);
  const [soilType, setSoilType] = useState<string>('تربة زراعية خفيفة (Topsoil)');
  const [plantCategory, setPlantCategory] = useState<string>('زهور ونباتات زينة خارجية');
  const [customNotes, setCustomNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-soil-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaM2,
          depthM,
          soilType,
          plantCategory,
          customNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بالمساعد الذكي للتربة');
      }

      const data = await response.json();
      setAiAdvice(data);
    } catch (err: any) {
      console.error(err);
      setError('تعذر الحصول على نصائح Gemini حالياً. يرجى التأكد من مفتاح GEMINI_API_KEY.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              المساعد الذكي لتخطيط وتجهيز التربة (Gemini AI Soil Assistant)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              تحليل نوعية التربة، عمق الغرس المناسب، الخلطات العضوية والمغذيات الموصى بها لنباتات وحدائق المنزل.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            معطيات الحديقة والنباتات:
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">المساحة السطحية (م²):</label>
              <input
                type="number"
                value={areaM2}
                onChange={(e) => setAreaM2(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">عمق التربة المخطط (متر):</label>
              <input
                type="number"
                step="0.05"
                value={depthM}
                onChange={(e) => setDepthM(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">نوع المزروعات المستهدفة:</label>
              <select
                value={plantCategory}
                onChange={(e) => setPlantCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="زهور ونباتات زينة خارجية">زهور ونباتات زينة خارجية</option>
                <option value="مسطحات خضراء ونجيل (Lawn)">مسطحات خضراء ونجيل (Lawn)</option>
                <option value="أحواض خضروات وفواكه منزلية">أحواض خضروات وفواكه منزلية</option>
                <option value="شجيرات وأشجار مثمرة">شجيرات وأشجار مثمرة</option>
                <option value="نخيل وأشجار ظلية كبيرة">نخيل وأشجار ظلية كبيرة</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">استفسارات أو ملاحظات إضافية:</label>
              <textarea
                rows={3}
                placeholder="مثال: الأرض بها نسبة ملوحة أو تصريف المياه بطيء..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <button
              id="get-ai-advice-btn"
              onClick={handleGetAdvice}
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري تحليل التربة بواسطة Gemini...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  توليد التقرير والنصائح الزراعية
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Output Results (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            توصيات المساعد الذكي:
          </h3>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {!aiAdvice && !loading && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs">اضغط على زر "توليد التقرير والنصائح الزراعية" للحصول على توصيات مخصصة.</p>
            </div>
          )}

          {aiAdvice && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-indigo-50/80 border border-indigo-200 p-4 rounded-2xl space-y-1">
                <span className="font-bold text-indigo-900 text-sm block">الملخص الزراعي:</span>
                <p className="leading-relaxed text-indigo-950 font-medium">{aiAdvice.summaryAr}</p>
              </div>

              {aiAdvice.soilPreparationStepsAr && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block text-xs">خطوات تجهيز وخلط التربة:</span>
                  <ul className="space-y-1.5 pr-4 list-disc text-slate-700">
                    {aiAdvice.soilPreparationStepsAr.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAdvice.recommendedAdditivesAr && (
                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
                  <span className="font-bold text-amber-900 block">المحسنات والأسمدة الموصى بها:</span>
                  <ul className="space-y-1 pr-4 list-disc text-amber-950">
                    {aiAdvice.recommendedAdditivesAr.map((add: string, idx: number) => (
                      <li key={idx}>{add}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAdvice.fertilizerTipsAr && (
                <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-emerald-900">
                  <span className="font-bold text-emerald-800 block mb-1">نصيحة الري والري المبدئي:</span>
                  <p>{aiAdvice.fertilizerTipsAr}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
