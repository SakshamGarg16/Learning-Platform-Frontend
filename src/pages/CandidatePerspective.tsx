import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Monitor,
    Sparkles,
    Activity,
    Shield,
    Menu,
    X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif'
});

const MermaidDiagram = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (ref.current && chart) {
            const id = `mermaid-render-${Math.random().toString(36).substring(2, 12)}`;
            const renderDiagram = async () => {
                try {
                    setError(null);
                    let rawContent = chart.trim();
                    rawContent = rawContent.replace(/;/g, '\n');
                    const diagramKeywords = ['graph', 'flowchart', 'sequenceDiagram', 'stateDiagram', 'classDiagram', 'gantt', 'pie', 'erDiagram'];
                    const lowerContent = rawContent.toLowerCase();
                    let startIndex = -1;
                    for (const kw of diagramKeywords) {
                        const idx = lowerContent.indexOf(kw);
                        if (idx !== -1 && (startIndex === -1 || idx < startIndex)) startIndex = idx;
                    }
                    let cleanChart = startIndex !== -1 ? rawContent.substring(startIndex) : `graph TD\n${rawContent}`;
                    cleanChart = cleanChart.replace(/```mermaid/g, '').replace(/```/g, '').trim();

                    const { svg } = await mermaid.render(id, cleanChart);
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                        const svgElement = ref.current.querySelector('svg');
                        if (svgElement) {
                            svgElement.style.maxWidth = '1000px';
                            svgElement.style.height = 'auto';
                            svgElement.style.display = 'block';
                            svgElement.style.margin = '0 auto';
                        }
                    }
                } catch (err) {
                    setError("Structural Matrix Fallback Mode Active.");
                }
            };
            renderDiagram();
        }
    }, [chart]);

    if (error) return (
        <div className="my-10 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 text-xs font-mono text-neutral-400">
            <div className="font-bold mb-4 flex items-center gap-2 text-red-500/80 uppercase tracking-widest text-[10px]">
                <Monitor size={14} /> Matrix Integrity Anomaly
            </div>
            <pre className="opacity-80 whitespace-pre-wrap">{chart}</pre>
        </div>
    );

    return (
        <div className="my-12 p-8 md:p-12 rounded-[2.5rem] bg-neutral-900/40 border border-neutral-800 flex flex-col items-center">
            <div ref={ref} className="mermaid-render w-full flex justify-center items-center" />
        </div>
    );
};

export default function CandidatePerspective() {
    const { trackId, learnerId } = useParams<{ trackId: string; learnerId: string }>();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'overview' | 'lesson' | 'assessment'>('overview');
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const { data: dossier, isLoading } = useQuery({
        queryKey: ['dossier', trackId, learnerId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/candidate_dossier/${learnerId}/`)).data,
        enabled: !!trackId && !!learnerId
    });

    const currentLesson = dossier?.modules.flatMap((m: any) => m.lessons).find((l: any) => l.id === selectedLessonId);
    const currentModule = dossier?.modules.find((m: any) => m.id === selectedModuleId);

    const handleLessonSelect = (id: string) => {
        setSelectedLessonId(id);
        setSelectedModuleId(null);
        setViewMode('lesson');
        setIsMobileSidebarOpen(false);
    };

    const handleAssessmentSelect = (moduleId: string) => {
        setSelectedModuleId(moduleId);
        setSelectedLessonId(null);
        setViewMode('assessment');
        setIsMobileSidebarOpen(false);
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-12">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="flex justify-center"><Activity className="text-blue-500 animate-spin" size={48} /></div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Intercepting Candidate Stream...</h2>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2, repeat: Infinity }} className="h-full bg-blue-500" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-200 selection:bg-blue-500/30 flex relative">
            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <aside className={`
                w-80 border-r border-neutral-800 bg-[#080808] flex flex-col fixed inset-y-0 left-0 z-[70] h-full
                transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-8 border-b border-neutral-800 space-y-4 relative">
                    <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="absolute top-4 right-4 p-2 text-neutral-500 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Back to Builder
                    </button>
                    <div className="flex items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black">
                            {dossier?.learner.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="font-bold text-white leading-tight">{dossier?.learner.name}</h2>
                            <p className="text-[10px] text-neutral-500 font-mono tracking-tighter uppercase">Learner Perspective</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
                    <button
                        onClick={() => setViewMode('overview')}
                        className={`w-full text-left p-4 rounded-3xl transition-all duration-300 flex items-center gap-4 ${viewMode === 'overview'
                            ? 'bg-neutral-800 text-white shadow-xl border border-white/10'
                            : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                            }`}
                    >
                        <div className={`p-2 rounded-xl ${viewMode === 'overview' ? 'bg-blue-500 text-white' : 'bg-neutral-900 border border-neutral-800'}`}>
                            <BookOpen size={16} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Architectural Map</span>
                    </button>

                    <div className="h-px bg-neutral-800/50 mx-2" />

                    {dossier?.modules.map((module: any, mIdx: number) => (
                        <div key={module.id} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <span className="text-[10px] font-black font-mono text-neutral-600 tabular-nums">{String(mIdx + 1).padStart(2, '0')}</span>
                                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] truncate">{module.title}</h3>
                            </div>
                            <div className="space-y-1">
                                {module.lessons.map((lesson: any) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => handleLessonSelect(lesson.id)}
                                        className={`w-full text-left p-3 rounded-2xl transition-all duration-300 flex items-center gap-3 group ${selectedLessonId === lesson.id && viewMode === 'lesson'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg shrink-0 ${selectedLessonId === lesson.id && viewMode === 'lesson' ? 'bg-white/20' : 'bg-neutral-900 border border-neutral-800'}`}>
                                            <Shield size={12} />
                                        </div>
                                        <span className="text-[11px] font-bold truncate">{lesson.title}</span>
                                    </button>
                                ))}
                                {module.assessment && (
                                    <button
                                        onClick={() => handleAssessmentSelect(module.id)}
                                        className={`w-full text-left p-3 rounded-2xl transition-all duration-300 flex items-center gap-3 group ${selectedModuleId === module.id && viewMode === 'assessment'
                                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                            : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg shrink-0 ${selectedModuleId === module.id && viewMode === 'assessment' ? 'bg-white/20' : 'bg-neutral-900 border border-neutral-800 text-amber-500'}`}>
                                            <CheckCircle2 size={12} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest truncate">Module Test</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="px-6 py-6 md:p-8 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 transition-all duration-500">
                    <div className="flex items-center gap-4 md:gap-6">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white lg:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        {viewMode !== 'overview' && (
                            <button
                                onClick={() => setViewMode('overview')}
                                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all duration-300 group"
                            >
                                <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        )}
                        <div className="flex items-center gap-3">
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 font-black uppercase text-[10px] tracking-widest h-8">Audit State</Badge>
                            <div className="h-4 w-px bg-neutral-800" />
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.h1
                                key={viewMode === 'overview' ? 'overview-title' : (selectedLessonId || selectedModuleId)}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-xl font-bold text-white tracking-tight"
                            >
                                {viewMode === 'overview' ? "Syllabus Infrastructure Overview" : (viewMode === 'lesson' ? currentLesson?.title : `Audit: ${currentModule?.title} Test`)}
                            </motion.h1>
                        </AnimatePresence>
                    </div>
                    {viewMode === 'lesson' && currentLesson?.has_personalized_content && (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 h-8">
                            <Sparkles size={12} /> Personalized
                        </Badge>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-24 bg-[#050505]">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence mode="wait">
                            {viewMode === 'overview' ? (
                                <motion.div
                                    key="overview-content"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-16"
                                >
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 rounded-[2rem] bg-blue-500/10 border border-blue-500/20">
                                                <Activity size={32} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Academic Map</h2>
                                                <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.3em]">Module Hierarchy & Strategy</p>
                                            </div>
                                        </div>

                                        <Card className="p-6 md:p-10 bg-blue-500/5 border-blue-500/20 border-dashed rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                                                <Sparkles size={80} />
                                            </div>
                                            <div className="relative z-10 space-y-4">
                                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    AI Strategy Trace <div className="h-px w-8 bg-blue-500/30" />
                                                </div>
                                                <p className="text-lg text-neutral-300 leading-relaxed italic font-serif">
                                                    "{dossier.personalized_summary}"
                                                </p>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="space-y-6">
                                        {dossier.modules.map((module: any, mIdx: number) => (
                                            <div key={module.id} className="relative group p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-neutral-900/30 border border-neutral-800 hover:border-blue-500/20 transition-all duration-700">
                                                <div className="absolute top-0 left-10 -translate-y-1/2 bg-[#050505] px-4 py-1 border border-neutral-800 rounded-full">
                                                    <span className="text-[10px] font-black font-mono text-neutral-600 uppercase tracking-widest italic">Node {mIdx + 1}</span>
                                                </div>

                                                <div className="space-y-8">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-2xl font-black text-white tracking-tight">{module.title}</h3>
                                                        {module.assessment && (
                                                            <button
                                                                onClick={() => handleAssessmentSelect(module.id)}
                                                                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                                                            >
                                                                <CheckCircle2 size={12} /> View Evaluation
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {module.lessons.map((lesson: any) => (
                                                            <button
                                                                key={lesson.id}
                                                                onClick={() => handleLessonSelect(lesson.id)}
                                                                className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-black/40 border border-white/5 hover:border-blue-500/30 hover:bg-neutral-900/50 transition-all duration-500 text-left group/lesson relative overflow-hidden"
                                                            >
                                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/lesson:opacity-30 transition-opacity">
                                                                    <Shield size={40} className="text-blue-500" />
                                                                </div>
                                                                <div className="space-y-3 relative z-10">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-500">
                                                                            <BookOpen size={14} />
                                                                        </div>
                                                                        <Badge variant="neutral" className="text-[8px] bg-white/5 opacity-50 px-2 uppercase font-black">Core Segment</Badge>
                                                                    </div>
                                                                    <h4 className="font-bold text-neutral-200 group-hover/lesson:text-white transition-colors">{lesson.title}</h4>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : viewMode === 'lesson' ? (
                                <motion.div
                                    key="lesson-content"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-12"
                                >
                                    {/* Sub-Header for lesson */}
                                    <div className="flex justify-between items-end pb-12 border-b border-neutral-900">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                                Active Drilldown <ChevronRight size={10} /> {currentLesson?.title}
                                            </p>
                                            <h2 className="text-4xl font-black text-white tracking-tighter leading-none italic">{currentLesson?.title}</h2>
                                        </div>
                                        <button
                                            onClick={() => setViewMode('overview')}
                                            className="text-[10px] font-black text-neutral-500 hover:text-white transition-colors uppercase tracking-widest border border-neutral-800 px-4 py-2 rounded-xl"
                                        >
                                            Return to Map
                                        </button>
                                    </div>

                                    <article className="prose prose-invert prose-blue max-w-none study-content">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p({ node, children, ...props }: any) {
                                                    const text = String(children);
                                                    const mermaidKeywords = ['graph ', 'flowchart ', 'sequenceDiagram', 'stateDiagram', 'classDiagram', 'gantt', 'pie', 'erDiagram'];
                                                    const isLikelyMermaid = mermaidKeywords.some(kw => text.trim().startsWith(kw));

                                                    if (isLikelyMermaid && text.length > 20) {
                                                        return <MermaidDiagram chart={text.trim()} />;
                                                    }
                                                    return <p {...props}>{children}</p>;
                                                },
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const content = String(children).trim();
                                                    const hasNewline = content.includes('\n');
                                                    const isSimple = !hasNewline && content.length < 80;

                                                    if (match && match[1] === 'mermaid' || (!inline && content.startsWith('graph '))) {
                                                        return <MermaidDiagram chart={content} />;
                                                    }

                                                    if (inline) {
                                                        return <code className="bg-neutral-800 text-blue-400 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...props}>{children}</code>;
                                                    }

                                                    if (isSimple) {
                                                        return (
                                                            <code className="bg-neutral-900/50 text-blue-300 px-2 py-1 mx-1 rounded-md border border-neutral-800 font-mono text-sm inline-block align-middle shadow-sm" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }

                                                    return (
                                                        <div className="my-8 rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/50 group shadow-lg">
                                                            <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-900/80 flex justify-between items-center text-xs opacity-60">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                                                                    <span className="font-mono font-bold text-neutral-400 uppercase tracking-widest">{match ? match[1] : 'Source Code'}</span>
                                                                </div>
                                                                <Badge variant="neutral" className="bg-white/5 text-[9px] uppercase font-black tracking-tighter px-2">Technical Scan</Badge>
                                                            </div>
                                                            <pre className="p-8 overflow-x-auto text-[0.95em] font-mono text-blue-50 leading-relaxed scrollbar-hide" {...props}>
                                                                {children}
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                            }}
                                        >
                                            {currentLesson?.content || "No content generated yet."}
                                        </ReactMarkdown>
                                    </article>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="assessment-content"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-12"
                                >
                                    {/* Sub-Header for assessment audit */}
                                    <div className="flex justify-between items-start pb-12 border-b border-neutral-900">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                                Node Evaluation Audit <ChevronRight size={10} /> {currentModule?.title}
                                            </p>
                                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none italic uppercase">Technical Evaluation</h2>
                                            <div className="flex items-center gap-4 pt-2">
                                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 font-black uppercase text-[10px] tracking-widest">
                                                    {currentModule?.assessment?.attempts.length || 0} Attempts Recorded
                                                </Badge>
                                                {currentModule?.assessment?.attempts[0] && (
                                                    <Badge className={`${currentModule.assessment.attempts[0].passed ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} px-3 py-1 font-black uppercase text-[10px] tracking-widest`}>
                                                        Audit Status: {currentModule.assessment.attempts[0].passed ? 'PASSED' : 'DEFICIENCY'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {currentModule?.assessment?.attempts[0] && (
                                            <div className="bg-neutral-900/50 border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[160px] relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1 relative z-10">Candidate mastery</span>
                                                <div className="flex items-baseline gap-1 relative z-10">
                                                    <span className={`text-5xl font-black italic tracking-tighter ${currentModule.assessment.attempts[0].passed ? 'text-green-400' : 'text-red-400'}`}>
                                                        {Math.round(currentModule.assessment.attempts[0].score)}
                                                    </span>
                                                    <span className="text-neutral-500 font-bold text-xl">/100</span>
                                                </div>
                                                <div className="mt-2 text-[10px] font-mono text-neutral-600 uppercase tracking-tight relative z-10">Final Marks</div>
                                            </div>
                                        )}
                                    </div>

                                    {currentModule?.assessment?.attempts.map((attempt: any, aIdx: number) => (
                                        <div key={attempt.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${aIdx * 100}ms` }}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${attempt.passed ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                                    {Math.round(attempt.score)}%
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white italic uppercase tracking-tight text-sm">Attempt {currentModule.assessment.attempts.length - aIdx}</h3>
                                                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                                                        {new Date(attempt.created_at).toLocaleDateString()} • {attempt.passed ? 'Succeeded' : 'Deficiency Identified'}
                                                    </p>
                                                </div>
                                            </div>

                                            <Card className="p-6 md:p-8 bg-neutral-900/30 border-neutral-800 rounded-[2rem] md:rounded-[2.5rem] space-y-10">
                                                {/* AI Feedback */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                                                        Pedagogical Analysis <div className="h-px w-8 bg-blue-500/30" />
                                                    </div>
                                                    <div className="text-neutral-300 leading-relaxed text-sm italic font-serif prose prose-invert prose-indigo max-w-none">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mb-2 mt-4 first:mt-0" {...props} />,
                                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                                strong: ({ node, ...props }) => <strong className="text-white font-bold" {...props} />,
                                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-neutral-400" {...props} />,
                                                                code: ({ node, ...props }) => <code className="bg-neutral-800 text-blue-300 px-1 py-0.5 rounded font-mono text-[0.85em]" {...props} />
                                                            }}
                                                        >
                                                            {attempt.ai_feedback}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-neutral-800" />

                                                {/* Questions & Answers */}
                                                <div className="space-y-12">
                                                    {currentModule.assessment.questions.map((q: any, qIdx: number) => {
                                                        // Ensure we handle both string and numeric keys in answers_data
                                                        const rawUserAnswer = attempt.answers[qIdx] !== undefined ? attempt.answers[qIdx] : attempt.answers[String(qIdx)];

                                                        // Handle both q.correct_answer (array or single) and legacy q.correct_index
                                                        const correctSet = new Set(
                                                            Array.isArray(q.correct_answer)
                                                                ? q.correct_answer.map(String)
                                                                : q.correct_answer !== undefined
                                                                    ? [String(q.correct_answer)]
                                                                    : q.correct_index !== undefined
                                                                        ? [String(q.correct_index)]
                                                                        : []
                                                        );

                                                        // Fixed isCorrect logic for multi-select (arrays)
                                                        const isCorrect = Array.isArray(rawUserAnswer)
                                                            ? rawUserAnswer.length === correctSet.size && rawUserAnswer.every(val => correctSet.has(String(val)))
                                                            : correctSet.has(String(rawUserAnswer));

                                                        return (
                                                            <div key={qIdx} className="space-y-6">
                                                                <div className="flex gap-4">
                                                                    <span className="text-[10px] font-black font-mono text-neutral-600 mt-1 tabular-nums">{String(qIdx + 1).padStart(2, '0')}</span>
                                                                    <p className="font-bold text-white text-lg tracking-tight leading-snug">{q.question || q.text}</p>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                                                    {q.options.map((opt: string, oIdx: number) => {
                                                                        const oIdxStr = String(oIdx);
                                                                        const isSelected = Array.isArray(rawUserAnswer)
                                                                            ? rawUserAnswer.map(String).includes(oIdxStr)
                                                                            : String(rawUserAnswer) === oIdxStr;

                                                                        const isRightAnswer = correctSet.has(oIdxStr);

                                                                        let statusClass = "border-neutral-800 text-neutral-500 bg-black/20";
                                                                        if (isSelected) statusClass = isCorrect ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-red-500/50 bg-red-500/10 text-red-400";
                                                                        if (isRightAnswer && (!isSelected || !isCorrect)) statusClass = "border-blue-500/30 bg-blue-500/5 text-blue-400/80";

                                                                        return (
                                                                            <div key={oIdx} className={`p-4 rounded-2xl border transition-all text-xs font-medium flex items-center justify-between relative group/opt overflow-hidden ${statusClass}`}>
                                                                                <span className="relative z-10">{opt}</span>
                                                                                <div className="flex items-center gap-2 relative z-10">
                                                                                    {isSelected && (
                                                                                        <Badge className={`${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter flex items-center gap-1`}>
                                                                                            {isCorrect ? 'MARK CORRECT' : 'MARK FAIL'}
                                                                                        </Badge>
                                                                                    )}
                                                                                    {isRightAnswer && !isSelected && (
                                                                                        <Badge className="bg-blue-500/20 text-blue-400 border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter">
                                                                                            EXPECTED KEY
                                                                                        </Badge>
                                                                                    )}
                                                                                    {isSelected && (isCorrect ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex items-center justify-center text-[8px] font-black italic">!</div>)}
                                                                                    {isRightAnswer && !isSelected && <Shield size={14} className="opacity-60" />}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Explicit Audit Trace for this question */}
                                                                <div className="ml-8 mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                                    <div className="flex items-center gap-6">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                                                                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Candidate marked:</span>
                                                                            <span className={`text-[10px] font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                                                {Array.isArray(rawUserAnswer) ? rawUserAnswer.map(idx => q.options[idx]).join(", ") : q.options[rawUserAnswer] || 'UNMARKED'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                                                                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Correct Audit Key:</span>
                                                                            <span className="text-[10px] font-bold text-blue-400">
                                                                                {Array.isArray(q.correct_answer) ? q.correct_answer.map((idx: any) => q.options[idx]).join(", ") : q.options[q.correct_answer || q.correct_index]}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${isCorrect ? 'bg-green-500/10 text-green-500/80 border border-green-500/20' : 'bg-red-500/10 text-red-500/80 border border-red-500/20'}`}>
                                                                        {isCorrect ? 'Aligned' : 'Divergence'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </Card>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .study-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 2rem; }
                .study-content li { margin-bottom: 0.75rem; color: #a3a3a3; }
                .study-content strong { color: #fff; font-weight: 700; }
                .study-content blockquote { border-left: 4px solid #3b82f6; padding: 1.5rem 2rem; font-style: italic; color: #93c5fd; margin: 2.5rem 0; background: rgba(59, 130, 246, 0.05); border-radius: 0 1rem 1rem 0; }
                
                /* Table Styling */
                .study-content table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2.5rem 0; border: 1px solid #262626; border-radius: 1.25rem; overflow: hidden; background: rgba(23, 23, 23, 0.4); }
                .study-content th { background: rgba(38, 38, 38, 0.8); color: #fff; font-weight: 700; text-align: left; padding: 1.25rem 1.5rem; border-bottom: 1px solid #262626; font-size: 0.85rem; text-transform: uppercase; }
                .study-content td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #171717; color: #a3a3a3; font-size: 0.95rem; }
            `}} />
        </div>
    );
}
