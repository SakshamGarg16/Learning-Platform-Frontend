import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, BASE_URL } from '../lib/api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'operator' | 'admin';
    profileCompleted: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthStatus = async () => {
        try {
            const response = await api.get('/learners/me/');
            const data = response.data;
            setUser({
                id: data.id,
                name: data.full_name,
                email: data.email,
                role: data.is_admin ? 'admin' : 'operator',
                profileCompleted: data.profile_completed,
            });

            // Set the CSRF token for all future requests
            if (data.csrf_token) {
                api.defaults.headers.common['X-CSRFToken'] = data.csrf_token;
            }
        } catch (e) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = () => {
        // Redirect to Django OIDC entry point
        window.location.href = `${BASE_URL}/oidc/authenticate/`;
    };

    const logout = async () => {
        try {
            // Trigger Django Logout
            window.location.href = `${BASE_URL}/oidc/logout/`;
            setUser(null);
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

useAuth.Context = AuthContext;
