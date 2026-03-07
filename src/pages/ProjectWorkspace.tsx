import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { BoxSelect, Cloud, CheckCircle2, Play, GitBranch, TerminalSquare, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function ProjectWorkspace() {
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => (await api.get('/projects/')).data
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <BoxSelect className="text-indigo-400" /> Deployments Workspace
                    </h1>
                    <p className="text-neutral-400">Manage REMCloudHub projects and view real-time deployment telemetry.</p>
                </div>
                <Button leftIcon={<Cloud size={18} />}>New Deployment</Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Deployments List */}
                <div className="lg:col-span-2 space-y-6">
                    {isLoading ? (
                        <div className="p-12 text-center text-neutral-400 animate-pulse font-mono">Loading project matrix...</div>
                    ) : projects?.length > 0 ? projects.map((project: any, idx: number) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="p-0 border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition-colors">
                                <div className="flex flex-col sm:flex-row p-6 items-start sm:items-center justify-between gap-4">

                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${project.status === 'Running' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                project.status === 'Failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                    'bg-neutral-800 border-neutral-700 text-neutral-500'
                                            }`}>
                                            {project.status === 'Running' ? <CheckCircle2 size={24} /> :
                                                project.status === 'Failed' ? <AlertTriangle size={24} /> :
                                                    <BoxSelect size={24} />}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-white">{project.name}</h3>
                                                <Badge variant="neutral">Environment: {project.environment}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-neutral-500 uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><GitBranch size={14} className="text-neutral-600" /> main</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><TerminalSquare size={14} className="text-neutral-600" /> {project.id.split('-')[0]}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                                        <div className="text-right mr-4 hidden md:block">
                                            <p className="text-xs text-neutral-500 mb-1">Status</p>
                                            <span className={`text-lg font-bold ${project.status === 'Running' ? 'text-emerald-400' : project.status === 'Syncing' ? 'text-amber-400' : 'text-neutral-500'}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        <Button variant={project.status === 'Running' ? 'outline' : 'primary'} size="sm">
                                            {project.status === 'Running' ? 'Logs' : 'Redeploy'}
                                        </Button>
                                    </div>

                                </div>
                            </Card>
                        </motion.div>
                    )) : (
                        <div className="p-12 text-center text-neutral-500">No active projects found. Initialize a new deployment to begin.</div>
                    )}
                </div>

                {/* Sidebar Insights */}
                <div className="space-y-6">
                    <Card gradientHover>
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-neutral-800 pb-3">
                            <Play size={18} className="text-indigo-400" /> Telemetry Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Total Compute</span>
                                <span className="text-white font-mono">1.2 vCPU</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Memory Usage</span>
                                <span className="text-white font-mono">2.4 GB</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-400">Bandwidth Out</span>
                                <span className="text-white font-mono">45.2 GB / mo</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
