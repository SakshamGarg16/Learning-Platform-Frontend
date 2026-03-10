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
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    signup: (data: any) => Promise<void>;
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
        // Redirect to Django OIDC entry point (Old way)
        window.location.href = `${BASE_URL}/oidc/authenticate/`;
    };

    const loginWithCredentials = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await api.post('/auth/login/', { email, password });
            await checkAuthStatus();
        } catch (e: any) {
            console.error("Login failed", e);
            const detail = e.response?.data?.details || e.response?.data?.error || "Login failed";
            throw new Error(detail);
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: any) => {
        try {
            await api.post('/auth/signup/', data);
        } catch (e) {
            console.error("Signup failed", e);
            throw e;
        }
    };

    const logout = async () => {
        try {
            // Use our new API logout which clears the Django session
            await api.post('/auth/logout/');
            setUser(null);
            // Optionally redirect to login
            window.location.href = '/login';
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
            loginWithCredentials,
            signup,
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
