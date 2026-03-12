import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PlayCircle, Award, CheckCircle2, BookOpen, Sparkles, Compass, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TrackItem {
    id: string;
    title: string;
    description: string;
    is_ai_generated?: boolean;
    is_enrolled?: boolean;
    is_creator?: boolean;
    progress_percentage?: number;
    modules?: Array<{ id: string }>;
}

interface RoadmapStepItem {
    id: string;
    title: string;
    track?: { id: string } | null;
    is_completed?: boolean;
}

interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    is_enrolled?: boolean;
    is_finalized?: boolean;
    steps: RoadmapStepItem[];
}

export function Dashboard() {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] || 'Operator';

    // Fetch data from Django API
    const { data: readinessData } = useQuery({
        queryKey: ['readiness'],
        queryFn: async () => (await api.get('/readiness/')).data
    });

    const { data: tracksData, isLoading: loadingTracks } = useQuery({
        queryKey: ['tracks'],
        queryFn: async () => (await api.get('/tracks/')).data
    });

    const { data: roadmapData, isLoading: loadingRoadmaps } = useQuery({
        queryKey: ['roadmaps'],
        queryFn: async () => (await api.get('/roadmaps/')).data
    });

    const score = readinessData?.length > 0 ? readinessData[0].overall_score : '0.0';

    const visibleRoadmaps: RoadmapItem[] = roadmapData || [];
    const roadmapTrackIds = new Set(
        visibleRoadmaps.flatMap((roadmap) =>
            roadmap.steps.map((step) => step.track?.id).filter(Boolean)
        )
    );

    const standaloneTracks: TrackItem[] = (tracksData || []).filter((track: TrackItem) => !roadmapTrackIds.has(track.id));
    const enrolledRoadmaps = visibleRoadmaps.filter((roadmap) => roadmap.is_enrolled);
    const createdRoadmaps = visibleRoadmaps.filter((roadmap) => !roadmap.is_enrolled);

    const activeLearning = standaloneTracks.filter((t) => t.is_enrolled && !t.is_creator && (t.progress_percentage || 0) < 100);
    const yourCreations = standaloneTracks.filter((t) => t.is_creator && (t.progress_percentage || 0) < 100);
    const completed = standaloneTracks.filter((t) => (t.progress_percentage || 0) === 100);

    const stats = [
        { label: 'Readiness Score', value: score, icon: Award, color: 'text-emerald-400' },
        { label: 'Roadmaps In Progress', value: enrolledRoadmaps.length.toString(), icon: Compass, color: 'text-sky-400' },
        { label: 'Active Progress', value: (activeLearning.length + yourCreations.length).toString(), icon: CheckCircle2, color: 'text-indigo-400' },
    ];

    const TrackGrid = ({ tracks, title }: { tracks: TrackItem[], title: string }) => {
        if (tracks.length === 0) return null;
        return (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="text-indigo-400" /> {title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tracks.map((track: any, idx: number) => (
                        <motion.div
                            key={track.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link to={`/track/enroll/${track.id}`}>
                                <Card gradientHover className="p-0 overflow-hidden h-full flex flex-col border-neutral-800 hover:border-indigo-500/50 transition-all cursor-pointer group">
                                    <div className="p-5 border-b border-neutral-800 bg-neutral-900/50 flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge variant={track.is_ai_generated ? "indigo" : "neutral"}>
                                                {track.is_ai_generated ? "AI Generated" : "Custom"}
                                            </Badge>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-white">{track.progress_percentage || 0}%</span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">{track.title}</h3>
                                        <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{track.description}</p>
                                    </div>
                                    <div className="p-4 bg-neutral-900 flex items-center justify-between">
                                        <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                                            {track.modules?.length || 0} Modules
                                        </span>
                                        <div className="flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                                            Enter Track <PlayCircle size={14} />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    const RoadmapGrid = ({ roadmaps, title }: { roadmaps: RoadmapItem[]; title: string }) => {
        if (roadmaps.length === 0) return null;

        return (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Compass className="text-sky-400" /> {title}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {roadmaps.map((roadmap, idx) => {
                        const totalSteps = roadmap.steps.length || 1;
                        const completedSteps = roadmap.steps.filter((step) => step.is_completed).length;
                        const progress = Math.round((completedSteps / totalSteps) * 100);

                        return (
                            <motion.div
                                key={roadmap.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                            >
                                <Link to={`/roadmaps/${roadmap.id}`}>
                                    <Card gradientHover className="p-6 h-full border-neutral-800 hover:border-sky-500/40 transition-all cursor-pointer group">
                                        <div className="flex items-start justify-between gap-4 mb-5">
                                            <div className="space-y-3">
                                                <Badge variant="neutral" className="bg-sky-500/10 text-sky-300 border-sky-500/20">
                                                    Roadmap Journey
                                                </Badge>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-white group-hover:text-sky-300 transition-colors">
                                                        {roadmap.title}
                                                    </h3>
                                                    <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
                                                        {roadmap.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Progress</p>
                                                <p className="text-2xl font-bold text-white">{progress}%</p>
                                            </div>
                                        </div>

                                        <div className="mb-5">
                                            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 p-4">
                                                <p className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Milestones</p>
                                                <p className="text-xl font-bold text-white mt-1">{totalSteps}</p>
                                            </div>
                                            <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 p-4">
                                                <p className="text-xs uppercase tracking-widest text-neutral-500 font-mono">Completed</p>
                                                <p className="text-xl font-bold text-white mt-1">{completedSteps}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-neutral-500">
                                                Tracks stay grouped inside the roadmap view.
                                            </span>
                                            <span className="flex items-center gap-2 font-bold text-sky-300 group-hover:translate-x-1 transition-transform">
                                                Open Roadmap <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Welcome back, {firstName}</h1>
                    <p className="text-neutral-400 text-sm md:text-base">Your personalized knowledge ecosystem is ready.</p>
                </div>
                <Link to="/curriculum" className="w-full sm:w-auto">
                    <Button leftIcon={<Sparkles size={18} />} className="w-full sm:w-auto px-8 py-6 sm:py-3">Generate New Track</Button>
                </Link>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card gradientHover className="h-full flex items-center p-6 gap-6">
                            <div className={`p-4 rounded-2xl bg-neutral-800/50 ${stat.color}`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-neutral-400">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="space-y-12">
                {(loadingTracks || loadingRoadmaps) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="h-48 animate-pulse bg-neutral-900/50 border-neutral-800"><div className="p-5 h-full" /></Card>
                        ))}
                    </div>
                ) : ((tracksData?.length || 0) > 0 || visibleRoadmaps.length > 0) ? (
                    <>
                        <RoadmapGrid roadmaps={enrolledRoadmaps} title="Guided Roadmaps" />
                        <RoadmapGrid roadmaps={createdRoadmaps} title="Your Designed Roadmaps" />
                        <TrackGrid tracks={activeLearning} title="Active Learning Tracks" />
                        <TrackGrid tracks={yourCreations} title="Your Custom Lab" />
                        <TrackGrid tracks={completed} title="Completed Masteries" />
                    </>
                ) : (
                    <Card className="p-12 text-center">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-500">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white">No active tracks found</h3>
                            <p className="text-neutral-400">Start your journey by generating a track or creating a custom curriculum.</p>
                            <Link to="/curriculum">
                                <Button className="mt-2">Generate First Track</Button>
                            </Link>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
