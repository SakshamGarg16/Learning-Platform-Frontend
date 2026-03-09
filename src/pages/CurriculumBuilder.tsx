import { useState } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Link as LinkIcon, Check, ArrowRight, Users, Phone, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../contexts/AuthContext';

export function CurriculumBuilder() {
    const { user } = useAuth();
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSyllabus, setGeneratedSyllabus] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

    const isAdmin = user?.role === 'admin';

    // Fetch tracks managed by this admin
    const { data: managedTracks, refetch: refetchTracks } = useQuery({
        queryKey: ['managed-tracks'],
        queryFn: async () => (await api.get('/tracks/')).data
    });

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

    const shareLink = `http://localhost:5173/track/enroll/${generatedSyllabus?.id}`;

    const copyToClipboard = (link?: string) => {
        navigator.clipboard.writeText(link || shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                    <Sparkles className="text-indigo-400" /> AI Curriculum Engine
                </h1>
                <p className="text-neutral-400">Generate rigorous, dynamic learning tracks or manage your existing fleet.</p>
            </header>

            <Card className="border-indigo-500/10 bg-indigo-500/5">
                <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <Input
                            label="New Learning Topic"
                            placeholder="e.g. Advanced Django, React Server Components..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>
                    <Button type="submit" isLoading={isGenerating} className="w-full md:w-auto px-8" rightIcon={!isGenerating && <ArrowRight size={18} />}>
                        Generate & Deploy
                    </Button>
                </form>
            </Card>

            <AnimatePresence>
                {generatedSyllabus && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <Card className="border-emerald-500/30 bg-emerald-500/5">
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                <div>
                                    <Badge variant="success" className="mb-3">New Track Successfully Deployed</Badge>
                                    <h2 className="text-2xl font-bold text-white mb-1">{generatedSyllabus.title}</h2>
                                    <p className="text-neutral-400">{generatedSyllabus.description}</p>
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
                    <Users className="text-indigo-400" /> {isAdmin ? "Managed Learning Tracks" : "Your Generated Tracks"}
                </h2>

                <div className="grid gap-4">
                    {managedTracks?.filter((t: any) => t.is_creator).map((track: any) => (
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
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {isAdmin && (
                                        <div className="hidden sm:block text-right">
                                            <p className="text-xs text-neutral-500 uppercase font-bold">Enrollment Link</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(`http://localhost:5173/track/enroll/${track.id}`); }}
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

                    {(!managedTracks || managedTracks.length === 0) && (
                        <div className="p-12 text-center bg-neutral-900/30 rounded-3xl border border-neutral-800 border-dashed">
                            <p className="text-neutral-500 italic">No tracks have been deployed yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function CandidatesList({ trackId }: { trackId: string }) {
    const { data: candidates, isLoading } = useQuery({
        queryKey: ['candidates', trackId],
        queryFn: async () => (await api.get(`/tracks/${trackId}/enrolled_candidates/`)).data
    });

    if (isLoading) return <div className="p-8 text-center text-xs text-indigo-400 animate-pulse">Retrieving candidate dossiers...</div>;

    if (!candidates || candidates.length === 0) {
        return (
            <div className="p-10 text-center text-neutral-500">
                <p className="text-sm">No candidates have enrolled in this track yet.</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="grid gap-3">
                {candidates.map((c: any) => (
                    <div key={c.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                {c.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-bold text-white leading-none mb-1">{c.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1"><LinkIcon size={12} /> {c.email}</span>
                                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                                    {c.resume && (
                                        <a
                                            href={`http://localhost:8000${c.resume}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <FileText size={12} /> View Resume
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 mt-4 md:mt-0">
                            <div className="text-right">
                                <p className="text-[10px] text-neutral-500 uppercase font-bold text-left mb-1">Live Progress</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${c.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-mono text-white font-bold">{c.progress}%</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Enrolled On</p>
                                <p className="text-xs text-white uppercase">{new Date(c.enrolled_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
