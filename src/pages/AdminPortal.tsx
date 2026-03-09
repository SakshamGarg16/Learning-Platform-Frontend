import { motion } from 'framer-motion';
import { Zap, ShieldAlert, KeyRound } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function AdminPortal() {
    const { login } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* High-Stakes Red Decoration */}
            <div className="absolute top-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                >
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shadow-2xl shadow-red-500/20 mb-8">
                        <ShieldAlert size={40} className="animate-pulse" />
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-2 text-center text-4xl font-black tracking-tighter text-white mb-2 uppercase italic"
                >
                    Systems Command
                </motion.h2>
                <div className="flex justify-center mb-8">
                    <div className="px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">Administrative Restricted Area</span>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
            >
                <Card className="py-12 px-8 sm:px-12 text-center border-red-500/20 bg-neutral-900/80 backdrop-blur-xl shadow-2xl shadow-red-500/10">
                    <div className="space-y-8">
                        <div className="flex justify-center">
                            <div className="p-5 bg-red-500/5 rounded-2xl text-red-500 border border-red-500/10">
                                <KeyRound size={56} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white tracking-tight">Privileged Access</h3>
                            <p className="text-sm text-neutral-500 leading-relaxed">
                                This portal is restricted to internal command personnel. Authorize your administrative footprint via the RemCloud Security Module.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <Button
                                onClick={() => login()}
                                className="w-full py-7 text-xl font-bold tracking-widest bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-xl shadow-red-600/20 border-t border-red-400/20"
                                size="lg"
                            >
                                SYSTEM LOGIN
                            </Button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-neutral-800"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-neutral-900 px-3 text-neutral-600 font-black tracking-[.3em]">Registry Protocol</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => {
                                    // Isolated Admin Registration Flow
                                    // Adding application=remlearner tells Authentik to use the RemLearner launch URL after flow completion
                                    window.location.href = import.meta.env.VITE_ADMIN_REGISTRATION_URL || `http://localhost:9000/if/flow/admin-registration/?application=remlearner`;
                                }}
                                variant="secondary"
                                className="w-full py-5 text-xs font-black tracking-[0.2em] rounded-2xl border-neutral-800 text-red-400/70 hover:text-white hover:bg-red-500/10 transition-all uppercase"
                            >
                                Provision Admin Identity
                            </Button>
                        </div>

                        <div className="pt-8 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all">
                            <Zap size={16} className="text-neutral-500" />
                            <div className="h-4 w-px bg-neutral-800" />
                            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.4em]">
                                RemLearner Kernel 2.0
                            </p>
                            <div className="h-4 w-px bg-neutral-800" />
                            <ShieldAlert size={16} className="text-neutral-500" />
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
