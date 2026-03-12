import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Map, Zap, ShieldCheck, LogOut, Menu, X, Compass } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Removed sidebar variants to rely entirely on tailwind for responsive rendering

const navItems = [
    { icon: Map, label: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'Curriculum', path: '/curriculum' },
    { icon: ShieldCheck, label: 'Readiness', path: '/readiness' },
    { icon: Compass, label: 'Roadmaps', path: '/roadmaps' },
];

export function AppLayout({ children }: { children: ReactNode }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">

            {/* Mobile overlay backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 flex flex-col justify-between border-r border-neutral-800 bg-neutral-900/90 backdrop-blur-xl shrink-0
                    transform transition-transform duration-300 ease-in-out
                    md:relative md:translate-x-0
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div>
                    <div className="h-16 flex items-center px-6 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                <Zap size={18} />
                            </div>
                            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                                REMLearners
                            </span>
                        </div>
                    </div>

                    <nav className="p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                                        }`}
                                >
                                    <item.icon size={18} className={isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-300'} />
                                    {item.label}
                                    {isActive && (
                                        <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-neutral-800">
                    {user && (
                        <div className="mb-4 px-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-xs text-neutral-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col">

                {/* Mobile Header Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Zap size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
                            REMLearners
                        </span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -mr-2 text-neutral-400 hover:text-white transition-colors">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Subtle background gradient noise */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-neutral-950/0 to-neutral-950/0" />

                <div className="relative z-10 w-full flex-1 p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
