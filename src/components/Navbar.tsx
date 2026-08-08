import React from 'react';
import { AREngineType } from '../types';
import { ARABIC_STRINGS } from '../constants/arabicStrings';
import { 
  Ruler, 
  Layers, 
  Code2, 
  Sparkles, 
  Smartphone, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Sprout,
  Trees
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'surface' | 'depthHole' | 'androidExport' | 'aiAssistant';
  setActiveTab: (tab: 'surface' | 'depthHole' | 'androidExport' | 'aiAssistant') => void;
  engine: AREngineType;
  setEngine: (engine: AREngineType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  engine,
  setEngine,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-50 shadow-xs">
      {/* Top Banner: App Title & Dual Engine Detector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Main Title */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/20 relative">
              <Sprout className="w-6 h-6 text-white transform -rotate-12" />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-md border border-white">
                <Ruler className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {ARABIC_STRINGS.appTitle}
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  ZONE AR
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono dir-ltr font-medium">
                {ARABIC_STRINGS.appSubtitle}
              </p>
            </div>
          </div>

          {/* Dual Engine Selector & Runtime Detection Status Badge */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
            <span className="text-xs font-semibold text-slate-600 px-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              {ARABIC_STRINGS.dualEngineTitle}:
            </span>

            <button
              id="engine-huawei-btn"
              onClick={() => setEngine('HUAWEI_AR_ENGINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                engine === 'HUAWEI_AR_ENGINE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Huawei AR Engine
            </button>

            <button
              id="engine-google-btn"
              onClick={() => setEngine('GOOGLE_ARCORE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                engine === 'GOOGLE_ARCORE'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Google ARCore
            </button>
          </div>
        </div>

        {/* Engine Notice Banner */}
        <div className="mt-2.5 text-xs py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
          {engine === 'HUAWEI_AR_ENGINE' ? (
            <>
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="text-rose-900 font-medium">
                {ARABIC_STRINGS.huaweiDetectedNotice}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />
              <span className="text-sky-900 font-medium">
                {ARABIC_STRINGS.googleDetectedNotice}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-50/80 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 space-x-reverse overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            <button
              id="tab-surface-btn"
              onClick={() => setActiveTab('surface')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'surface'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Ruler className="w-4 h-4 text-emerald-600" />
              {ARABIC_STRINGS.navSurface}
            </button>

            <button
              id="tab-depth-btn"
              onClick={() => setActiveTab('depthHole')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'depthHole'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-600" />
              {ARABIC_STRINGS.navDepthHole}
            </button>

            <button
              id="tab-android-btn"
              onClick={() => setActiveTab('androidExport')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'androidExport'
                  ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Code2 className="w-4 h-4 text-purple-600" />
              {ARABIC_STRINGS.navAndroidExport}
            </button>

            <button
              id="tab-ai-btn"
              onClick={() => setActiveTab('aiAssistant')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === 'aiAssistant'
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              {ARABIC_STRINGS.navAiAssistant}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
