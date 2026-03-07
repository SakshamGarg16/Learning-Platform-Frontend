import { useState } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Link as LinkIcon, Check, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export function CurriculumBuilder() {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSyllabus, setGeneratedSyllabus] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);

        try {
            // Call the actual Django endpoint
            const response = await api.post('/tracks/generate/', { topic });
            setGeneratedSyllabus(response.data);
        } catch (error) {
            console.error('Failed to generate syllabus:', error);
            alert('Failed to generate tracking curriculum. Ensure API key is set.');
        } finally {
            setIsGenerating(false);
        }
    };

    const shareLink = `http://localhost:5173/track/enroll/${generatedSyllabus?.id}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                    <Sparkles className="text-indigo-400" /> AI Curriculum Engine
                </h1>
                <p className="text-neutral-400">Generate rigorous, dynamic learning tracks with a single prompt.</p>
            </header>

            <Card>
                <form onSubmit={handleGenerate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Input
                            label="Learning Topic"
                            placeholder="e.g. Advanced Django, React Server Components, Prompt Engineering..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>
                    <Button type="submit" isLoading={isGenerating} rightIcon={!isGenerating && <ArrowRight size={18} />}>
                        Generate Track
                    </Button>
                </form>
            </Card>

            <AnimatePresence>
                {generatedSyllabus && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6"
                    >
                        <Card gradientHover className="border-indigo-500/30 bg-indigo-500/5">
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                                <div>
                                    <Badge variant="success" className="mb-3">Generation Complete</Badge>
                                    <h2 className="text-2xl font-bold text-white mb-1">{generatedSyllabus.title}</h2>
                                    <p className="text-neutral-400">{generatedSyllabus.description}</p>
                                </div>

                                <div className="flex-shrink-0 w-full md:w-auto p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                                    <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">Share Link</p>
                                    <div className="flex items-center gap-2">
                                        <code className="px-3 py-2 bg-neutral-950 rounded-lg text-sm text-neutral-300 border border-neutral-800 font-mono truncate max-w-[200px]">
                                            {shareLink}
                                        </code>
                                        <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                                            {copied ? <Check size={16} className="text-emerald-400" /> : <LinkIcon size={16} />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <h3 className="font-semibold text-neutral-300">Syllabus Overview</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {generatedSyllabus.modules.map((mod: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
                                            <div className="text-xs font-bold text-indigo-400 mb-1">MODULE {idx + 1}</div>
                                            <h4 className="font-medium text-white text-sm mb-3">{mod.title}</h4>
                                            <p className="text-xs text-neutral-500">{mod.lessons?.length || 0} Lessons + Assessment</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
