import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Shield, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface SignupProps {
    forceAdmin?: boolean;
}

export function Signup({ forceAdmin = false }: SignupProps) {
    const { signup, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isAdmin] = useState(forceAdmin);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await signup({
                email,
                password,
                full_name: fullName,
                is_admin: isAdmin
            });
            navigate('/login', { state: { message: 'Account created! Please log in.' } });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create account. Ensure backend has API Token configured.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
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
                        <UserPlus size={32} />
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-center text-3xl font-extrabold tracking-tight text-white mb-2"
                >
                    Create Account
                </motion.h2>
                <motion.p
                    className="text-center text-sm text-neutral-400 mb-8"
                >
                    Join the RemLearners ecosystem.
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <Card className="py-8 px-4 sm:px-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-neutral-500" size={18} />
                                <Input
                                    placeholder="Full Name"
                                    className="pl-10"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-neutral-500" size={18} />
                                <Input
                                    type="email"
                                    placeholder="Email Address"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-neutral-500" size={18} />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Admin Registration Notification - Only shown if forceAdmin is true */}
                            {forceAdmin && (
                                <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <Shield size={14} className="text-red-400" />
                                    <span className="text-xs font-bold text-red-200 uppercase tracking-wider">
                                        Administrative Privileges Enabled
                                    </span>
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className={`w-full py-6 text-lg font-bold rounded-xl shadow-lg ${forceAdmin ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'shadow-indigo-500/20'}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : forceAdmin ? 'Initialize Admin Profile' : 'Sign Up'}
                        </Button>

                        <div className="text-center mt-6">
                            <Link to="/login" className="text-neutral-500 hover:text-indigo-400 text-sm flex items-center justify-center transition-colors">
                                <ArrowLeft size={14} className="mr-2" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
