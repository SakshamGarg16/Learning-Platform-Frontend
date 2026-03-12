import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
    Compass, 
    Plus, 
    Check, 
    Lock, 
    Zap,
    RefreshCcw,
    Edit2,
    Trash2,
    GripVertical,
    X,
    Sparkles,
    CheckCircle2,
    Share2,
    ExternalLink,
    Loader2,
    ArrowLeft,
    Clock,
    Target
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoadmapStep {
    id: string;
    title: string;
    description: string;
    order: number;
    track: any;
    is_unlocked: boolean;
    is_completed: boolean;
}

interface Roadmap {
    id: string;
    title: string;
    description: string;
    created_at: string;
    steps: RoadmapStep[];
    is_enrolled: boolean;
    is_finalized: boolean;
}

export function RoadmapExplorer() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { id, shareRoadmapId } = useParams();
    const activeRoadmapId = id || shareRoadmapId;

    const [goal, setGoal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [localSteps, setLocalSteps] = useState<RoadmapStep[]>([]);
    const [isAddingStep, setIsAddingStep] = useState(false);
    const [addMethod, setAddMethod] = useState<'manual' | 'ai'>('manual');
    const [aiInstruction, setAiInstruction] = useState('');
    const [shareUrl, setShareUrl] = useState<string | null>(null);

    const isAdmin = user?.role === 'admin';

    const { data: roadmaps, isLoading: roadmapsLoading } = useQuery({
        queryKey: ['roadmaps'],
        queryFn: async () => (await api.get('/roadmaps/')).data as Roadmap[],
        enabled: !activeRoadmapId // Only fetch full list if not viewing a specific one
    });

    const { data: activeRoadmapDetail, isLoading: detailLoading } = useQuery({
        queryKey: ['roadmap', activeRoadmapId],
        queryFn: async () => (await api.get(`/roadmaps/${activeRoadmapId}/`)).data as Roadmap,
        enabled: !!activeRoadmapId
    });

    const activeRoadmap = activeRoadmapId ? activeRoadmapDetail : (roadmaps?.find(r => r.id === activeRoadmapId));

    useEffect(() => {
        if (activeRoadmap) {
            setLocalSteps([...activeRoadmap.steps].sort((a, b) => a.order - b.order));
        }
    }, [activeRoadmap]);

    // Polling effect for processing roadmaps
    useEffect(() => {
        let interval: any;
        const processingSteps = activeRoadmap?.is_finalized && activeRoadmap?.steps.some(s => !s.track);
        if (processingSteps && !isEditing) {
            interval = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
                queryClient.invalidateQueries({ queryKey: ['roadmap', activeRoadmapId] });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [activeRoadmap, isEditing]);

    // Mutations
    const generateMutation = useMutation({
        mutationFn: async (goal: string) => {
            setIsGenerating(true);
            const res = await api.post('/roadmaps/generate/', { goal });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
            setIsGenerating(false);
            setGoal('');
            navigate(`/roadmaps/${data.id}`);
        }
    });

    const finalizeAllMutation = useMutation({
        mutationFn: async (roadmapId: string) => (await api.post(`/roadmaps/${roadmapId}/finalize_all/`)).data,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
            queryClient.invalidateQueries({ queryKey: ['roadmap', activeRoadmapId] });
            if (data.share_url) {
                setShareUrl(`${window.location.origin}${data.share_url}`);
            }
        }
    });

    const handleReorder = (newSteps: RoadmapStep[]) => {
        setLocalSteps(newSteps);
        api.post(`/roadmaps/${activeRoadmap?.id}/reorder_steps/`, { step_ids: newSteps.map(s => s.id) })
           .then(() => queryClient.invalidateQueries({ queryKey: ['roadmaps'] }));
    };

    const addStepMutation = useMutation({
        mutationFn: async (data: { title: string, description: string }) => {
            return (await api.post(`/roadmaps/${activeRoadmap?.id}/add_step/`, data)).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
            setIsAddingStep(false);
        }
    });

    const aiAddStepMutation = useMutation({
        mutationFn: async (instruction: string) => {
            return (await api.post(`/roadmaps/${activeRoadmap?.id}/ai_add_step/`, { instruction })).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
            setIsAddingStep(false);
            setAiInstruction('');
        }
    });

    const enrollMutation = useMutation({
        mutationFn: async (roadmapId: string) => (await api.post(`/roadmaps/${roadmapId}/enroll/`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
            queryClient.invalidateQueries({ queryKey: ['roadmap', activeRoadmapId] });
        }
    });

    if (roadmapsLoading || detailLoading) return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCcw className="animate-spin text-indigo-500" size={32} /></div>;

    if (!activeRoadmapId) {
        return (
            <div className="max-w-6xl mx-auto space-y-16 pb-24 px-4 pt-10">
                <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <Badge variant="indigo" className="px-5 py-2 uppercase tracking-[0.4em] text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.3)]">Strategic Command</Badge>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-[0.8] mb-2">Strategic <span className="text-indigo-500">Fleet</span></h1>
                        <p className="text-neutral-500 text-lg font-medium italic opacity-80">Architect and deploy high-stakes career trajectories.</p>
                    </div>

                    {isAdmin && (
                        <div className="bg-neutral-900/40 p-2 rounded-[2rem] border border-white/5 backdrop-blur-xl shadow-2xl flex-1 max-w-2xl">
                            <form onSubmit={(e) => { e.preventDefault(); if (goal.trim()) generateMutation.mutate(goal); }} className="flex items-center">
                                <Input 
                                    placeholder="Enter Mission Goal (e.g. Lead Engineer)..." 
                                    value={goal} 
                                    onChange={(e) => setGoal(e.target.value)} 
                                    className="flex-1 h-14 bg-transparent border-none focus:ring-0 font-bold text-lg px-6 placeholder:text-neutral-700" 
                                />
                                <Button type="submit" isLoading={isGenerating} disabled={!goal.trim()} className="h-14 px-8 bg-indigo-600 font-black rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:scale-105 transition-all uppercase tracking-widest text-[10px] italic flex-shrink-0">
                                    <Target size={18} className="mr-2" />
                                    Launch
                                </Button>
                            </form>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {roadmaps?.map((r) => (
                        <Card 
                            key={r.id} 
                            onClick={() => navigate(`/roadmaps/${r.id}`)}
                            className="p-10 border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 transition-all duration-700 cursor-pointer group rounded-[3.5rem] relative overflow-hidden flex flex-col justify-between h-[420px] hover:border-indigo-500/30 hover:shadow-[0_40px_80px_-20px_rgba(99,102,241,0.15)]"
                        >
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className={`p-6 rounded-3xl transition-all duration-700 ${isAdmin ? 'bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'bg-neutral-800 text-neutral-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                                        <Compass size={40} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex gap-2">
                                        {r.is_finalized ? (
                                            <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1 font-black text-[10px] tracking-widest uppercase">Operational</Badge>
                                        ) : (
                                            <Badge variant="neutral" className="bg-neutral-800 text-neutral-500 border-neutral-700 px-4 py-1 font-black text-[10px] tracking-widest uppercase">Drafting</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight group-hover:text-indigo-400 transition-colors">{r.title}</h3>
                                    <p className="text-neutral-500 text-sm leading-relaxed font-medium italic opacity-70 line-clamp-2">{r.description}</p>
                                </div>
                            </div>

                            <div className="relative z-10 pt-8 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-6 text-neutral-500">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{r.steps.length} Phases</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-neutral-800 text-neutral-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 transform group-hover:translate-x-2">
                                    <ArrowLeft size={24} className="rotate-180" />
                                </div>
                            </div>

                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-1000" />
                        </Card>
                    ))}
                </div>

                {roadmaps?.length === 0 && (
                    <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-8 bg-neutral-900/20 rounded-[4rem] border-2 border-dashed border-neutral-800">
                        <Compass size={64} className="text-neutral-800 animate-pulse" />
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter opacity-30">No active trajectories</h2>
                            <p className="text-neutral-600 font-medium italic text-lg">Initiate a mission goal to architect your first roadmap.</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (!activeRoadmap) {
        return (
            <div className="max-w-6xl mx-auto py-24 text-center space-y-8 animate-in fade-in duration-1000">
                <div className="w-24 h-24 bg-neutral-900 rounded-[2rem] border-2 border-dashed border-neutral-800 flex items-center justify-center mx-auto mb-8">
                    <Compass size={48} className="text-neutral-800" />
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Trajectory Offline</h2>
                <p className="text-neutral-600 text-lg">The specified mission coordinates are invalid or declassified.</p>
                <Button onClick={() => navigate('/roadmaps')} className="px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-indigo-600">
                    <ArrowLeft className="mr-3" size={18} /> Emergency Extraction
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 pt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <header className="flex items-center gap-6 mb-8 group">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/roadmaps')} 
                    className="p-4 bg-neutral-900 border border-neutral-800 rounded-3xl hover:bg-neutral-800 transition-all group-hover:-translate-x-2"
                >
                    <ArrowLeft size={24} className="text-neutral-400" />
                </Button>
                <div>
                    <Badge variant="indigo" className="mb-2">Operational Command</Badge>
                    <div className="flex items-center gap-3">
                        <span className="text-neutral-500 font-black tracking-widest text-xs uppercase uppercase italic">Back to Fleet Registry</span>
                    </div>
                </div>
            </header>

            <motion.div key={activeRoadmap.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "circOut" }} className="space-y-12">
                <Card className="p-8 md:p-14 border-neutral-800 bg-neutral-900/40 backdrop-blur-3xl relative overflow-hidden group rounded-[3rem]">
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-12">
                        <div className="space-y-8 flex-1">
                            <div className="flex flex-wrap items-center gap-6">
                                <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">{activeRoadmap.title}</h2>
                                {activeRoadmap.is_finalized && activeRoadmap.steps.some(s => !s.track) && (
                                    <Badge variant="indigo" className="animate-pulse bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-4 py-1.5 rounded-xl font-black tracking-[0.2em] text-[10px]">Architecting Sector...</Badge>
                                )}
                                {activeRoadmap.is_enrolled && activeRoadmap.is_finalized && (
                                    <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1.5 rounded-xl font-black tracking-[0.2em] text-[10px]">Personalizing Modules...</Badge>
                                )}
                                {!activeRoadmap.is_finalized && <Badge variant="neutral" className="bg-neutral-800 text-neutral-400 border-neutral-700 px-4 py-1.5 rounded-xl font-black tracking-[0.2em] text-[10px]">Design Protocol</Badge>}
                            </div>
                            <p className="text-neutral-400 text-lg leading-relaxed max-w-3xl font-medium italic opacity-80 border-l-4 border-indigo-500/40 pl-8">{activeRoadmap.description}</p>
                        </div>
                        <div className="flex flex-col gap-6 min-w-[280px]">
                            {isAdmin && (
                                <div className="bg-neutral-950/50 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl space-y-6 shadow-2xl relative">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600 text-center mb-4 italic">Mission Ops</h5>
                                    
                                    {!activeRoadmap.is_finalized ? (
                                        <div className="space-y-4">
                                            <Button variant={isEditing ? 'primary' : 'secondary'} onClick={() => setIsEditing(!isEditing)} className="w-full font-black uppercase text-xs tracking-[0.2em] h-16 rounded-[1.5rem] shadow-xl border-white/5 transition-all active:scale-95">
                                                {isEditing ? <CheckCircle2 className="mr-3" size={20} /> : <Edit2 className="mr-3" size={20} />}
                                                {isEditing ? 'Save Design' : 'Refine Specs'}
                                            </Button>
                                            <Button variant="secondary" onClick={() => finalizeAllMutation.mutate(activeRoadmap.id)} isLoading={finalizeAllMutation.isPending} className="w-full bg-emerald-600/10 border-emerald-500/40 text-emerald-400 font-extrabold uppercase text-xs h-16 rounded-[1.5rem] hover:bg-emerald-600 hover:text-white group transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                                <Zap size={20} className="mr-3 group-hover:scale-125 transition-transform" /> Global Finalize
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl">
                                                {activeRoadmap.steps.some(s => !s.track) ? (
                                                    <div className="flex items-center">
                                                        <Loader2 className="animate-spin text-indigo-500 mr-4" size={20} />
                                                        <span className="text-xs font-black uppercase tracking-widest text-indigo-400 italic">Deploying Payload...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-emerald-400">
                                                        <Check className="mr-4" size={20} />
                                                        <span className="text-xs font-black uppercase tracking-widest italic">Fleet Online</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {shareUrl ? (
                                                <div className="space-y-4 animate-in fade-in zoom-in duration-700">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="bg-neutral-900 rounded-2xl px-6 py-4 border border-emerald-500/30 text-emerald-400 text-xs font-mono break-all leading-relaxed shadow-inner font-bold">{shareUrl}</div>
                                                        <Button size="lg" onClick={() => { navigator.clipboard.writeText(shareUrl); alert('URL Copied to clipboard'); }} className="bg-emerald-600 w-full h-14 rounded-2xl shadow-xl hover:scale-105 transition-all text-sm uppercase font-black tracking-widest border-none"><Check size={20} className="mr-2" /> Copied Command</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button variant="outline" onClick={() => setShareUrl(`${window.location.origin}/roadmaps/share/${activeRoadmap.id}`)} className="w-full h-16 rounded-[1.5rem] border-white/10 text-neutral-400 uppercase font-black text-[10px] tracking-widest hover:text-white hover:bg-white/5 transition-all shadow-xl">
                                                    <Share2 size={18} className="mr-3" /> Get Share Link
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            {!activeRoadmap.is_enrolled && !isAdmin && activeRoadmap.is_finalized && (
                                <Button onClick={() => enrollMutation.mutate(activeRoadmap.id)} isLoading={enrollMutation.isPending} className="bg-indigo-600 h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.3em] shadow-[0_20px_40px_rgba(99,102,241,0.4)] hover:scale-[1.05] active:scale-95 transition-all italic border-none group">
                                    <Zap size={24} className="mr-3 fill-white group-hover:animate-bounce" /> Begin Mission
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-indigo-500/5 blur-[160px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-1000" />
                </Card>

                <div className="space-y-12">
                    <div className="flex items-center gap-8 px-10 opacity-30">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-neutral-700" />
                        <span className="text-xs font-black text-neutral-500 uppercase tracking-[1em] italic">Strategic Flow</span>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-neutral-700" />
                    </div>

                    {isEditing ? (
                        <div className="space-y-8">
                            <Reorder.Group axis="y" values={localSteps} onReorder={handleReorder} className="space-y-6">
                                {localSteps.map((step) => (
                                    <Reorder.Item key={step.id} value={step}>
                                        <StepEditCard 
                                            step={step} 
                                            onUpdate={(data: any) => api.patch(`/roadmap-steps/${step.id}/`, data).then(() => queryClient.invalidateQueries({ queryKey: ['roadmaps'] }))}
                                            onDelete={() => api.post(`/roadmaps/${activeRoadmap?.id}/delete_step/`, { step_id: step.id }).then(() => queryClient.invalidateQueries({ queryKey: ['roadmaps'] }))}
                                        />
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>

                            {isAddingStep ? (
                                <Card className="p-14 border-indigo-500/40 bg-indigo-500/10 relative overflow-hidden rounded-[3.5rem] shadow-2xl animate-in zoom-in-95 duration-500">
                                    <div className="flex gap-12 mb-10 border-b border-indigo-500/20 pb-6">
                                        <button onClick={() => setAddMethod('manual')} className={`text-sm font-black uppercase tracking-widest pb-4 transition-all ${addMethod === 'manual' ? 'text-indigo-400 border-b-4 border-indigo-500' : 'text-neutral-600'}`}>Standard Entry</button>
                                        <button onClick={() => setAddMethod('ai')} className={`text-sm font-black uppercase tracking-widest pb-4 transition-all flex items-center gap-3 ${addMethod === 'ai' ? 'text-indigo-400 border-b-4 border-indigo-500' : 'text-neutral-600'}`}><Sparkles size={18} /> AI Intel Insertion</button>
                                    </div>

                                    {addMethod === 'manual' ? (
                                        <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); addStepMutation.mutate({ title: fd.get('title') as string, description: fd.get('description') as string }); }} className="space-y-8">
                                            <Input name="title" label="Operational Title" className="bg-neutral-950 border-neutral-800 h-16 text-xl" required />
                                            <Input name="description" label="Technical Scope" className="bg-neutral-950 border-neutral-800 h-16 text-xl" required />
                                            <div className="flex gap-4 pt-6">
                                                <Button type="submit" isLoading={addStepMutation.isPending} className="flex-1 h-16 rounded-2xl font-black uppercase text-xs tracking-[0.2em] bg-indigo-600 shadow-xl">Deploy Phase</Button>
                                                <Button variant="ghost" onClick={() => setIsAddingStep(false)} className="h-16 w-16 p-0 bg-neutral-900 border border-neutral-800 rounded-2xl"><X size={32} className="text-neutral-500" /></Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-8">
                                            <p className="text-lg text-neutral-400 font-medium italic opacity-80">Instruct the Core AI to architect a new sector within this mission.</p>
                                            <Input label="Strategic Instruction" placeholder="e.g. Add a rigorous phase on distributed systems security..." value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} className="bg-neutral-950 border-neutral-800 h-16 text-xl" />
                                            <div className="flex gap-4 pt-6">
                                                <Button onClick={() => aiAddStepMutation.mutate(aiInstruction)} isLoading={aiAddStepMutation.isPending} disabled={!aiInstruction.trim()} className="flex-1 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-500/30"><Sparkles className="mr-3" size={24} /> Generate via Core AI</Button>
                                                <Button variant="ghost" onClick={() => setIsAddingStep(false)} className="h-16 w-16 p-0 bg-neutral-900 border border-neutral-800 rounded-2xl"><X size={32} className="text-neutral-500" /></Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ) : (
                                <Button variant="secondary" onClick={() => setIsAddingStep(true)} className="w-full py-16 border-dashed border-4 border-neutral-800 hover:border-indigo-500/50 text-neutral-700 hover:text-indigo-400 font-black uppercase tracking-[0.6em] text-xs rounded-[3.5rem] transition-all duration-700 bg-neutral-950/20 hover:bg-indigo-500/5 group">
                                    <Plus className="mr-4 group-hover:rotate-90 transition-transform duration-500" size={32} /> Augment Operational Sequence
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 relative">
                            <div className="absolute left-[59px] top-20 bottom-20 w-[3px] bg-gradient-to-b from-indigo-500/60 via-neutral-800/20 to-transparent hidden md:block" />
                            {localSteps.map((step, idx) => (
                                <div key={step.id} className="relative group/step">
                                    <div className="flex flex-col md:flex-row gap-12">
                                        <div className="flex-shrink-0 hidden md:block relative z-10 transition-transform duration-700 group-hover/step:translate-x-2">
                                            <div className={`w-20 h-20 rounded-[1.5rem] border-[2px] flex items-center justify-center transition-all duration-1000 ${step.is_completed ? 'bg-emerald-500 border-emerald-300 text-white shadow-[0_15px_30px_rgba(16,185,129,0.3)]' : step.is_unlocked ? 'bg-neutral-950 border-indigo-500 text-indigo-400 shadow-[0_10px_20px_rgba(99,102,241,0.2)]' : 'bg-neutral-900 border-neutral-800 text-neutral-700 opacity-60'}`}>
                                                {step.is_completed ? <Check size={32} strokeWidth={4} /> : <span className="text-3xl font-black italic">{idx + 1}</span>}
                                            </div>
                                        </div>
                                        <Card className={`flex-1 p-8 md:p-10 border-neutral-800 transition-all duration-1000 relative overflow-hidden rounded-[2.5rem] ${!step.is_unlocked && !isAdmin ? 'bg-neutral-900/10 grayscale opacity-40' : 'bg-neutral-900/60 hover:bg-neutral-900 shadow-3xl hover:shadow-indigo-500/10'}`}>
                                            {!step.is_unlocked && !isAdmin && activeRoadmap.is_finalized && <div className="absolute top-6 right-8 text-neutral-700 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 italic"><Lock size={14} /> Sector Fixed</div>}
                                            <div className="flex flex-col xl:flex-row justify-between gap-8 pt-2">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <h5 className={`text-xl md:text-2xl font-black tracking-tight uppercase italic ${step.is_unlocked || isAdmin ? 'text-white' : 'text-neutral-800'}`}>{step.title}</h5>
                                                        {step.is_completed && <Badge variant="success" className="text-[9px] uppercase font-black px-3 py-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 tracking-widest">Mastered</Badge>}
                                                    </div>
                                                    <p className={`text-base md:text-lg leading-relaxed max-w-3xl font-medium italic ${step.is_unlocked || isAdmin ? 'text-neutral-400' : 'text-neutral-800 opacity-30'}`}>{step.description}</p>
                                                </div>
                                                <div className="flex items-center gap-4 self-start xl:self-center">
                                                    {step.track ? (
                                                        <Button 
                                                            disabled={!step.is_unlocked && !isAdmin} 
                                                            onClick={() => navigate(`/track/enroll/${step.track.id}`)} 
                                                            variant={step.is_completed ? "secondary" : "primary"} 
                                                            className="rounded-xl px-8 h-12 font-black text-[10px] tracking-[0.3em] uppercase italic shadow-lg group/btn hover:scale-105 active:scale-95 transition-all border-none bg-indigo-600 hover:bg-indigo-500 text-white"
                                                        >
                                                            {step.is_completed ? "Review Assets" : (step.is_unlocked || isAdmin) ? <>Engage Milestone <ExternalLink className="ml-2 group-hover/btn:translate-x-1 transition-transform" size={14} /></> : "Sector Locked"}
                                                        </Button>
                                                    ) : (isAdmin && activeRoadmap.is_finalized) ? (
                                                        <div className="p-5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/30">
                                                            <Zap size={24} className="animate-pulse" />
                                                        </div>
                                                    ) : (
                                                        <Badge variant="neutral" className="border-neutral-800 text-neutral-700 text-[10px] font-black uppercase tracking-[0.3em] px-6 py-3 rounded-xl bg-neutral-950/40 italic">Drafting Protocol...</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function StepEditCard({ step, onUpdate, onDelete }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(step.title);
    const [description, setDescription] = useState(step.description);

    return (
        <Card className="p-8 border-neutral-800 bg-neutral-900/40 group hover:border-indigo-500/30 hover:bg-neutral-900 transition-all flex items-start gap-8 relative overflow-hidden rounded-[2.5rem] shadow-xl">
            <div className="cursor-grab active:cursor-grabbing text-neutral-800 group-hover:text-indigo-500 transition-colors pt-4"><GripVertical size={24} /></div>
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="space-y-6">
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} label="Operational Title" className="bg-neutral-950 text-lg h-14" />
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} label="Milestone Scope" className="bg-neutral-950 text-lg h-14" />
                        <div className="flex gap-3">
                            <Button size="sm" onClick={() => { onUpdate({ title, description }); setIsEditing(false); }} className="bg-indigo-600 px-8 font-black tracking-[0.2em] text-[10px] uppercase h-12 rounded-xl">Commit Delta</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setTitle(step.title); setDescription(step.description); setIsEditing(false); }} className="text-neutral-600 uppercase font-black text-[10px] tracking-widest h-12 px-6 hover:bg-neutral-800 transition-all">Abort</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-4">
                            <h4 className="font-black text-2xl text-white uppercase italic tracking-tighter">{step.title}</h4>
                            {step.track && <Badge variant="neutral" className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-black tracking-[0.2em] px-4 py-1 rounded-lg">FIXED SECTOR</Badge>}
                        </div>
                        <p className="text-lg text-neutral-500 leading-relaxed max-w-5xl font-medium italic opacity-80">{step.description}</p>
                    </div>
                )}
            </div>
            {!isEditing && (
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                    <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)} className="w-10 h-10 p-0 rounded-xl bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center"><Edit2 size={16} /></Button>
                    <Button size="sm" variant="secondary" onClick={onDelete} className="w-10 h-10 p-0 rounded-xl bg-neutral-800 border-neutral-700 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-all shadow-xl flex items-center justify-center" disabled={!!step.track}><Trash2 size={16} /></Button>
                </div>
            )}
        </Card>
    );
}
