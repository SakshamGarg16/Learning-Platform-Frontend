import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, BASE_URL } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
    Users,
    Shield,
    User,
    Search,
    Mail,
    Phone,
    FileText,
    Compass,
    BookOpen,
    Clock3,
    ArrowRight,
    Sparkles,
    PanelsTopLeft,
} from 'lucide-react';

interface DirectoryUser {
    id: string;
    email: string;
    full_name: string;
    phone_number?: string | null;
    resume?: string | null;
    is_admin: boolean;
    profile_completed: boolean;
    experience_level: string;
    created_at: string;
    role: 'admin' | 'learner';
    created_track_count: number;
    created_roadmap_count: number;
}

interface TrackSummary {
    id: string;
    title: string;
    description: string;
    created_at: string;
    is_ai_generated: boolean;
    enrollment_count: number;
}

interface RoadmapSummary {
    id: string;
    title: string;
    description: string;
    created_at: string;
    is_finalized: boolean;
    enrollment_count: number;
    step_count: number;
}

interface PlatformProfile extends DirectoryUser {
    mode: string;
    timezone: string;
    locale: string;
    created_tracks: TrackSummary[];
    created_roadmaps: RoadmapSummary[];
    updated_at: string;
}

type DirectoryFilter = 'admins' | 'learners' | 'all';
type DetailTab = 'profile' | 'tracks' | 'roadmaps';

export function PlatformPeople() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<DirectoryFilter>('admins');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<DetailTab>('profile');

    const { data: directory = [], isLoading: directoryLoading } = useQuery({
        queryKey: ['platform-directory'],
        queryFn: async () => (await api.get('/learners/platform_directory/')).data as DirectoryUser[],
    });

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();
        return directory.filter((person) => {
            const matchesSearch = !term
                || person.full_name.toLowerCase().includes(term)
                || person.email.toLowerCase().includes(term);
            const matchesFilter = filter === 'all'
                || (filter === 'admins' && person.role === 'admin')
                || (filter === 'learners' && person.role === 'learner');
            return matchesSearch && matchesFilter;
        });
    }, [directory, filter, search]);

    const selectedId = selectedUserId || filteredUsers[0]?.id || directory[0]?.id || null;

    useEffect(() => {
        if (!selectedUserId && selectedId) {
            setSelectedUserId(selectedId);
        }
    }, [selectedId, selectedUserId]);

    useEffect(() => {
        if (selectedUserId && !filteredUsers.some((person) => person.id === selectedUserId)) {
            setSelectedUserId(filteredUsers[0]?.id || directory[0]?.id || null);
        }
    }, [directory, filteredUsers, selectedUserId]);

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ['platform-profile', selectedId],
        queryFn: async () => (await api.get(`/learners/${selectedId}/platform_profile/`)).data as PlatformProfile,
        enabled: !!selectedId,
    });

    const adminCount = directory.filter((person) => person.role === 'admin').length;
    const learnerCount = directory.filter((person) => person.role === 'learner').length;

    return (
        <div className="max-w-[1500px] mx-auto pb-20 space-y-8">
            <header className="rounded-[2rem] border border-neutral-800 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_35%),linear-gradient(180deg,rgba(17,24,39,0.9),rgba(10,10,10,0.92))] p-8 md:p-10 overflow-hidden relative">
                <div className="absolute -top-20 right-[-5%] w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                    <div className="space-y-4 max-w-3xl">
                        <Badge variant="neutral" className="bg-red-500/10 text-red-300 border-red-500/20">
                            Platform Oversight
                        </Badge>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">People Command Center</h1>
                            <p className="text-neutral-400 mt-3 text-base md:text-lg">
                                Browse admins and learners in a clean split-view, inspect saved profile details, and open the tracks or roadmaps they created.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 xl:min-w-[560px]">
                        <SummaryPanel label="Total Accounts" value={directory.length} accent="indigo" />
                        <SummaryPanel label="Admins" value={adminCount} accent="amber" />
                        <SummaryPanel label="Learners" value={learnerCount} accent="sky" />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[380px,minmax(0,1fr)] gap-8 items-start">
                <aside className="xl:sticky xl:top-8 space-y-6">
                    <Card className="p-5 border-neutral-800 bg-neutral-900/70 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center">
                                <Users size={18} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Directory</h2>
                                <p className="text-sm text-neutral-500">Pick a person to inspect</p>
                            </div>
                        </div>

                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or email"
                            leftIcon={<Search size={16} />}
                        />

                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <SegmentButton label="Admins" active={filter === 'admins'} onClick={() => setFilter('admins')} />
                            <SegmentButton label="Learners" active={filter === 'learners'} onClick={() => setFilter('learners')} />
                            <SegmentButton label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
                        </div>

                        <div className="mt-5 space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                            {directoryLoading ? (
                                <EmptyBlock label="Loading people..." />
                            ) : filteredUsers.length === 0 ? (
                                <EmptyBlock label="No matching users found." />
                            ) : (
                                <>
                                    {(filter === 'admins' || filter === 'all') && (
                                        <UserSection
                                            title="Administrators"
                                            icon={<Shield size={14} className="text-amber-400" />}
                                            users={filteredUsers.filter((person) => person.role === 'admin')}
                                            selectedId={selectedId}
                                            onSelect={(id) => {
                                                setSelectedUserId(id);
                                                setActiveTab('profile');
                                            }}
                                        />
                                    )}
                                    {(filter === 'learners' || filter === 'all') && (
                                        <UserSection
                                            title="Learners"
                                            icon={<User size={14} className="text-sky-400" />}
                                            users={filteredUsers.filter((person) => person.role === 'learner')}
                                            selectedId={selectedId}
                                            onSelect={(id) => {
                                                setSelectedUserId(id);
                                                setActiveTab('profile');
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </aside>

                <section className="space-y-6 min-w-0">
                    {!selectedId ? (
                        <Card className="p-10 border-neutral-800 bg-neutral-900/60 text-neutral-500">
                            Select a user from the directory to view their details.
                        </Card>
                    ) : profileLoading || !profile ? (
                        <Card className="p-10 border-neutral-800 bg-neutral-900/60 text-neutral-500">
                            Loading selected profile...
                        </Card>
                    ) : (
                        <>
                            <Card className="p-8 md:p-10 border-neutral-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.88),rgba(10,10,10,0.94))] overflow-hidden relative">
                                <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />
                                <div className="relative z-10 flex flex-col 2xl:flex-row 2xl:items-start justify-between gap-8">
                                    <div className="space-y-6 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 text-indigo-300 flex items-center justify-center font-black text-2xl shrink-0">
                                                {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <Badge variant={profile.is_admin ? 'warning' : 'neutral'}>{profile.role}</Badge>
                                                    <Badge variant={profile.profile_completed ? 'success' : 'neutral'}>
                                                        {profile.profile_completed ? 'Profile Complete' : 'Incomplete'}
                                                    </Badge>
                                                </div>
                                                <h2 className="text-3xl font-black tracking-tight text-white break-words">{profile.full_name}</h2>
                                                <p className="text-neutral-400 mt-2 break-all">{profile.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            <InfoPanel icon={<Mail size={15} />} label="Email" value={profile.email} />
                                            <InfoPanel icon={<Phone size={15} />} label="Phone" value={profile.phone_number || 'Not provided'} />
                                            <InfoPanel icon={<User size={15} />} label="Experience" value={profile.experience_level} />
                                            <InfoPanel icon={<Sparkles size={15} />} label="Mode" value={profile.mode} />
                                            <InfoPanel icon={<Compass size={15} />} label="Timezone" value={profile.timezone} />
                                            <InfoPanel icon={<PanelsTopLeft size={15} />} label="Locale" value={profile.locale} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-2 gap-4 2xl:min-w-[320px]">
                                        <SummaryPanel label="Tracks Created" value={profile.created_tracks.length} accent="indigo" compact />
                                        <SummaryPanel label="Roadmaps Created" value={profile.created_roadmaps.length} accent="sky" compact />
                                        <SummaryPanel label="Joined" value={new Date(profile.created_at).toLocaleDateString()} accent="neutral" compact />
                                        <SummaryPanel label="Updated" value={new Date(profile.updated_at).toLocaleDateString()} accent="neutral" compact />
                                    </div>
                                </div>

                                {profile.resume && (
                                    <div className="relative z-10 mt-6 pt-6 border-t border-neutral-800">
                                        <Button
                                            variant="secondary"
                                            onClick={() => window.open(`${BASE_URL}${profile.resume}`, '_blank', 'noopener,noreferrer')}
                                            leftIcon={<FileText size={16} />}
                                        >
                                            Open Resume
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            <Card className="p-3 border-neutral-800 bg-neutral-900/70 backdrop-blur-xl sticky top-4 z-10">
                                <div className="grid grid-cols-3 gap-2">
                                    <TabButton label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                                    <TabButton label="Tracks" active={activeTab === 'tracks'} onClick={() => setActiveTab('tracks')} />
                                    <TabButton label="Roadmaps" active={activeTab === 'roadmaps'} onClick={() => setActiveTab('roadmaps')} />
                                </div>
                            </Card>

                            {activeTab === 'profile' && (
                                <div className="grid grid-cols-1 2xl:grid-cols-[1.2fr,0.8fr] gap-6">
                                    <Card className="p-6 border-neutral-800 bg-neutral-900/60">
                                        <SectionTitle icon={<User size={18} className="text-indigo-400" />} title="Profile Snapshot" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                                            <DetailMetric label="Account Role" value={profile.role} />
                                            <DetailMetric label="Profile Status" value={profile.profile_completed ? 'Complete' : 'Incomplete'} />
                                            <DetailMetric label="Created Tracks" value={profile.created_tracks.length} />
                                            <DetailMetric label="Created Roadmaps" value={profile.created_roadmaps.length} />
                                            <DetailMetric label="Account Created" value={new Date(profile.created_at).toLocaleString()} />
                                            <DetailMetric label="Last Updated" value={new Date(profile.updated_at).toLocaleString()} />
                                        </div>
                                    </Card>

                                    <Card className="p-6 border-neutral-800 bg-neutral-900/60">
                                        <SectionTitle icon={<Clock3 size={18} className="text-sky-400" />} title="Quick Actions" />
                                        <div className="mt-5 space-y-3">
                                            <Button className="w-full justify-between" variant="secondary" onClick={() => setActiveTab('tracks')}>
                                                View Created Tracks <ArrowRight size={16} />
                                            </Button>
                                            <Button className="w-full justify-between" variant="secondary" onClick={() => setActiveTab('roadmaps')}>
                                                View Created Roadmaps <ArrowRight size={16} />
                                            </Button>
                                            {profile.resume && (
                                                <Button
                                                    className="w-full justify-between"
                                                    variant="secondary"
                                                    onClick={() => window.open(`${BASE_URL}${profile.resume}`, '_blank', 'noopener,noreferrer')}
                                                >
                                                    Open Resume <ArrowRight size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'tracks' && (
                                <AssetSection
                                    title="Created Tracks"
                                    icon={<BookOpen size={18} className="text-indigo-400" />}
                                    emptyMessage="This user hasn&apos;t created any tracks yet."
                                    count={profile.created_tracks.length}
                                >
                                    {profile.created_tracks.map((track) => (
                                        <button
                                            key={track.id}
                                            onClick={() => navigate(`/track/enroll/${track.id}`)}
                                            className="w-full text-left"
                                        >
                                            <Card className="p-6 border-neutral-800 bg-neutral-900/60 hover:border-indigo-500/30 hover:bg-neutral-900 transition-all">
                                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            <Badge variant={track.is_ai_generated ? 'indigo' : 'neutral'}>
                                                                {track.is_ai_generated ? 'AI Generated' : 'Custom'}
                                                            </Badge>
                                                            <Badge variant="neutral">Track</Badge>
                                                        </div>
                                                        <h4 className="text-xl font-bold text-white">{track.title}</h4>
                                                        <p className="text-neutral-400 mt-2 line-clamp-2">{track.description}</p>
                                                    </div>
                                                    <div className="text-sm text-neutral-400 lg:text-right shrink-0">
                                                        <p>{track.enrollment_count} enrolled learners</p>
                                                        <p className="mt-1">Created {new Date(track.created_at).toLocaleDateString()}</p>
                                                        <p className="mt-4 inline-flex items-center gap-2 text-indigo-300 font-semibold">
                                                            Open Track <ArrowRight size={15} />
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        </button>
                                    ))}
                                </AssetSection>
                            )}

                            {activeTab === 'roadmaps' && (
                                <AssetSection
                                    title="Created Roadmaps"
                                    icon={<Compass size={18} className="text-sky-400" />}
                                    emptyMessage="This user hasn&apos;t created any roadmaps yet."
                                    count={profile.created_roadmaps.length}
                                >
                                    {profile.created_roadmaps.map((roadmap) => (
                                        <button
                                            key={roadmap.id}
                                            onClick={() => navigate(`/roadmaps/${roadmap.id}`)}
                                            className="w-full text-left"
                                        >
                                            <Card className="p-6 border-neutral-800 bg-neutral-900/60 hover:border-sky-500/30 hover:bg-neutral-900 transition-all">
                                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            <Badge variant={roadmap.is_finalized ? 'success' : 'neutral'}>
                                                                {roadmap.is_finalized ? 'Finalized' : 'Draft'}
                                                            </Badge>
                                                            <Badge variant="neutral">Roadmap</Badge>
                                                        </div>
                                                        <h4 className="text-xl font-bold text-white">{roadmap.title}</h4>
                                                        <p className="text-neutral-400 mt-2 line-clamp-2">{roadmap.description}</p>
                                                    </div>
                                                    <div className="text-sm text-neutral-400 lg:text-right shrink-0">
                                                        <p>{roadmap.step_count} steps</p>
                                                        <p className="mt-1">{roadmap.enrollment_count} enrolled learners</p>
                                                        <p className="mt-1">Created {new Date(roadmap.created_at).toLocaleDateString()}</p>
                                                        <p className="mt-4 inline-flex items-center gap-2 text-sky-300 font-semibold">
                                                            Open Roadmap <ArrowRight size={15} />
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        </button>
                                    ))}
                                </AssetSection>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

function SummaryPanel({
    label,
    value,
    accent,
    compact = false,
}: {
    label: string;
    value: string | number;
    accent: 'indigo' | 'amber' | 'sky' | 'neutral';
    compact?: boolean;
}) {
    const accentStyles = {
        indigo: 'from-indigo-500/15 to-transparent text-indigo-300',
        amber: 'from-amber-500/15 to-transparent text-amber-300',
        sky: 'from-sky-500/15 to-transparent text-sky-300',
        neutral: 'from-white/5 to-transparent text-white',
    }[accent];

    return (
        <div className={`rounded-[1.5rem] border border-neutral-800 bg-gradient-to-br ${accentStyles} p-4 md:p-5`}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{label}</p>
            <p className={`mt-3 font-black text-white ${compact ? 'text-lg' : 'text-3xl'}`}>{value}</p>
        </div>
    );
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                active
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-neutral-950/70 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
            }`}
        >
            {label}
        </button>
    );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                active
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-neutral-950/70 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
            }`}
        >
            {label}
        </button>
    );
}

function UserSection({
    title,
    icon,
    users,
    selectedId,
    onSelect,
}: {
    title: string;
    icon: ReactNode;
    users: DirectoryUser[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    if (users.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                {icon}
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-bold">{title}</p>
                <span className="text-xs text-neutral-600">{users.length}</span>
            </div>

            {users.map((person) => (
                <button
                    key={person.id}
                    onClick={() => onSelect(person.id)}
                    className={`w-full text-left rounded-[1.5rem] border p-4 transition-all ${
                        selectedId === person.id
                            ? 'border-indigo-500/40 bg-indigo-500/10'
                            : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="font-bold text-white truncate">{person.full_name}</p>
                            <p className="text-xs text-neutral-500 mt-1 truncate">{person.email}</p>
                        </div>
                        <Badge variant={person.is_admin ? 'warning' : 'neutral'}>
                            {person.role}
                        </Badge>
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-neutral-400">
                        <span>{person.created_track_count} tracks</span>
                        <span>{person.created_roadmap_count} roadmaps</span>
                    </div>
                </button>
            ))}
        </div>
    );
}

function InfoPanel({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-[1.5rem] border border-neutral-800 bg-neutral-950/60 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 font-bold">
                {icon}
                {label}
            </div>
            <p className="mt-3 text-white break-words">{value}</p>
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
    );
}

function DetailMetric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-[1.25rem] border border-neutral-800 bg-neutral-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-bold">{label}</p>
            <p className="mt-3 text-white font-semibold">{value}</p>
        </div>
    );
}

function AssetSection({
    title,
    icon,
    count,
    emptyMessage,
    children,
}: {
    title: string;
    icon: ReactNode;
    count: number;
    emptyMessage: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4">
            <Card className="p-5 border-neutral-800 bg-neutral-900/70">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {icon}
                        <div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            <p className="text-sm text-neutral-500">Every card is clickable and opens the full content view.</p>
                        </div>
                    </div>
                    <Badge variant="neutral">{count}</Badge>
                </div>
            </Card>

            {count === 0 ? (
                <Card className="p-8 border-neutral-800 bg-neutral-900/60 text-neutral-500">
                    {emptyMessage}
                </Card>
            ) : (
                <div className="grid gap-4">{children}</div>
            )}
        </section>
    );
}

function EmptyBlock({ label }: { label: string }) {
    return (
        <div className="rounded-[1.5rem] border border-neutral-800 bg-neutral-950/50 p-5 text-sm text-neutral-500">
            {label}
        </div>
    );
}
