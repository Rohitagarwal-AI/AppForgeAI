import React, { useState } from 'react';
import { 
  CheckCircle2, Code, Download, RefreshCw, Clipboard, FileText,
  Play, Eye, Search, Layers, Settings, Database, Terminal, Check
} from 'lucide-react';
import { GeneratedFile } from '../../utils/codeTemplates';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface WorkspaceViewProps {
  customProjectName: string;
  techStack: string;
  generatedFilesMap: Record<string, GeneratedFile>;
  handleResetGenerator: () => void;
  triggerToast: (msg: string) => void;
}

export default function WorkspaceView({
  customProjectName,
  techStack,
  generatedFilesMap,
  handleResetGenerator,
  triggerToast
}: WorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<'Frontend' | 'Backend' | 'API' | 'Database' | 'Package.json' | 'README' | 'Deployment'>('Frontend');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [deployingState, setDeployingState] = useState<'idle' | 'deploying' | 'completed'>('idle');

  // Group files by tabs based on their paths/names
  const tabFiles = {
    'Frontend': Object.keys(generatedFilesMap).filter(path => path.includes('src/pages') || path.includes('src/components') || path.includes('src/App.tsx')),
    'Backend': Object.keys(generatedFilesMap).filter(path => path.includes('src/backend') && !path.includes('routes')),
    'API': Object.keys(generatedFilesMap).filter(path => path.includes('src/backend/routes')),
    'Database': Object.keys(generatedFilesMap).filter(path => path.includes('database') || path.includes('schema')),
    'Package.json': Object.keys(generatedFilesMap).filter(path => path.includes('package.json')),
    'README': Object.keys(generatedFilesMap).filter(path => path.includes('README.md')),
    'Deployment': Object.keys(generatedFilesMap).filter(path => path.includes('deploy') || path.includes('docker') || path.includes('vite.config'))
  };

  const currentTabFiles = tabFiles[activeTab] || [];
  const [selectedFilePath, setSelectedFilePath] = useState<string>(currentTabFiles[0] || Object.keys(generatedFilesMap)[0]);

  // Update selected file when tab changes
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const files = tabFiles[tab];
    if (files && files.length > 0) {
      setSelectedFilePath(files[0]);
    }
  };

  const handleCopyCode = () => {
    const file = generatedFilesMap[selectedFilePath];
    if (!file) return;
    navigator.clipboard.writeText(file.content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    triggerToast("Copied standard code source back to clipboard!");
  };

  const handleDownloadZip = () => {
    try {
      const zip = new JSZip();
      
      Object.entries(generatedFilesMap).forEach(([filePath, fileObj]) => {
        const file = fileObj as GeneratedFile;
        zip.file(filePath, file.content);
      });
      
      triggerToast("📦 Slicing AST indices & bundling codebase ZIP...");
      
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, `${customProjectName.toLowerCase().replace(/\s+/g, '-')}-codebase.zip`);
        triggerToast("🎉 Successfully compiled and downloaded ZIP codebase archive!");
      });
    } catch (err: any) {
      console.error(err);
      triggerToast(`Error exporting ZIP codebase: ${err.message}`);
    }
  };

  const handleDeployTrigger = () => {
    setDeployingState('deploying');
    triggerToast("Initiating deployment pipeline to production clusters...");
    setTimeout(() => {
      setDeployingState('completed');
      triggerToast("Deployed production bundles live to enterprise VM cluster!");
    }, 2800);
  };

  const renderCodeWithHighlighting = (codeText: string) => {
    if (!codeText) return null;
    const lines = codeText.split('\n');
    return (
      <code className="font-mono text-[11px] block select-text leading-relaxed">
        {lines.map((line, idx) => {
          let renderElement: React.ReactNode = line;
          const isComment = line.trim().startsWith('//') || line.trim().startsWith('--') || line.trim().startsWith('/*') || line.trim().startsWith('*');
          if (isComment) {
            renderElement = <span className="text-zinc-500/80 italic">{line}</span>;
          } else {
            const terms = line.split(/(\s+|,|\.|\(|\)|\{|\}|\[|\]|;)/);
            renderElement = terms.map((word, wIdx) => {
              const cleaned = word.trim();
              if (['import', 'export', 'from', 'const', 'let', 'function', 'return', 'interface', 'type', 'class', 'default', 'async', 'await', 'select', 'create', 'table', 'CREATE', 'TABLE', 'use'].includes(cleaned)) {
                return <span key={wIdx} className="text-[#ffa116] font-semibold">{word}</span>;
              } else if (['if', 'else', 'try', 'catch', 'for', 'while', 'throw', 'new', 'Error'].includes(cleaned)) {
                return <span key={wIdx} className="text-pink-400">{word}</span>;
              } else if (['string', 'boolean', 'number', 'integer', 'decimal', 'any', 'void', 'Router', 'Request', 'Response', 'Headers', 'RequestInit', 'Props', 'interface'].includes(cleaned)) {
                return <span key={wIdx} className="text-blue-400 font-medium">{word}</span>;
              } else if ((word.startsWith('"') && word.endsWith('"')) || (word.startsWith("'") && word.endsWith("'")) || (word.startsWith('\`') && word.endsWith('\`'))) {
                return <span key={wIdx} className="text-emerald-400">{word}</span>;
              } else if (!isNaN(Number(cleaned)) && cleaned !== '') {
                return <span key={wIdx} className="text-teal-400 font-mono">{word}</span>;
              }
              return word;
            });
          }

          return (
            <div key={idx} className="flex hover:bg-zinc-900/50 px-4 py-0.5">
              <span className="w-10 text-zinc-600 text-right pr-4 shrink-0 font-mono text-[10px] select-none">{idx + 1}</span>
              <span className="whitespace-pre overflow-x-auto text-zinc-300 text-left flex-1 select-text">{renderElement}</span>
            </div>
          );
        })}
      </code>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-left max-w-[1360px] mx-auto px-1">
      {/* Top Celebrate Banner */}
      <div className="bg-zinc-950 border border-emerald-500/25 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-white text-sm font-extrabold tracking-tight">Your app is ready for operations</h3>
            <p className="text-zinc-550 text-[10.5px] font-mono leading-none">
              SSL certificates established • Logical tenant context bound on port 3000
            </p>
          </div>
        </div>

        {/* Quick dashboard metrics */}
        <div className="flex items-center gap-6 font-mono text-[10.5px]">
          <div className="text-center md:text-left">
            <span className="text-zinc-500 uppercase block text-[9px] font-mono tracking-wider">Modular files</span>
            <span className="text-white font-extrabold text-[13px]">{Object.keys(generatedFilesMap).length} files</span>
          </div>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="text-center md:text-left">
            <span className="text-zinc-500 uppercase block text-[9px] font-mono tracking-wider">Stack</span>
            <span className="text-white font-extrabold text-[13px] truncate max-w-[120px] inline-block">{techStack}</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {/* Code Tabs Header */}
        <div className="flex overflow-x-auto border-b border-white/5 bg-[#09090b] scrollbar-none">
          {(['Frontend', 'Backend', 'API', 'Database', 'Package.json', 'README', 'Deployment'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex-shrink-0 ${
                activeTab === tab 
                  ? 'bg-zinc-900 text-white border-b-2 border-blue-500' 
                  : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 h-[600px]">
          {/* Files List Sidebar */}
          <div className="lg:col-span-3 border-r border-white/5 bg-[#0c0c0e] overflow-y-auto p-2 scrollbar-thin">
            <div className="space-y-1">
              {currentTabFiles.length > 0 ? (
                currentTabFiles.map(filePath => {
                  const isSel = selectedFilePath === filePath;
                  const fileName = filePath.split('/').pop() || filePath;
                  return (
                    <button
                      key={filePath}
                      onClick={() => setSelectedFilePath(filePath)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        isSel 
                          ? 'bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20' 
                          : 'text-zinc-400 hover:bg-zinc-900 border border-transparent'
                      }`}
                    >
                      <FileText className={`w-4 h-4 shrink-0 ${isSel ? 'text-blue-400' : 'text-zinc-500'}`} />
                      <div className="truncate flex-1">
                        <span className="block text-xs truncate">{fileName}</span>
                        <span className="block text-[9px] text-zinc-600 truncate font-mono">{filePath}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-zinc-500 text-xs p-4 text-center">No files in this category.</div>
              )}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-9 flex flex-col bg-[#050505]">
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-[#0c0c0e]">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300 font-mono text-[11px] font-bold">
                  {selectedFilePath || 'Select a file'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  disabled={!selectedFilePath}
                  className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Copy Code"
                >
                  {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#050505] py-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {selectedFilePath && generatedFilesMap[selectedFilePath] ? (
                renderCodeWithHighlighting(generatedFilesMap[selectedFilePath].content)
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                  Select a file from the left panel to view its source code
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
        <button
          onClick={handleResetGenerator}
          className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Regenerate App
        </button>
        <button
          onClick={handleDownloadZip}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Download className="w-4 h-4" /> Download ZIP
        </button>
        <button
          onClick={handleDeployTrigger}
          disabled={deployingState !== 'idle'}
          className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg ${
            deployingState === 'idle'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              : deployingState === 'deploying'
              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
              : 'bg-emerald-950 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
          }`}
        >
          {deployingState === 'idle' && <Play className="w-4 h-4" />}
          {deployingState === 'deploying' && <RefreshCw className="w-4 h-4 animate-spin" />}
          {deployingState === 'completed' && <CheckCircle2 className="w-4 h-4" />}
          {deployingState === 'idle' ? 'Deploy to Production' : deployingState === 'deploying' ? 'Deploying...' : 'Deployed Live'}
        </button>
      </div>
    </div>
  );
}
