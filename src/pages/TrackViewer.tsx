import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { BookOpen, Play, ChevronRight, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function TrackViewer() {
    const { trackId } = useParams<{ trackId: string }>();

    const { data: track, isLoading } = useQuery({
        queryKey: ['track', trackId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/`)).data,
        enabled: !!trackId
    });

    const completedCount = track?.modules?.filter((m: any) => m.is_completed).length || 0;
    const totalCount = track?.modules?.length || 1;
    const progress = Math.round((completedCount / totalCount) * 100);

    if (isLoading) {
        return <div className="p-12 text-center animate-pulse text-indigo-400">Loading curriculum matrix...</div>;
    }

    if (!track) {
        return <div className="p-12 text-center text-red-400">Learning track not found or failed to load.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="border-b border-neutral-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                    <Badge variant="indigo" className="mb-4">AI Optimized Curriculum</Badge>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{track.title}</h1>
                    <p className="text-neutral-400 max-w-2xl leading-relaxed">{track.description}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Progress</p>
                        <p className="text-white font-mono">{progress}% Complete</p>
                    </div>
                    <div className="w-[1px] h-8 bg-neutral-800 hidden sm:block mx-2" />
                    <Button variant="primary">Resume Learning</Button>
                </div>
            </header>

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
