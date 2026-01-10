
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function SupabaseSync() {
    const {
        setUser,
        importState,
        endpoints,
        characters,
        modelA,
        modelB,
        sessions,
        activeSessionId,
        user
    } = useAppStore();

    // To prevent sync loops, we might need some refs or logic.
    // However, since we debounce, it might be fine.

    // Auth Listener
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setUser(session?.user ?? null);
                if (session?.user) {
                    await loadRemoteSettings(session.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                loadRemoteSettings(session.user.id);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadRemoteSettings = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('settings, updated_at')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine for new users
                console.error('Error fetching settings:', error);
                return;
            }

            if (data?.settings) {
                console.log('Remote settings found, importing...');
                importState(data.settings);
            }
        } catch (err) {
            console.error('Failed to load remote settings', err);
        }
    };

    // Save Settings Debounced
    // We only want to save specific parts of the state
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedState = useRef<string>('');

    useEffect(() => {
        if (!user) return;

        const currentState = {
            endpoints,
            characters,
            modelA,
            modelB,
            sessions,
            activeSessionId
        };

        const stateString = JSON.stringify(currentState);

        // Skip if unchanged
        if (stateString === lastSavedState.current) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(async () => {
            try {
                console.log('Saving settings to Supabase...');
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        settings: currentState,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                lastSavedState.current = stateString;
                console.log('Settings saved.');
            } catch (err) {
                console.error('Error saving settings:', err);
            }
        }, 2000); // Debounce for 2 seconds

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [user, endpoints, characters, modelA, modelB, sessions, activeSessionId]);

    return null; // Headless component
}
