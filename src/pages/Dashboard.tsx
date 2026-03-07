import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PlayCircle, Award, CheckCircle2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
    // Fetch data from Django API
    const { data: readinessData } = useQuery({
        queryKey: ['readiness'],
        queryFn: async () => (await api.get('/readiness/')).data
    });

    const { data: tracksData, isLoading: loadingTracks } = useQuery({
        queryKey: ['tracks'],
        queryFn: async () => (await api.get('/tracks/')).data
    });

    const mockScore = readinessData?.length > 0 ? readinessData[0].score : '0.0';

    const stats = [
        { label: 'Readiness Score', value: mockScore, icon: Award, color: 'text-emerald-400' },
        { label: 'Active Curriculums', value: tracksData?.length.toString() || '0', icon: CheckCircle2, color: 'text-indigo-400' },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back, Operator</h1>
                    <p className="text-neutral-400">Your personalized knowledge ecosystem is ready.</p>
                </div>
                <Link to="/curriculum">
                    <Button>Build New Module</Button>
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
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="text-indigo-400" /> Your Learning Tracks
                </h2>

                {loadingTracks ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="h-48 animate-pulse bg-neutral-900/50 border-neutral-800">
                                <div className="p-5 h-full" />
                            </Card>
                        ))}
                    </div>
                ) : tracksData?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tracksData.map((track: any, idx: number) => (
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
