import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  PenTool, 
  CheckCircle2, 
  Zap,
  ArrowRight,
  Library,
  AlertCircle,
  FileText,
  Key
} from 'lucide-react';
import { AgentStep, ResearchReport } from './types';
import { planTopic, fetchMockSearch, mapContent, writeReport } from './services/geminiService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [query, setQuery] = useState('');
  const [step, setStep] = useState<AgentStep>('idle');
  const [refinedTopic, setRefinedTopic] = useState('');
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For auto-scrolling log or focus
  const resultRef = useRef<HTMLDivElement>(null);

  const handleResearch = async () => {
    if (!query.trim()) return;

    setStep('planning');
    setError(null);
    setReport(null);
    setRefinedTopic('');

    try {
      // 1. Plan
      const plannedTopic = await planTopic(query, apiKey);
      setRefinedTopic(plannedTopic);
      setStep('searching');

      // 2. Search
      const docs = await fetchMockSearch(plannedTopic);
      setStep('mapping');

      // 3. Map
      const notes = await mapContent(docs, apiKey);
      setStep('writing');

      // 4. Write
      const finalReport = await writeReport(notes, apiKey);
      setReport(finalReport);
      setStep('complete');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during the research process.");
      setStep('error');
    }
  };

  // Auto scroll to result when complete
  useEffect(() => {
    if (step === 'complete' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [step]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* Header */}
      <header className="text-center space-y-3 mt-8 mb-6 border-b-2 border-stone-800 pb-8">
        <div className="flex justify-center mb-2">
          <Library size={48} className="text-stone-800" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-stone-900">
          The Research Archive
        </h1>
        <p className="text-stone-600 text-lg font-serif italic">
          Professional Inquiry & Intelligent Synthesis
        </p>
      </header>

      {/* Input Section */}
      <div className="paper-card p-6 rounded-none space-y-6">
        
        {/* API Key Input - Only visible when idle */}
        {step === 'idle' && (
          <div>
            <label className="block text-stone-700 text-sm font-bold uppercase tracking-wider mb-2">
              API Key (Secure)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500">
                <Key size={20} />
              </div>
              <input
                type="password"
                className="paper-input w-full p-3 pl-12 text-base font-serif placeholder-stone-400 rounded-none"
                placeholder="Paste your Google API Key here..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-stone-700 text-sm font-bold uppercase tracking-wider mb-2">
            Research Subject
          </label>
          <div className="flex flex-col md:flex-row gap-0">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500">
                <Search size={20} />
              </div>
              <input
                type="text"
                className="paper-input w-full p-4 pl-12 text-lg font-serif placeholder-stone-400 rounded-none border-r-0 md:border-r-0"
                placeholder="Enter topic for analysis (e.g., Quantum Computing)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                disabled={step !== 'idle' && step !== 'complete' && step !== 'error'}
              />
            </div>
            <button
              onClick={handleResearch}
              disabled={step !== 'idle' && step !== 'complete' && step !== 'error'}
              className="btn-vintage py-4 px-8 font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>Initiate</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress / Status Section */}
      {(step !== 'idle') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-300 pb-2">
            <div className={`w-2 h-2 rounded-full ${step === 'error' ? 'bg-red-600' : 'bg-green-600 animate-pulse'}`}></div>
            <h3 className="text-stone-500 uppercase tracking-widest text-xs font-bold">System Status</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Step 1: Plan */}
            <StatusCard 
              isActive={step === 'planning'} 
              isDone={['searching', 'mapping', 'writing', 'complete'].includes(step)}
              icon={<Zap size={20} />}
              label="Planning"
              subtext="Defining Scope"
            />

            {/* Step 2: Search */}
            <StatusCard 
              isActive={step === 'searching'} 
              isDone={['mapping', 'writing', 'complete'].includes(step)}
              icon={<Search size={20} />}
              label="Retrieval"
              subtext="Sourcing Data"
            />

            {/* Step 3: Map */}
            <StatusCard 
              isActive={step === 'mapping'} 
              isDone={['writing', 'complete'].includes(step)}
              icon={<BookOpen size={20} />}
              label="Analysis"
              subtext="Extracting Facts"
            />

            {/* Step 4: Write */}
            <StatusCard 
              isActive={step === 'writing'} 
              isDone={step === 'complete'}
              icon={<PenTool size={20} />}
              label="Synthesis"
              subtext="Drafting Report"
            />
          </div>
        </div>
      )}

      {/* Refined Topic Banner */}
      {refinedTopic && (
        <div className="bg-[#e8e6df] border-l-4 border-stone-600 p-4 font-serif italic text-stone-700 animate-fade-in">
          <span className="font-bold not-italic text-stone-900 text-xs uppercase tracking-wide block mb-1">Current Directive:</span>
          "{refinedTopic}"
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-800 text-red-900 p-6 flex flex-col items-center text-center">
          <AlertCircle size={48} className="mb-4 text-red-800" />
          <p className="text-xl font-bold font-serif mb-2">System Error</p>
          <p className="max-w-md">{error}</p>
          <button 
            onClick={() => setStep('idle')}
            className="mt-6 px-6 py-2 border border-red-800 hover:bg-red-100 transition-colors uppercase text-sm font-bold tracking-wider"
          >
            Reset System
          </button>
        </div>
      )}

      {/* Final Report */}
      {step === 'complete' && report && (
        <div ref={resultRef} className="animate-slide-up pb-12">
          
          <div className="paper-card p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-stone-800"></div>
            
            {/* Report Header */}
            <div className="mb-10 border-b-2 border-stone-200 pb-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-stone-800 text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">
                  Report Generated
                </span>
                <span className="text-stone-400 text-xs uppercase tracking-widest">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight mb-4">
                {report.title}
              </h2>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              
              {/* Main Content */}
              <div className="md:col-span-2 space-y-10">
                <section>
                  <h3 className="text-stone-800 font-bold uppercase tracking-wider mb-4 text-sm flex items-center gap-2 border-b border-stone-300 pb-2">
                    <FileText size={18} /> Executive Summary
                  </h3>
                  <p className="text-stone-700 leading-relaxed text-lg font-serif text-justify">
                    {report.summary}
                  </p>
                </section>

                <section>
                  <h3 className="text-stone-800 font-bold uppercase tracking-wider mb-4 text-sm flex items-center gap-2 border-b border-stone-300 pb-2">
                    <Zap size={18} /> Key Findings
                  </h3>
                  <ul className="space-y-4">
                    {report.key_points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <span className="font-serif font-bold text-stone-400 text-xl leading-none mt-1">
                          {(idx + 1).toString().padStart(2, '0')}.
                        </span>
                        <span className="text-stone-700 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Sidebar Verdict */}
              <div className="md:col-span-1">
                <div className="bg-[#f2f0e9] p-6 border border-stone-300 sticky top-8">
                  <div className="w-12 h-1 bg-stone-800 mb-6"></div>
                  <h3 className="text-stone-500 font-bold uppercase tracking-wider mb-4 text-xs">
                    Final Conclusion
                  </h3>
                  <p className="text-stone-900 font-serif text-xl italic leading-relaxed">
                    "{report.verdict}"
                  </p>
                  <div className="mt-8 pt-6 border-t border-stone-300 text-[10px] text-stone-400 text-center uppercase tracking-widest">
                    Powered by Gemini 2.5 Flash Lite
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => {
                setStep('idle');
                setQuery('');
                setReport(null);
                setRefinedTopic('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-stone-500 hover:text-stone-800 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowRight size={14} className="rotate-180" />
              Conduct New Research
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper Component for Status Steps
interface StatusCardProps {
  isActive: boolean;
  isDone: boolean;
  icon: React.ReactNode;
  label: string;
  subtext: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ isActive, isDone, icon, label, subtext }) => {
  let containerClass = "bg-[#fdfbf7] border-stone-300 text-stone-400";
  
  if (isActive) {
    containerClass = "bg-stone-800 border-stone-800 text-white shadow-lg scale-105";
  } else if (isDone) {
    containerClass = "bg-[#e8e6df] border-stone-400 text-stone-700";
  }

  return (
    <div className={`p-4 border transition-all duration-500 ease-in-out flex flex-col items-center text-center ${containerClass}`}>
      <div className="mb-2">
        {isDone ? <CheckCircle2 size={24} className="text-stone-600" /> : icon}
      </div>
      <div className="font-bold text-sm uppercase tracking-wider">{label}</div>
      <div className={`text-xs mt-1 ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>{subtext}</div>
    </div>
  );
};

export default App;