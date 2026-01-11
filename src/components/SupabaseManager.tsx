import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function SupabaseManager() {
    const {
        setUser,
        setSyncStatus,
        setLastSynced,
        importSettings,
        endpoints,
        characters,
        modelA,
        modelB,
        user
    } = useAppStore();

    // Initial Auth Check & Listener
    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadSettings(session.user.id);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadSettings(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auto-sync
    useEffect(() => {
        if (!user) return;

        const syncSettings = async () => {
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

        const timeoutId = setTimeout(syncSettings, 2000); // Debounce 2s
        return () => clearTimeout(timeoutId);

    }, [endpoints, characters, modelA, modelB, user]);

    const loadSettings = async (userId: string) => {
        setSyncStatus('syncing');
        const { data, error } = await supabase
            .from('profiles')
            .select('settings')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading settings:', error);
            setSyncStatus('error');
        } else if (data && data.settings) {
            importSettings(data.settings);
            setSyncStatus('idle');
        } else {
            setSyncStatus('idle');
        }
    };

    return null; // This component handles logic only
}
