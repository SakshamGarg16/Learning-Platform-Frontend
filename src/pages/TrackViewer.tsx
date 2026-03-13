import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '../lib/api';
import { BookOpen, Play, ChevronRight, Lock, CheckCircle2, PlayCircle, Sparkles, Users, Phone, FileText, ArrowLeft, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export function TrackViewer() {
    const { trackId } = useParams<{ trackId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: track, isLoading } = useQuery({
        queryKey: ['track', trackId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/`)).data,
        enabled: !!trackId
    });

    const { data: roadmaps } = useQuery({
        queryKey: ['roadmaps'],
        queryFn: async () => (await api.get('/roadmaps/')).data,
    });
    const parentRoadmap = roadmaps?.find((r: any) => r.steps.some((s: any) => s.track?.id === trackId));

    const enrollMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/tracks/${trackId}/enroll/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['track', trackId] });
            queryClient.invalidateQueries({ queryKey: ['tracks'] });
        }
    });

    const handleEnroll = () => {
        enrollMutation.mutate();
    };

    const completedCount = track?.modules?.filter((m: any) => m.is_completed).length || 0;
    const totalCount = track?.modules?.length || 1;
    const progress = Math.round((completedCount / totalCount) * 100);

    if (isLoading) {
        return <div className="p-12 text-center animate-pulse text-indigo-400">Loading curriculum matrix...</div>;
    }

    if (!track) {
        return <div className="p-12 text-center text-red-400">Learning track not found or failed to load.</div>;
    }

    // If not enrolled AND not the creator, show the "Landing/Enrollment" state
    if (!track.is_enrolled && !track.is_creator) {
        return (
            <div className="max-w-4xl mx-auto space-y-12 py-8">
                <Card className="p-12 text-center border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={120} />
                    </div>

                    <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                        <Badge variant="indigo" className="mb-2">New Track Discovery</Badge>
                        <h1 className="text-4xl font-black text-white tracking-tight">{track.title}</h1>
                        <p className="text-neutral-400 text-lg leading-relaxed">{track.description}</p>

                        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="h-14 px-10 text-lg shadow-xl shadow-indigo-500/20"
                                onClick={handleEnroll}
                                isLoading={enrollMutation.isPending}
                                rightIcon={<PlayCircle size={22} />}
                            >
                                Enroll in Track
                            </Button>
                            <Button variant="secondary" size="lg" className="h-14 px-10 text-lg border-neutral-800" onClick={() => navigate('/')}>
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white px-2">Syllabus Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {track.modules?.map((mod: any, idx: number) => (
                            <div key={mod.id} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 opacity-60">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-500 border border-neutral-700">
                                        {idx + 1}
                                    </div>
                                    <h4 className="font-bold text-white uppercase tracking-wide">{mod.title}</h4>
                                </div>
                                <p className="text-xs text-neutral-500 line-clamp-2">{mod.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <header className="border-b border-neutral-800 pb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8 text-center sm:text-left">
                <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-2">
                        <Link
                            to={parentRoadmap ? `/roadmaps/${parentRoadmap.id}` : '/'}
                            className="flex items-center gap-2 text-neutral-500 hover:text-indigo-400 transition-colors font-black uppercase text-[10px] tracking-widest group"
                        >
                            {parentRoadmap ? <Compass size={18} className="group-hover:rotate-12 transition-transform" /> : <ArrowLeft size={18} />}
                            {parentRoadmap ? 'Return to Roadmap' : 'Back to Dashboard'}
                        </Link>
                        <div className="hidden sm:block w-[1px] h-4 bg-neutral-800" />
                        <Badge variant="indigo" className="px-3 py-1 uppercase tracking-widest text-[10px]">{track.is_creator ? "Admin View / Managed Track" : "AI Optimized Curriculum"}</Badge>
                    </div>
                    <div className="space-y-4 sm:space-y-2">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-3">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight italic">{track.title}</h1>
                            {track.is_creator && <Badge variant="success" className="h-6">Creator</Badge>}
                        </div>
                        <p className="text-neutral-400 max-w-2xl text-sm md:text-lg leading-relaxed mx-auto sm:mx-0">{track.description}</p>
                    </div>
                </div>
                {!track.is_creator && (
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Progress</p>
                            <p className="text-white font-mono text-xl">{progress}%</p>
                        </div>
                        <div className="w-[1px] h-12 bg-neutral-800 hidden sm:block mx-2" />
                        <Button variant="primary" size="lg" className="w-full lg:w-auto px-10 h-14 font-bold shadow-xl shadow-indigo-500/10">Resume Learning</Button>
                    </div>
                )}
            </header>

            {/* Admin Management Section */}
            {track.is_creator && !parentRoadmap && <AdminCandidateSection trackId={trackId!} />}

            <div className="space-y-12">
                {track.modules?.map((mod: any, idx: number) => (
                    <section key={mod.id} className="relative">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${mod.is_completed
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : !mod.is_unlocked
                                    ? 'bg-neutral-900 border-neutral-800 text-neutral-600'
                                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                }`}>
                                {mod.is_completed ? <CheckCircle2 size={20} /> : !mod.is_unlocked ? <Lock size={18} /> : idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className={`text-xl font-bold uppercase tracking-wide ${!mod.is_unlocked ? 'text-neutral-500' : 'text-white'}`}>
                                        {mod.title}
                                    </h2>
                                    {mod.is_remedial && <Badge variant="warning">Remedial</Badge>}
                                </div>
                                <p className="text-sm text-neutral-500">
                                    {mod.lessons?.length || 0} Lessons • {mod.assessment ? 'Assessment Included' : 'Reading Only'}
                                    {!mod.is_unlocked && <span className="text-amber-500/60 ml-2 font-mono text-[10px]">— COMPLETE PREVIOUS MODULE TO UNLOCK</span>}
                                </p>
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!mod.is_unlocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                            {mod.lessons?.map((lesson: any) => (
                                <Link
                                    key={lesson.id}
                                    to={`/track/${trackId}/lesson/${lesson.id}`}
                                    className="group flex items-center justify-between p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-indigo-500/30 hover:bg-neutral-800/50 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 rounded-lg bg-neutral-800 text-neutral-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                                            <BookOpen size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{lesson.title}</h4>
                                            <p className="text-xs text-neutral-500">Lesson {lesson.order + 1}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-neutral-600 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}

                            {mod.assessment && (
                                <Link
                                    to={`/track/${trackId}/module/${mod.id}/assessment`}
                                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all group ${mod.is_completed
                                        ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30'
                                        : 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-lg transition-all ${mod.is_completed
                                            ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'
                                            : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'
                                            }`}>
                                            {mod.is_completed ? <CheckCircle2 size={20} /> : <Play size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{mod.is_completed ? 'Assessment Passed' : 'Module Assessment'}</h4>
                                            <p className={`text-xs uppercase tracking-widest font-bold ${mod.is_completed ? 'text-emerald-400/60' : 'text-indigo-400/60'
                                                }`}>
                                                {mod.is_completed ? 'Verification Confirmed' : 'Final Evaluation'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className={mod.is_completed ? 'text-emerald-400' : 'text-indigo-400'} />
                                </Link>
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function AdminCandidateSection({ trackId }: { trackId: string }) {
    const { user } = useAuth();
    const { data: candidates, isLoading } = useQuery({
        queryKey: ['candidates', trackId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/enrolled_candidates/`)).data
    });

    if (isLoading) return <div className="p-4 text-xs text-indigo-400 animate-pulse">Loading candidate roster...</div>;

    const filteredCandidates = candidates?.filter((c: any) => c.email !== user?.email);

    if (!filteredCandidates || filteredCandidates.length === 0) return null;

    return (
        <Card className="border-indigo-500/20 bg-indigo-500/5 mb-8 p-6 md:p-10">
            <h3 className="text-xl font-black text-white mb-8 flex items-center justify-center sm:justify-start gap-3 italic uppercase tracking-tighter">
                <Users size={24} className="text-indigo-400" /> Enrollment Roster
            </h3>
            <div className="grid gap-6">
                {filteredCandidates.map((c: any) => (
                    <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-indigo-500/20 transition-all gap-6">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20 shadow-lg shrink-0">
                                {c.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-lg text-white leading-none mb-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{c.name}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                                    <span className="font-mono text-[10px] break-all">{c.email}</span>
                                    {c.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {c.phone}</span>}
                                    {c.resume && (
                                        <a href={`${BASE_URL}${c.resume}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold">
                                            <FileText size={12} /> CV
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t border-neutral-800 sm:border-0">
                            <div className="flex-1 sm:text-right space-y-2">
                                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Mastery Level</div>
                                <div className="flex items-center gap-3">
                                    <div className="w-full sm:w-32 h-2 bg-neutral-800/80 rounded-full overflow-hidden shadow-inner flex-1">
                                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${c.progress}%` }} />
                                    </div>
                                    <span className="text-base font-mono text-white font-black tabular-nums">{c.progress}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
