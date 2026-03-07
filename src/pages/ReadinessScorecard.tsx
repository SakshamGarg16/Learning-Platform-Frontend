import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ShieldCheck, Award, Target, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function ReadinessScorecard() {
    const { data: readinessData, isLoading } = useQuery({
        queryKey: ['readiness'],
        queryFn: async () => (await api.get('/readiness/')).data
    });

    const latestSnapshot = readinessData?.[0] || {
        overall_score: 0,
        knowledge_score: 0,
        validated_score: 0,
        peer_score: 0,
        mentor_score: 0,
        graduation_eligible: false
    };

    const categories = [
        { name: 'Curriculum Mastery (Track Progress)', score: latestSnapshot.knowledge_score || 0, icon: Target, color: 'text-indigo-400' },
        { name: 'AI Validated Precision (Assessment Avg)', score: latestSnapshot.validated_score || 0, icon: TrendingUp, color: 'text-emerald-400' },
    ];

    const scoreNum = latestSnapshot.overall_score || 0;
    const strokeOffset = 283 - (283 * scoreNum) / 100;

    if (isLoading) {
        return <div className="p-12 text-center animate-pulse text-indigo-400 font-mono">Calculating readiness metrics...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between border-b border-neutral-800 pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <ShieldCheck className="text-indigo-400" /> Readiness Scorecard
                    </h1>
                    <p className="text-neutral-400">Detailed breakdown of your operator verification metrics.</p>
                </div>
                <Button variant="outline">Download PDF</Button>
            </header>

            <div className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-indigo-900/20 to-neutral-900 border border-indigo-500/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex-1 text-center md:text-left">
                    <Badge variant={latestSnapshot.graduation_eligible ? 'success' : 'neutral'} className="mb-4 text-sm px-3 py-1">
                        {latestSnapshot.graduation_eligible ? 'Eligible for Graduation' : 'Development in Progress'}
                    </Badge>
                    <h2 className="text-5xl font-extrabold text-white tracking-tighter mb-4">
                        {latestSnapshot.overall_score}<span className="text-2xl text-neutral-500">/100</span>
                    </h2>
                    <p className="text-lg text-indigo-200/80 leading-relaxed max-w-sm">
                        You have demonstrated strong operational capabilities across all core parameters.
                    </p>
                </div>
                <div className="shrink-0">
                    <div className="w-48 h-48 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-800" />
                            <circle
                                cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6"
                                strokeDasharray="283" strokeDashoffset={strokeOffset}
                                className="text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Award size={48} className="text-indigo-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-neutral-800 pb-3">Metric Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat, idx) => (
                        <Card key={idx} className="p-5 flex items-center gap-5 hover:bg-neutral-800/50 transition-colors">
                            <div className={`p-3 rounded-xl bg-neutral-900 border border-neutral-800 ${cat.color}`}>
                                <cat.icon size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-semibold text-neutral-200">{cat.name}</span>
                                    <span className="text-xl font-bold text-white">{cat.score}</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${cat.score}%` }} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
