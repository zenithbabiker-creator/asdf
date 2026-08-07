import React, { useState } from 'react';
import { STANDALONE_ANDROID_PROJECT_FILES } from '../constants/androidProjectCode';
import { ProjectFile } from '../types';
import { ARABIC_STRINGS } from '../constants/arabicStrings';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FolderTree, 
  Smartphone, 
  CheckCircle2, 
  Terminal 
} from 'lucide-react';

export const AndroidCodeExporter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(STANDALONE_ANDROID_PROJECT_FILES[0]);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyCode = (content: string, path: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const handleDownloadAllAsTxt = () => {
    let combinedContent = `=================================================================\n`;
    combinedContent += `STANDALONE AR HOME GARDEN LANDSCAPE & SOIL VOLUME CALCULATOR\n`;
    combinedContent += `FULL ANDROID PROJECT SOURCE CODE (KOTLIN + JETPACK COMPOSE)\n`;
    combinedContent += `=================================================================\n\n`;

    STANDALONE_ANDROID_PROJECT_FILES.forEach((file) => {
      combinedContent += `\n/* ====================================================\n`;
      combinedContent += ` * FILE: ${file.path}\n`;
      combinedContent += ` * DESCRIPTION: ${file.descriptionAr}\n`;
      combinedContent += ` * ==================================================== */\n\n`;
      combinedContent += file.content;
      combinedContent += `\n\n`;
    });

    const blob = new Blob([combinedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AR_Garden_Soil_Calculator_Android_SourceCode.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-6 h-6 text-purple-600" />
              {ARABIC_STRINGS.exportTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {ARABIC_STRINGS.exportSubtitle}
            </p>
          </div>

          <button
            id="download-all-code-btn"
            onClick={handleDownloadAllAsTxt}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-xs"
          >
            <Download className="w-4 h-4" />
            تنزيل كافة ملفات المشروع (TXT / ZIP)
          </button>
        </div>
      </div>

      {/* Main File Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left File Tree Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
            <FolderTree className="w-4 h-4 text-purple-600" />
            هيكل ملفات مشروع أندرويد (Project Tree):
          </div>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {STANDALONE_ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileCode className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                  <div className="flex-1 overflow-hidden">
                    <span className="font-mono font-bold block truncate text-slate-900 dir-ltr text-right">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      {file.descriptionAr}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer Panel (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-[580px]">
          {/* Code Viewer Toolbar */}
          <div className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Terminal className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="font-mono text-xs font-bold text-purple-300 truncate dir-ltr">
                {selectedFile.path}
              </span>
            </div>

            <button
              id="copy-code-file-btn"
              onClick={() => handleCopyCode(selectedFile.content, selectedFile.path)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                copiedPath === selectedFile.path
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {copiedPath === selectedFile.path ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  {ARABIC_STRINGS.copiedSuccess}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {ARABIC_STRINGS.copyCode}
                </>
              )}
            </button>
          </div>

          {/* Description bar */}
          <div className="bg-purple-950/40 border-b border-purple-900/40 px-4 py-2 text-xs text-purple-200 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span>{selectedFile.descriptionAr}</span>
          </div>

          {/* Code Editor Body */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 bg-slate-950 leading-relaxed dir-ltr">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
