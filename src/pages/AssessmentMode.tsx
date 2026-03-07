import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
    ShieldCheck,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    HelpCircle,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Monitor, Sparkles as SparklesIcon } from 'lucide-react';

export function AssessmentMode() {
    const { trackId, moduleId } = useParams<{ trackId: string; moduleId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentStep, setCurrentStep] = useState<'intro' | 'quiz' | 'result'>('intro');
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [result, setResult] = useState<any>(null);

    // 1. Fetch Module & Assessment Data
    const { data: module, isLoading: isLoadingModule } = useQuery({
        queryKey: ['module', moduleId],
        queryFn: async () => (await api.get(`/modules/${moduleId}/`)).data,
        enabled: !!moduleId
    });

    const assessment = module?.assessment;

    // 2. Questions Generation Mutation (if not present)
    const generateQuestionsMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/assessments/${assessment.id}/generate_questions/`);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['module', moduleId], (old: any) => ({
                ...old,
                assessment: data
            }));
        }
    });

    // 3. Submit Attempt Mutation
    const submitAttemptMutation = useMutation({
        mutationFn: async (payload: { answers: any, learner_id?: string }) => {
            const res = await api.post(`/assessments/${assessment.id}/submit_attempt/`, payload);
            return res.data;
        },
        onSuccess: (data) => {
            setResult(data);
            setCurrentStep('result');
        }
    });

    // Auto-generate questions if empty
    useEffect(() => {
        if (assessment && (!assessment.questions_data || assessment.questions_data.length === 0) && !generateQuestionsMutation.isPending) {
            generateQuestionsMutation.mutate();
        }
    }, [assessment, generateQuestionsMutation]);

    if (isLoadingModule) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-neutral-500 font-mono text-sm animate-pulse">Initializing Assessment...</p>
            </div>
        );
    }

    const handleOptionSelect = (qIdx: number, oIdx: number, type: string) => {
        if (type === 'multi_select') {
            const current = (answers[qIdx] as number[]) || [];
            const next = current.includes(oIdx)
                ? current.filter(i => i !== oIdx)
                : [...current, oIdx];
            setAnswers({ ...answers, [qIdx]: next });
        } else {
            setAnswers({ ...answers, [qIdx]: oIdx });
        }
    };

    const handleSubmit = () => {
        submitAttemptMutation.mutate({ answers });
    };

    const questions = assessment?.questions_data || [];
    const isReady = questions.length > 0;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
            <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/track/enroll/${trackId}`)}
                        leftIcon={<ArrowLeft size={18} />}
                    >
                        Exit
                    </Button>
                    <div className="h-6 w-[1px] bg-neutral-800 mx-2" />
                    <h1 className="text-sm font-semibold text-white truncate max-w-[300px]">
                        Assessment: {module?.title}
                    </h1>
                </div>
                <Badge variant="indigo" className="flex gap-2 items-center">
                    <ShieldCheck size={14} /> Verification Mode
                </Badge>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
                <AnimatePresence mode="wait">
                    {currentStep === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="text-center space-y-8 py-12"
                        >
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 border border-indigo-500/20">
                                <ShieldCheck className="text-indigo-400 w-10 h-10" />
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-extrabold tracking-tight text-white">Polymorphic Integrity Check</h1>
                                <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
                                    The AI has designed a custom challenge for **{module?.title}** with varying question types.
                                </p>
                            </div>

                            <Card className="bg-neutral-900/50 border-neutral-800 p-6 flex flex-col sm:flex-row gap-6 items-center justify-around max-w-xl mx-auto">
                                <div className="text-center">
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Complexity</p>
                                    <p className="text-2xl font-bold text-white tracking-widest">{isReady ? questions.length : '--'} Units</p>
                                </div>
                                <div className="h-8 w-px bg-neutral-800 hidden sm:block" />
                                <div className="text-center">
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Threshold</p>
                                    <p className="text-2xl font-bold text-emerald-400 tracking-widest">70%</p>
                                </div>
                                <div className="h-8 w-px bg-neutral-800 hidden sm:block" />
                                <div className="text-center">
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-1">Mode</p>
                                    <p className="text-2xl font-bold text-indigo-400 tracking-widest">Mixed</p>
                                </div>
                            </Card>

                            <div className="pt-8">
                                <Button
                                    className="w-full max-w-xs h-14 text-lg"
                                    disabled={!isReady}
                                    onClick={() => setCurrentStep('quiz')}
                                    isLoading={generateQuestionsMutation.isPending}
                                >
                                    {isReady ? "Begin Dynamic Assessment" : "Synthesizing Matrix..."}
                                </Button>
                                <p className="text-xs text-neutral-500 mt-4">No two assessments are ever the same.</p>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'quiz' && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-bold">
                                        Q
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Dynamic technical Review</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-neutral-500 uppercase tracking-widest">Status</p>
                                    <p className="text-sm font-mono text-white">
                                        {Object.keys(answers).length} / {questions.length} Units Filled
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-12 pb-20">
                                {questions.map((q: any, qIdx: number) => (
                                    <div key={qIdx} className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex gap-4">
                                                <span className="text-indigo-500 font-mono font-bold">{qIdx + 1}.</span>
                                                <div className="text-lg font-medium text-white leading-relaxed flex-1 prose prose-invert prose-indigo max-w-none question-markdown">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({ node, ...props }) => <span {...props} />,
                                                            code: ({ node, inline, className, children, ...props }: any) => {
                                                                const match = /language-(\w+)/.exec(className || '');
                                                                const content = String(children).trim();
                                                                const hasNewline = content.includes('\n');
                                                                // Heuristic: If it's short and has no newlines, treat as inline badge
                                                                const isSimple = !hasNewline && content.length < 60;

                                                                if (inline || isSimple) {
                                                                    return <code className="bg-neutral-800 text-indigo-400 px-1.5 py-0.5 rounded-md font-mono text-[0.9em] border border-neutral-700/50 mx-0.5" {...props}>{children}</code>;
                                                                }

                                                                return (
                                                                    <div className="my-4 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/50 group shadow-lg">
                                                                        <div className="px-3 py-1.5 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm flex justify-between items-center text-[10px] opacity-60">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <div className="w-1 h-1 rounded-full bg-red-500/30" />
                                                                                <div className="w-1 h-1 rounded-full bg-amber-500/30" />
                                                                                <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
                                                                                <span className="font-bold text-neutral-400 uppercase tracking-widest ml-1">
                                                                                    {match ? match[1] : 'Source'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <pre className="p-4 overflow-x-auto text-[0.85em] font-mono text-indigo-50 leading-relaxed" {...props}>
                                                                            {children}
                                                                        </pre>
                                                                    </div>
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {q.question}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="ml-8">
                                                <Badge variant="neutral" className="text-[10px] uppercase tracking-tighter py-0 px-2 opacity-60">
                                                    {q.type === 'multi_select' ? 'Select all that apply' : q.type === 'boolean' ? 'True / False' : 'Single Choice'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 ml-8">
                                            {q.options.map((option: string, oIdx: number) => {
                                                const isSelected = q.type === 'multi_select'
                                                    ? (answers[qIdx] as number[])?.includes(oIdx)
                                                    : answers[qIdx] === oIdx;

                                                return (
                                                    <button
                                                        key={oIdx}
                                                        onClick={() => handleOptionSelect(qIdx, oIdx, q.type)}
                                                        className={`p-4 rounded-2xl text-left transition-all border flex items-center justify-between group ${isSelected
                                                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                                            : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500'
                                                            }`}
                                                    >
                                                        <span>{option}</span>
                                                        {q.type === 'multi_select' && (
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-neutral-700'
                                                                }`}>
                                                                {isSelected && <ArrowRight size={12} className="text-white rotate-[-45deg]" />}
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="fixed bottom-0 left-0 right-0 p-6 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800 z-50">
                                <div className="max-w-3xl mx-auto flex justify-end">
                                    <Button
                                        className="w-full sm:w-auto min-w-[200px] h-12"
                                        disabled={Object.keys(answers).length < questions.length}
                                        onClick={handleSubmit}
                                        isLoading={submitAttemptMutation.isPending}
                                        rightIcon={<ArrowRight size={18} />}
                                    >
                                        Finalize Submission
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 'result' && result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-10 py-12"
                        >
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 ${result.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                {result.passed ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-4xl font-extrabold text-white">
                                    {result.passed ? 'Assessment Validated' : 'Deficit Detected'}
                                </h1>
                                <p className="text-neutral-400 max-w-md mx-auto">
                                    You achieved a technical precision score of:
                                </p>
                            </div>

                            <div className="flex justify-center items-end gap-2">
                                <span className={`text-7xl font-black ${result.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {Number(result.score).toFixed(1)}%
                                </span>
                                <span className="text-2xl text-neutral-500 font-bold mb-2">/ 100</span>
                            </div>

                            {result.ai_feedback && (
                                <Card className="bg-neutral-900/50 border-neutral-800 text-left p-8 max-w-2xl mx-auto space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest">
                                        <HelpCircle size={16} /> AI Performance Analysis
                                    </div>
                                    <div className="text-neutral-300 leading-relaxed prose prose-invert prose-sm">
                                        {result.ai_feedback}
                                    </div>
                                    {!result.passed && result.remedial_module_generated && (
                                        <div className="pt-4 border-t border-neutral-800 mt-4 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20">
                                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Remedial Sequence Active</p>
                                            <p className="text-sm text-neutral-200 font-medium">
                                                A targeted recovery module has been added to your track to address these knowledge gaps.
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            )}

                            <div className="pt-8">
                                <Button
                                    variant="primary"
                                    className="w-full max-w-xs"
                                    onClick={() => navigate(`/track/enroll/${trackId}`)}
                                >
                                    {result.passed ? "Return to Fleet Progress" : "Initiate Recovery Flow"}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .question-markdown p { display: inline; }
                .question-markdown code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
                .question-markdown pre { margin: 1rem 0; }
                .question-markdown strong { color: #fff; font-weight: 700; }
            `}} />
        </div>
    );
}
