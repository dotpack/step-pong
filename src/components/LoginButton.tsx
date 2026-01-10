
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { LogIn, LogOut, User } from 'lucide-react';

export function LoginButton() {
    const { user, setUser } = useAppStore();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google', // You might want to make this configurable or support google etc
                options: {
                    redirectTo: window.location.href
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Error logging in with Supabase');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        console.log('Logging out...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            console.log('Logout successful');
            setUser(null); // Optimistic update, though listener should handle it
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Error logging out');
        }
    };

    if (user) {
        return (
            <div className="flex items-center justify-between p-2 border rounded-lg bg-sidebar-item hover:bg-sidebar-item-hover">
                <div className="flex items-center gap-2 overflow-hidden">
                    {user.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt={user.email}
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
                    <LogOut className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <Button
            className="w-full gap-2"
            variant="outline"
            onClick={handleLogin}
            disabled={loading}
        >
            <LogIn className="w-4 h-4" />
            {loading ? 'Connecting...' : 'Sign In to Sync'}
        </Button>
    );
}
