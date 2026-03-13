import { useState } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Check, ArrowRight, Users, FileText, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TrackItem {
    id: string;
    title: string;
    description: string;
    created_at: string;
    is_creator?: boolean;
    modules?: Array<{ id: string }>;
    created_by_info?: { id: string; name: string; email: string } | null;
    enrollment_count?: number;
    is_global_suggestion?: boolean;
}

interface RoadmapItem {
    id: string;
    title: string;
    description: string;
    steps: Array<{ track?: { id: string } | null }>;
    created_by_info?: { id: string; name: string; email: string } | null;
    enrollment_count?: number;
    is_global_suggestion?: boolean;
}

export function CurriculumBuilder() {
    const { user } = useAuth();
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSyllabus, setGeneratedSyllabus] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

    const isAdmin = user?.role === 'admin';
    const isPlatformOwner = user?.email === 'admin@remlearner.com';

    // Fetch tracks managed by this admin
    const { data: managedTracks, refetch: refetchTracks } = useQuery({
        queryKey: ['managed-tracks'],
        queryFn: async () => (await api.get('/tracks/')).data
    });

    const { data: roadmaps } = useQuery({
        queryKey: ['roadmaps'],
        queryFn: async () => (await api.get('/roadmaps/')).data
    });

    const roadmapTrackIds = new Set(
        ((roadmaps || []) as RoadmapItem[]).flatMap((roadmap) =>
            roadmap.steps.map((step) => step.track?.id).filter(Boolean)
        )
    );
    const standaloneManagedTracks = ((managedTracks || []) as TrackItem[]).filter((track) => !roadmapTrackIds.has(track.id));
    const visibleRoadmaps = ((roadmaps || []) as RoadmapItem[]).filter((roadmap) => roadmap.steps.length > 0);
    const suggestedTracks = standaloneManagedTracks.filter((track) => track.is_global_suggestion && !isPlatformOwner);
    const primaryTracks = isPlatformOwner
        ? standaloneManagedTracks
        : standaloneManagedTracks.filter((track) => !track.is_global_suggestion && track.is_creator);
    const suggestedRoadmaps = visibleRoadmaps.filter((roadmap) => roadmap.is_global_suggestion && !isPlatformOwner);
    const primaryRoadmaps = isPlatformOwner
        ? visibleRoadmaps
        : visibleRoadmaps.filter((roadmap) => !roadmap.is_global_suggestion);
    const platformOwnerTracks = isPlatformOwner
        ? primaryTracks.filter((track) => track.created_by_info?.email === user?.email)
        : [];
    const otherPlatformTracks = isPlatformOwner
        ? primaryTracks.filter((track) => track.created_by_info?.email !== user?.email)
        : [];
    const platformOwnerRoadmaps = isPlatformOwner
        ? primaryRoadmaps.filter((roadmap) => roadmap.created_by_info?.email === user?.email)
        : [];
    const otherPlatformRoadmaps = isPlatformOwner
        ? primaryRoadmaps.filter((roadmap) => roadmap.created_by_info?.email !== user?.email)
        : [];

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);

        try {
            const response = await api.post('/tracks/generate/', { topic });
            setGeneratedSyllabus(response.data);
            refetchTracks();
        } catch (error) {
            console.error('Failed to generate syllabus:', error);
            alert('Failed to generate tracking curriculum. Ensure API key is set.');
        } finally {
            setIsGenerating(false);
        }
    };

    const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
    const shareLink = `${appUrl}/track/enroll/${generatedSyllabus?.id}`;

    const copyToClipboard = (link?: string) => {
        navigator.clipboard.writeText(link || shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header className="space-y-4">
                <Badge variant="indigo" className="px-3 py-1 uppercase tracking-widest text-[10px]">AI Integration Hub</Badge>
                <div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 flex items-baseline gap-3">
                        Curriculum <span className="text-indigo-500 italic">Engine</span>
                    </h1>
                    <p className="text-neutral-400 text-sm md:text-lg">Generate rigorous, dynamic learning tracks or manage your existing fleet.</p>
                </div>
            </header>
            <Card className="border-indigo-500/10 bg-indigo-500/5 p-6 md:p-10">
                <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="What do you want to master today?"
                            placeholder="e.g. Advanced Django, React Server Components..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isGenerating}
                            className="bg-neutral-900 border-neutral-800 focus:border-indigo-500 transition-all h-14"
                        />
                    </div>
                    <Button type="submit" isLoading={isGenerating} className="w-full md:w-auto px-10 h-14 font-bold text-lg" rightIcon={!isGenerating && <ArrowRight size={18} />}>
                        Deploy Track
                    </Button>
                </form>
            </Card>

            <AnimatePresence>
                {generatedSyllabus && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <Card className="border-emerald-500/30 bg-emerald-500/5 p-8 md:p-12 relative overflow-hidden group">
                            <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
                                <div className="space-y-3 flex-1">
                                    <Badge variant="success" className="mb-2">New Track Successfully Deployed</Badge>
                                    <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">{generatedSyllabus.title}</h2>
                                    <p className="text-neutral-400 leading-relaxed max-w-2xl">{generatedSyllabus.description}</p>
                                </div>

                                {isAdmin && (
                                    <div className="flex-shrink-0 w-full md:w-auto p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                                        <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Share Link</p>
                                        <div className="flex items-center gap-2">
                                            <code className="px-3 py-2 bg-neutral-950 rounded-lg text-sm text-neutral-300 border border-neutral-800 font-mono truncate max-w-[200px]">
                                                {shareLink}
                                            </code>
                                            <Button variant="secondary" size="sm" onClick={() => copyToClipboard()}>
                                                {copied ? <Check size={16} className="text-emerald-400" /> : <LinkIcon size={16} />}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <section className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="text-indigo-400" /> {isPlatformOwner ? "Your Track Catalog" : isAdmin ? "Managed Learning Tracks" : "Your Generated Tracks"}
                </h2>

                <div className="grid gap-4">
                    {(isPlatformOwner ? platformOwnerTracks : primaryTracks).map((track: any) => (
                        <Card key={track.id} className="p-0 border-neutral-800 overflow-hidden">
                            <div
                                className="p-6 flex items-center justify-between cursor-pointer hover:bg-neutral-900/50 transition-colors"
                                onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-neutral-800 rounded-xl text-neutral-400">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{track.title}</h3>
                                        <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                                            {track.modules?.length || 0} Modules • Created {new Date(track.created_at).toLocaleDateString()}
                                        </p>
                                        {isPlatformOwner && (
                                            <p className="text-xs text-neutral-400 mt-2">
                                                Created by {track.created_by_info?.name || 'Unknown'} ({track.created_by_info?.email || 'n/a'}) • {track.enrollment_count || 0} enrolled
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {isAdmin && (
                                        <div className="hidden sm:block text-right">
                                            <p className="text-xs text-neutral-500 uppercase font-bold">Enrollment Link</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(`${appUrl}/track/enroll/${track.id}`); }}
                                                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 mt-1"
                                            >
                                                Copy Link <LinkIcon size={12} />
                                            </button>
                                        </div>
                                    )}
                                    {isAdmin ? (
                                        expandedTrack === track.id ? <ChevronUp className="text-neutral-600" /> : <ChevronDown className="text-neutral-600" />
                                    ) : (
                                        <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <ArrowRight size={16} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isAdmin && expandedTrack === track.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="border-t border-neutral-800 bg-neutral-950/50"
                                    >
                                        <CandidatesList trackId={track.id} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    ))}

                    {(isPlatformOwner ? platformOwnerTracks : primaryTracks).length === 0 && (
                        <div className="p-12 text-center bg-neutral-900/30 rounded-3xl border border-neutral-800 border-dashed">
                            <p className="text-neutral-500 italic">No tracks have been deployed yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {isPlatformOwner && otherPlatformTracks.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-sky-400" /> Tracks Created by Others
                    </h2>
                    <div className="grid gap-4">
                        {otherPlatformTracks.map((track: any) => (
                            <Card key={track.id} className="p-0 border-neutral-800 overflow-hidden">
                                <div
                                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-neutral-900/50 transition-colors"
                                    onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-neutral-800 rounded-xl text-neutral-400">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{track.title}</h3>
                                            <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                                                {track.modules?.length || 0} Modules • Created {new Date(track.created_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-neutral-400 mt-2">
                                                Created by {track.created_by_info?.name || 'Unknown'} ({track.created_by_info?.email || 'n/a'}) • {track.enrollment_count || 0} enrolled
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-xs text-neutral-500 uppercase font-bold">Enrollment Link</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(`${appUrl}/track/enroll/${track.id}`); }}
                                                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 mt-1"
                                            >
                                                Copy Link <LinkIcon size={12} />
                                            </button>
                                        </div>
                                        {expandedTrack === track.id ? <ChevronUp className="text-neutral-600" /> : <ChevronDown className="text-neutral-600" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedTrack === track.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="border-t border-neutral-800 bg-neutral-950/50"
                                        >
                                            <CandidatesList trackId={track.id} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {!isPlatformOwner && suggestedTracks.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Compass className="text-emerald-400" /> Suggested Tracks
                    </h2>
                    <div className="grid gap-4">
                        {suggestedTracks.map((track) => (
                            <Card key={track.id} className="p-6 border-neutral-800 bg-emerald-500/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <Badge variant="success" className="mb-3">Suggested by RemLearner</Badge>
                                        <h3 className="text-lg font-bold text-white">{track.title}</h3>
                                        <p className="text-sm text-neutral-400 mt-1">{track.description}</p>
                                    </div>
                                    <Button onClick={() => navigate(`/track/enroll/${track.id}`)}>
                                        Explore Track
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {(isPlatformOwner ? platformOwnerRoadmaps : primaryRoadmaps).length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Compass className="text-sky-400" /> {isPlatformOwner ? "Your Roadmaps" : "Roadmap-Managed Tracks"}
                    </h2>
                    <div className="grid gap-4">
                        {(isPlatformOwner ? platformOwnerRoadmaps : primaryRoadmaps).map((roadmap) => (
                            <Card key={roadmap.id} className="p-6 border-neutral-800 bg-sky-500/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <Badge variant={roadmap.is_global_suggestion ? "success" : "neutral"} className="bg-sky-500/10 text-sky-300 border-sky-500/20 mb-3">
                                            {roadmap.is_global_suggestion ? "Suggested Roadmap" : "Roadmap Container"}
                                        </Badge>
                                        <h3 className="text-lg font-bold text-white">{roadmap.title}</h3>
                                        <p className="text-sm text-neutral-400 mt-1">{roadmap.description}</p>
                                        {isPlatformOwner && (
                                            <p className="text-xs text-neutral-400 mt-2">
                                                Created by {roadmap.created_by_info?.name || 'Unknown'} ({roadmap.created_by_info?.email || 'n/a'}) • {roadmap.enrollment_count || 0} enrolled
                                            </p>
                                        )}
                                    </div>
                                    <Button variant="secondary" onClick={() => navigate(`/roadmaps/${roadmap.id}`)}>
                                        Open Roadmap
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {isPlatformOwner && otherPlatformRoadmaps.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Compass className="text-indigo-400" /> Roadmaps Created by Others
                    </h2>
                    <div className="grid gap-4">
                        {otherPlatformRoadmaps.map((roadmap) => (
                            <Card key={roadmap.id} className="p-6 border-neutral-800 bg-indigo-500/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <Badge variant="neutral" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-3">
                                            External Roadmap
                                        </Badge>
                                        <h3 className="text-lg font-bold text-white">{roadmap.title}</h3>
                                        <p className="text-sm text-neutral-400 mt-1">{roadmap.description}</p>
                                        <p className="text-xs text-neutral-400 mt-2">
                                            Created by {roadmap.created_by_info?.name || 'Unknown'} ({roadmap.created_by_info?.email || 'n/a'}) • {roadmap.enrollment_count || 0} enrolled
                                        </p>
                                    </div>
                                    <Button variant="secondary" onClick={() => navigate(`/roadmaps/${roadmap.id}`)}>
                                        Open Roadmap
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {!isPlatformOwner && suggestedRoadmaps.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Compass className="text-emerald-400" /> Suggested Roadmaps
                    </h2>
                    <div className="grid gap-4">
                        {suggestedRoadmaps.map((roadmap) => (
                            <Card key={roadmap.id} className="p-6 border-neutral-800 bg-emerald-500/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <Badge variant="success" className="mb-3">Suggested by RemLearner</Badge>
                                        <h3 className="text-lg font-bold text-white">{roadmap.title}</h3>
                                        <p className="text-sm text-neutral-400 mt-1">{roadmap.description}</p>
                                    </div>
                                    <Button onClick={() => navigate(`/roadmaps/${roadmap.id}`)}>
                                        Explore Roadmap
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export function CandidatesList({ trackId }: { trackId: string }) {
    const navigate = useNavigate();
    const { data: candidates, isLoading } = useQuery({
        queryKey: ['candidates', trackId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/enrolled_candidates/`)).data,
    });

    if (isLoading) return <div className="p-6 text-neutral-500 animate-pulse font-mono text-xs uppercase tracking-widest text-center">Interrogating Academic Database...</div>;

    return (
        <div className="p-8">
            <div className="flex items-center gap-2 mb-8 text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                <Users size={14} /> Registered Candidates
            </div>
            <div className="grid gap-6">
                {candidates?.map((candidate: any) => (
                    <Card
                        key={candidate.id}
                        className="p-8 bg-neutral-900/40 border-neutral-800 hover:border-blue-500/20 hover:bg-neutral-900/60 transition-all duration-700 cursor-pointer group"
                        onClick={() => navigate(`/admin/track/${trackId}/candidate/${candidate.id}/perspective`)}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-3xl bg-neutral-800 flex items-center justify-center text-xl font-black text-neutral-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-4 border-[#050505] flex items-center justify-center shadow-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors leading-none">{candidate.name}</h4>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant="neutral" className="bg-white/5 border-white/10 text-[10px] uppercase font-mono px-3">{candidate.email}</Badge>
                                        <div className="text-[10px] text-neutral-600 font-mono tracking-widest uppercase">Member since {new Date(candidate.enrolled_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12">
                                <div className="text-right space-y-3">
                                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Mastery Status</div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-40 h-1.5 bg-neutral-800 rounded-full overflow-hidden shadow-inner hidden sm:block">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${candidate.progress || 0}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                            />
                                        </div>
                                        <span className="font-mono font-black text-blue-400 text-lg tabular-nums">{candidate.progress || 0}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-xl">
                                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {(!candidates || candidates.length === 0) && (
                <div className="p-20 text-center space-y-4">
                    <Users size={48} className="mx-auto text-neutral-800 mb-6" />
                    <p className="text-neutral-500 font-medium italic">No candidates have appeared on this track's radar yet.</p>
                </div>
            )}
        </div>
    );
}
