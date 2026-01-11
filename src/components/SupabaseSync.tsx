import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { LogIn, LogOut } from 'lucide-react';

interface SupabaseSyncProps {
    className?: string;
}

export function SupabaseSync({ className }: SupabaseSyncProps) {
    const {
        user,
        syncStatus,
        lastSynced,
        setSyncStatus,
        setLastSynced,
        endpoints,
        characters,
        modelA,
        modelB,
        // importSettings // No longer needed here, store handles loading
    } = useAppStore();

    // Manual sync function (still needed for the button click)
    // We could move this to the store but since it's an async operation using Supabase 
    // and we already have logic in Manager, maybe we should just expose a "triggerSync" in store?
    // For now, to avoid major refactor of Manager, I'll duplicate the MANUAL sync logic here? 
    // NO, that defeats the purpose.
    // Better: Add `performSync` to useAppStore or export it from Manager? 
    // Or just re-implement ONLY the manual trigger here?

    // Actually, if I add `performSync` to store, I can just call it.

    // Alternative: Just implement manual sync here, it's fine if it's just for the button.
    // BUT the Manager has the auto-sync.

    // Let's implement the manual sync here for now, it's safer than adding complex async logic to store in one go.
    // Wait, if I implement it here, it might conflict with auto-sync in Manager?
    // Not really, Supabase handles concurrent requests fine usually, and we debounce auto-sync.

    const handleManualSync = async () => {
        if (!user) return;
        setSyncStatus('syncing');
        try {
            const settings = {
                endpoints,
                characters,
                modelA,
                modelB
            };

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    settings,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            setSyncStatus('saved');
            setLastSynced(Date.now());
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to sync:', err);
            setSyncStatus('error');
        }
    };

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href.split('#')[0]
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Manager will detect the auth change and update user store
    };

    if (!user) {
        return (
            <Button variant="outline" size="sm" onClick={handleLogin} className={className}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign in
            </Button>
        );
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <button
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${syncStatus === 'syncing' ? 'bg-orange-400 animate-pulse' :
                        syncStatus === 'error' ? 'bg-destructive' :
                            'bg-green-500 hover:scale-125'
                    }`}
                title={syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Error syncing' : `Synced ${lastSynced ? new Date(lastSynced).toLocaleTimeString() : ''}`}
            />

            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                {user.user_metadata?.avatar_url && (
                    <img
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full shrink-0 border border-border"
                    />
                )}
                <div className="text-xs truncate text-muted-foreground" title={user.email}>
                    {user.email}
                </div>
            </div>

            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleLogout} title="Sign out">
                <LogOut className="w-3 h-3" />
            </Button>
        </div>
    );
}
