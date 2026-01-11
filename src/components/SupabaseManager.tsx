import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function SupabaseManager() {
    const {
        setUser,
        setSyncStatus,
        setLastSynced,
        importSettings,
        mergeSessions,
        endpoints,
        characters,
        modelA,
        modelB,
        sessions,
        user
    } = useAppStore();

    // Initial Auth Check & Listener
    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auto-sync Settings
    useEffect(() => {
        if (!user) return;

        const syncSettings = async () => {
            // ... existing syncSettings logic ...
            // We'll keep this separate or merge?
            // Let's keep separate for clarity/granularity, but we can reuse status.
            // Ideally we shouldn't overwrite status from one to another if they run parallel.
            // But for now simple is fine.
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
                console.error('Failed to sync settings:', err);
                setSyncStatus('error');
            }
        };

        const timeoutId = setTimeout(syncSettings, 2000); // Debounce 2s
        return () => clearTimeout(timeoutId);

    }, [endpoints, characters, modelA, modelB, user]); // Settings dependencies only

    // Auto-sync Sessions
    useEffect(() => {
        if (!user) return;

        // Strategy: We only want to push sessions that changed.
        // But tracking *which* changed is hard without a dirty flag.
        // `mergeSessions` helped us identify what to push on LOAD.
        // Continual updates: We can just upsert ALL sessions that are "dirty"?
        // Or just upsert ALL sessions? (Heavy if many)
        // Optimization: track `lastSynced` locally and only push `updatedAt > lastSynced`.

        // Actually, let's just piggyback on `loadUserData` pushing the diffs found during merge.
        // And then here we only push the *active* session if it changes?
        // Or iterate all and check `updatedAt > localLastPush`.

    }, [sessions, user]);

    // Revised Auto-sync Sessions Implementation
    // We'll use a local ref to track when we last pushed, and only push items newer than that.

    const loadUserData = async (userId: string) => {
        setSyncStatus('syncing');

        // 1. Load Settings
        const settingsPromise = supabase
            .from('profiles')
            .select('settings')
            .eq('id', userId)
            .single();

        // 2. Load Sessions
        const sessionsPromise = supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId);

        const [settingsRes, sessionsRes] = await Promise.all([settingsPromise, sessionsPromise]);

        // Handle Settings
        if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
            console.error('Error loading settings:', settingsRes.error);
        } else if (settingsRes.data?.settings) {
            importSettings(settingsRes.data.settings);
        }

        // Handle Sessions
        if (sessionsRes.error) {
            console.error('Error loading sessions:', sessionsRes.error);
        } else if (sessionsRes.data) {
            // Transform from DB format if needed (DB columns are snake_case?)
            // DB: id, content (jsonb), updated_at
            // Store: full session object. 
            // We stored `content` as the session JSON?
            // My design said `content jsonb`.

            const remoteSessions = sessionsRes.data.map((row: any) => ({
                ...row.content,
                // Ensure critical fields match DB reality just in case
                id: row.id,
                updatedAt: row.updated_at
            }));

            const toPush = mergeSessions(remoteSessions);

            if (toPush.length > 0) {
                await pushSessions(toPush);
            }
        }

        setSyncStatus('idle');
    };

    const pushSessions = async (sessionsToPush: any[]) => {
        if (!sessionsToPush.length || !user) return;

        const rows = sessionsToPush.map(s => {
            const updatedAt = s.updatedAt || Date.now();
            if (!s.updatedAt) {
                console.warn('Session missing updatedAt, using Date.now()', s.id);
            }
            return {
                id: s.id,
                user_id: user.id,
                content: { ...s, updatedAt }, // Ensure the JSON content also has it
                updated_at: updatedAt,
                created_at: new Date(s.timestamp || Date.now()).toISOString()
            };
        });

        const { error } = await supabase
            .from('sessions')
            .upsert(rows);

        if (error) console.error('Error pushing sessions:', error);
    };

    // Watch for session changes
    useEffect(() => {
        if (!user) return;

        const pushRecentSessions = async () => {
            const { sessions, activeSessionId } = useAppStore.getState();

            // 1. Always check Active Session
            const activeSession = sessions.find(s => s.id === activeSessionId);
            const sessionsToPush = [];

            if (activeSession) {
                sessionsToPush.push(activeSession);
            }

            // 2. Check other recent sessions (e.g. updated in last minute) to catch side-edits
            const now = Date.now();
            const RecentThreshold = 60 * 1000;

            sessions.forEach(s => {
                if (s.id !== activeSessionId && (now - s.updatedAt) < RecentThreshold) {
                    sessionsToPush.push(s);
                }
            });

            if (sessionsToPush.length > 0) {
                await pushSessions(sessionsToPush);
            }
        };

        // Debounce sync
        const timeoutId = setTimeout(() => {
            pushRecentSessions();
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [sessions, user]);

    return null;
}
