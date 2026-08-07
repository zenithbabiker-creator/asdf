import React, { useState, useEffect } from 'react';
import { AREngineType } from './types';
import { Navbar } from './components/Navbar';
import { ARSurfaceCalculator } from './components/ARSurfaceCalculator';
import { ARDepthHoleCalculator } from './components/ARDepthHoleCalculator';
import { AndroidCodeExporter } from './components/AndroidCodeExporter';
import { AISoilAssistant } from './components/AISoilAssistant';

export default function App() {
  const [activeTab, setActiveTab] = useState<'surface' | 'depthHole' | 'androidExport' | 'aiAssistant'>('surface');
  const [engine, setEngine] = useState<AREngineType>('HUAWEI_AR_ENGINE');

  // Auto detect environment on launch (Simulating Huawei AR Engine routing vs Google ARCore)
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('huawei') || userAgent.includes('honor') || !navigator.userAgent.includes('Chrome')) {
      setEngine('HUAWEI_AR_ENGINE');
    } else {
      setEngine('GOOGLE_ARCORE');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans dir-rtl selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engine={engine}
        setEngine={setEngine}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'surface' && <ARSurfaceCalculator engine={engine} />}
        {activeTab === 'depthHole' && <ARDepthHoleCalculator engine={engine} />}
        {activeTab === 'androidExport' && <AndroidCodeExporter />}
        {activeTab === 'aiAssistant' && <AISoilAssistant />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">
            حاسبة تربة الحدائق بالواقع المعزز - AR Garden & Soil Volume Calculator © 2026
          </span>
          <span className="font-mono text-slate-500 text-[11px] dir-ltr">
            Kotlin • Jetpack Compose • Huawei AR Engine SDK (Local) • Google ARCore
          </span>
        </div>
      </footer>
    </div>
  );
}
