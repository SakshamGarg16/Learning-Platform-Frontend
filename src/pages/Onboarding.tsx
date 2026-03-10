import { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Phone, ArrowRight, Sparkles, FileText, Upload } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export function Onboarding() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: user?.name || '',
        phone_number: '',
        experience_level: 'student' as 'student' | 'professional' | 'switcher',
    });
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = new FormData();
            data.append('full_name', formData.full_name);
            data.append('phone_number', formData.phone_number);
            data.append('experience_level', formData.experience_level);
            if (resumeFile) {
                data.append('resume', resumeFile);
            }

            await api.post('/learners/complete_profile/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            window.location.href = '/'; // Hard refresh to update auth state
        } catch (error) {
            console.error('Failed to complete profile:', error);
            alert('Submission failed. Please check your network.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
                >
                    <Sparkles size={12} /> Personnel Initialization
                </motion.div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Finalize Your Profile</h2>
                <p className="text-neutral-400 text-sm mb-10">
                    Welcome to the platform. Complete these details to initialize your learning roadmap.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6" aria-label="onboarding-form">
                        <Input
                            label="Full Name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="John Doe"
                            leftIcon={<UserIcon size={18} />}
                            required
                        />

                        <Input
                            label="Phone Number"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            leftIcon={<Phone size={18} />}
                            required
                        />

                        {!isAdmin && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider block">
                                        Resume / CV (PDF or Word)
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-800 border-dashed rounded-xl cursor-pointer bg-neutral-900/50 hover:bg-neutral-900 hover:border-indigo-500/50 transition-all group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {resumeFile ? (
                                                <>
                                                    <FileText className="w-8 h-8 mb-3 text-indigo-400" />
                                                    <p className="text-xs text-white font-medium">{resumeFile.name}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mb-3 text-neutral-600 group-hover:text-indigo-400 transition-colors" />
                                                    <p className="mb-2 text-sm text-neutral-500">
                                                        <span className="font-bold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-neutral-600">PDF, DOCX (Max. 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                            required={!isAdmin}
                                        />
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-400 uppercase tracking-wider block">
                                        Experience Level
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['student', 'professional', 'switcher'] as const).map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, experience_level: level })}
                                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all capitalize ${formData.experience_level === level
                                                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                                                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg"
                            isLoading={isLoading}
                            rightIcon={!isLoading && <ArrowRight size={20} />}
                        >
                            Initialize System
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
