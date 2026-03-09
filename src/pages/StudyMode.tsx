import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Minimize2,
    Monitor,
    Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

// Initialize Mermaid with manual control
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif'
});

// --- Mermaid Diagram Component ---
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

                    // 1. Initial Normalization: Treat semicolons as newlines
                    rawContent = rawContent.replace(/;/g, '\n');

                    // 2. Structural Root Discovery
                    const diagramKeywords = ['graph', 'flowchart', 'sequenceDiagram', 'stateDiagram', 'classDiagram', 'gantt', 'pie', 'erDiagram'];
                    const lowerContent = rawContent.toLowerCase();
                    let startIndex = -1;
                    for (const kw of diagramKeywords) {
                        const idx = lowerContent.indexOf(kw);
                        if (idx !== -1 && (startIndex === -1 || idx < startIndex)) startIndex = idx;
                    }

                    // 3. Fallback to graph TD if no root found
                    let cleanChart = startIndex !== -1 ? rawContent.substring(startIndex) : `graph TD\n${rawContent}`;

                    // 4. Basic Sanitization: Remove any stray backticks or markdown fences that hallucinated inside
                    cleanChart = cleanChart.replace(/```mermaid/g, '').replace(/```/g, '').trim();

                    const { svg } = await mermaid.render(id, cleanChart);
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                        const svgElement = ref.current.querySelector('svg');
                        if (svgElement) {
                            svgElement.style.maxWidth = '100%';
                            svgElement.style.height = 'auto';
                            svgElement.style.display = 'block';
                            svgElement.style.margin = '0 auto';
                        }
                    }
                } catch (err) {
                    console.error("Mermaid Render Error:", err);
                    setError("Structural Matrix Fallback Mode Active.");
                }
            };

            renderDiagram();
        }
    }, [chart]);

    if (error) {
        return (
            <div className="my-10 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 text-xs font-mono text-neutral-400 max-w-full overflow-hidden shadow-2xl">
                <div className="font-bold mb-4 flex items-center gap-2 text-red-500/80 uppercase tracking-widest text-[10px]">
                    <Monitor size={14} /> Matrix Integrity Anomaly
                </div>
                <pre className="opacity-80 whitespace-pre-wrap text-[11px] bg-black/40 p-6 rounded-2xl border border-white/5 leading-relaxed overflow-x-auto custom-scrollbar">
                    {chart}
                </pre>
            </div>
        );
    }

    return (
        <div className="my-16 p-6 md:p-16 lg:p-24 rounded-[3.5rem] bg-neutral-900/40 border border-neutral-800 shadow-[20px_20px_60px_#050505,-20px_-20px_60px_#151515] flex flex-col items-center overflow-visible min-h-[500px]">
            <div className="w-full overflow-x-auto overflow-y-visible py-12 custom-scrollbar flex justify-center">
                <div
                    ref={ref}
                    className="mermaid-render text-center transition-opacity duration-700 w-full flex justify-center items-center"
                />
            </div>
        </div>
    );
};

export function StudyMode() {
    const { trackId, lessonId } = useParams<{ trackId: string; lessonId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isFocused, setIsFocused] = useState(false);

    // 1. Fetch Lesson & Track Data
    const { data: lesson, isLoading: isLoadingLesson } = useQuery({
        queryKey: ['lesson', lessonId],
        queryFn: async () => (await api.get(`/lessons/${lessonId}/`)).data,
        enabled: !!lessonId
    });

    const { data: track } = useQuery({
        queryKey: ['track', trackId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/`)).data,
        enabled: !!trackId
    });

    // 2. AI Content Generation Mutation
    const generateMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post(`/lessons/${lessonId}/generate_content/`);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['lesson', lessonId], (old: any) => ({
                ...old,
                content: data.content
            }));
        }
    });

    // 3. Auto-trigger generation if content is empty
    useEffect(() => {
        if (lesson && !lesson.content && !generateMutation.isPending && !generateMutation.isError && !generateMutation.isSuccess) {
            generateMutation.mutate();
        }
    }, [lesson, generateMutation]);

    if (isLoadingLesson) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-neutral-500 font-mono text-sm animate-pulse">Initializing Study Environment...</p>
            </div>
        );
    }

    const isGenerating = generateMutation.isPending;

    return (
        <div className={`min-h-screen bg-neutral-950 text-neutral-100 ${isFocused ? 'fixed inset-0 z-[100] overflow-y-auto' : ''}`}>
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/track/enroll/${trackId}`}
                        className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="h-6 w-[1px] bg-neutral-800 mx-2" />
                    <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">
                            {track?.title || 'Learning Track'}
                        </p>
                        <h1 className="text-sm font-semibold text-white truncate max-w-[300px]">
                            {lesson?.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsFocused(!isFocused)}
                        className="hidden sm:flex"
                        leftIcon={isFocused ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    >
                        {isFocused ? 'Exit Focus' : 'Focus Mode'}
                    </Button>
                    <div className="h-6 w-[1px] bg-neutral-800 mx-1 hidden sm:block" />
                    <Badge variant="indigo" className="hidden md:flex gap-1.5 items-center">
                        <Sparkles size={12} /> AI Content Engine
                    </Badge>
                </div>
            </header>

            {/* Main Study Content Area */}
            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <AnimatePresence mode="wait">
                    {isGenerating ? (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <div className="h-10 bg-neutral-900 rounded-lg w-3/4 animate-pulse" />
                                <div className="h-4 bg-neutral-900 rounded-lg w-1/2 animate-pulse" />
                            </div>
                            <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col items-center text-center space-y-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Synthesizing Deep Dive Content</h3>
                                    <p className="text-neutral-400 max-w-sm">
                                        The AI is decomposing the technical requirements of this lesson and structuring a rigorous study path.
                                    </p>
                                </div>
                                <div className="w-full max-w-xs h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-indigo-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 15, ease: "linear" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose prose-invert prose-indigo max-w-none"
                        >
                            <header className="mb-12 border-b border-neutral-800 pb-8">
                                <Badge variant="indigo" className="mb-4">Lesson Module</Badge>
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                                    {lesson?.title}
                                </h1>
                                <div className="flex items-center gap-4 text-neutral-400 text-sm">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <BookOpen size={16} className="text-indigo-400" /> Advanced Analysis
                                    </span>
                                    <span className="text-neutral-700">|</span>
                                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                        <CheckCircle2 size={16} /> Concepts Verified
                                    </span>
                                </div>
                            </header>

                            <article className="text-neutral-300 leading-relaxed text-lg study-content">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mt-12 mb-6 border-l-4 border-indigo-500 pl-4" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-indigo-300 mt-8 mb-4 flex items-center gap-2">
                                            <Monitor size={18} className="text-indigo-500" /> {props.children}
                                        </h3>,
                                        p: ({ node, ...props }) => <div className="mb-8 leading-[1.8]" {...props} />,
                                        img: ({ src, alt }: { src?: string; alt?: string }) => {
                                            // 1. Retroactive Fix for deprecated Unsplash Source
                                            // 2. Ensuring relevance: Using strictly professional tags for placeholders
                                            const finalSrc = src?.includes('source.unsplash.com') || src?.includes('loremflickr.com')
                                                ? `https://loremflickr.com/1024/576/programming,coding,software,server,circuit?lock=${Math.floor(Math.random() * 10)}`
                                                : src;

                                            return (
                                                <div className="my-10 space-y-4">
                                                    <div className="rounded-[2.5rem] overflow-hidden border border-neutral-800 shadow-2xl shadow-indigo-500/5 group relative">
                                                        {/* Subtle Overlay for professionalism */}
                                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <img
                                                            src={finalSrc}
                                                            alt={alt}
                                                            className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-[1.2s] ease-out min-h-[300px]"
                                                        />
                                                    </div>
                                                    {alt && (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <div className="h-px w-8 bg-neutral-800" />
                                                            <span className="text-center text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{alt}</span>
                                                            <div className="h-px w-8 bg-neutral-800" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        },
                                        code: ({ node, inline, className, children, ...props }: any) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const isMermaid = match && match[1] === 'mermaid';

                                            if (isMermaid) {
                                                return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                                            }

                                            if (inline) {
                                                return <code className="bg-neutral-800 text-indigo-400 px-1.5 py-0.5 rounded-md font-mono text-[0.9em]" {...props}>{children}</code>;
                                            }

                                            // Heuristic: If it's a code block but has no newlines 
                                            // and is very short, it's likely shouldn't be a "terminal"
                                            const content = String(children).trim();
                                            const hasNewline = content.includes('\n');
                                            const isSimple = !hasNewline && content.length < 80;

                                            if (isSimple) {
                                                return (
                                                    <code className="bg-neutral-900/50 text-indigo-300 px-2 py-1 mx-1 rounded-md border border-neutral-800 font-mono text-sm inline-block align-middle" {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }

                                            return (
                                                <div className="my-8 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/50 group shadow-lg">
                                                    <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm flex justify-between items-center text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                                                            <span className="font-bold text-neutral-400 uppercase tracking-widest ml-1 text-[9px]">
                                                                {match ? match[1] : 'Source Code'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500 italic">
                                                            <span>premium render</span>
                                                            <Sparkles size={8} className="text-amber-500/50" />
                                                        </div>
                                                    </div>
                                                    <pre className="p-6 overflow-x-auto text-[0.9em] font-mono text-indigo-50 leading-relaxed" {...props}>
                                                        {children}
                                                    </pre>
                                                </div>
                                            );
                                        }
                                    }}
                                >
                                    {lesson?.content || "No content generated for this lesson."}
                                </ReactMarkdown>
                            </article>

                            <footer className="mt-20 pt-12 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="text-center sm:text-left">
                                    <p className="text-sm text-neutral-500 mb-1">Current Progress</p>
                                    <p className="text-white font-bold flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-emerald-500" /> Concept Mastered
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <Button
                                        variant="secondary"
                                        className="w-full sm:w-auto min-w-[140px]"
                                        leftIcon={<ChevronLeft size={18} />}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="w-full sm:w-auto min-w-[140px]"
                                        rightIcon={<ChevronRight size={18} />}
                                        onClick={() => navigate(`/track/enroll/${trackId}`)}
                                    >
                                        Back to Track
                                    </Button>
                                </div>
                            </footer>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Injected CSS for the study content */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .study-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 2rem; }
                .study-content li { margin-bottom: 0.75rem; color: #a3a3a3; }
                .study-content strong { color: #fff; font-weight: 700; }
                .study-content blockquote { border-left: 4px solid #6366f1; padding: 1.5rem 2rem; font-style: italic; color: #a5b4fc; margin: 2.5rem 0; background: rgba(99, 102, 241, 0.05); border-radius: 0 1rem 1rem 0; }
                .mermaid-render svg { max-width: 100%; height: auto; transition: transform 0.3s ease; }
                .mermaid-render svg:hover { transform: scale(1.02); }

                /* Premium Table Styling */
                .study-content table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 2.5rem 0; border: 1px solid #262626; border-radius: 1.25rem; overflow: hidden; background: rgba(23, 23, 23, 0.4); }
                .study-content th { background: rgba(38, 38, 38, 0.8); color: #fff; font-weight: 700; text-align: left; padding: 1.25rem 1.5rem; border-bottom: 1px solid #262626; font-size: 0.85rem; text-transform: uppercase; tracking: 0.1em; }
                .study-content td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #171717; color: #a3a3a3; font-size: 0.95rem; }
                .study-content tr:last-child td { border-bottom: none; }
                .study-content tr:nth-child(even) { background: rgba(255, 255, 255, 0.02); }
                .study-content tr:hover td { color: #fff; background: rgba(99, 102, 241, 0.03); transition: all 0.2s ease; }
            `}} />
        </div>
    );
}
