import { motion } from 'framer-motion';
import { Zap, ShieldCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
    const { login } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-6">
                        <Zap size={32} />
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-2 text-center text-3xl font-extrabold tracking-tight text-white mb-2"
                >
                    Factory Authorization
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-sm text-neutral-400 mb-8"
                >
                    Secure Single Sign-On powered by Authentik.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <Card className="py-12 px-4 sm:px-10 text-center">
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
                                <ShieldCheck size={48} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white">Identity Verification</h3>
                        <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                            Proceed to the secure identity provider to verify your operator or administrator credentials.
                        </p>

                        <Button
                            onClick={() => login()}
                            className="w-full py-6 text-lg tracking-wide rounded-xl shadow-lg shadow-indigo-500/20"
                            size="lg"
                        >
                            Log In with Authentik
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-neutral-900 px-2 text-neutral-500 font-bold tracking-widest">New Operator?</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => {
                                // Appending application=remlearner ensures Authentik redirects back to the app context after signup
                                window.location.href = import.meta.env.VITE_REGISTRATION_URL || `http://localhost:9000/if/flow/registration/?application=remlearner`;
                            }}
                            variant="secondary"
                            className="w-full py-4 text-sm font-bold tracking-widest rounded-xl border-neutral-700"
                        >
                            Create New Account
                        </Button>

                        <div className="pt-4 border-t border-neutral-800">
                            <p className="text-[10px] text-neutral-600 uppercase tracking-[0.2em] font-bold">
                                Protected by RemCloud Gateway
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
