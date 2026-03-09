import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '../lib/api';
import { BookOpen, Play, ChevronRight, Lock, CheckCircle2, PlayCircle, Sparkles, Users, Phone, FileText } from 'lucide-react';
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
            <header className="border-b border-neutral-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                    <Badge variant="indigo" className="mb-4">{track.is_creator ? "Admin View / Managed Track" : "AI Optimized Curriculum"}</Badge>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{track.title}</h1>
                        {track.is_creator && <Badge variant="success">Creator</Badge>}
                    </div>
                    <p className="text-neutral-400 max-w-2xl leading-relaxed">{track.description}</p>
                </div>
                {!track.is_creator && (
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Progress</p>
                            <p className="text-white font-mono">{progress}% Complete</p>
                        </div>
                        <div className="w-[1px] h-8 bg-neutral-800 hidden sm:block mx-2" />
                        <Button variant="primary">Resume Learning</Button>
                    </div>
                )}
            </header>

            {/* Admin Management Section */}
            {track.is_creator && <AdminCandidateSection trackId={trackId!} />}

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
    const { data: candidates, isLoading } = useQuery({
        queryKey: ['candidates', trackId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/enrolled_candidates/`)).data
    });

    if (isLoading) return <div className="p-4 text-xs text-indigo-400 animate-pulse">Loading candidate roster...</div>;

    if (!candidates || candidates.length === 0) return null;

    return (
        <Card className="border-indigo-500/20 bg-indigo-500/5 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-indigo-400" /> Enrollment Roster
            </h3>
            <div className="grid gap-3">
                {candidates.map((c: any) => (
                    <div key={c.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                {c.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-none mb-1">{c.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1 font-mono text-[10px]">{c.email}</span>
                                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                                    {c.resume && (
                                        <a href={`${BASE_URL}${c.resume}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                                            <FileText size={12} /> CV
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                            <div className="text-right">
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.progress}%` }} />
                                    </div>
                                    <span className="text-sm font-mono text-white font-bold">{c.progress}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
