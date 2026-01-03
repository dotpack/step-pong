import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMConfig, Message } from '../lib/llm';
import { generateResponse } from '../lib/llm';

interface DialogueItem {
    id: string;
    senderId: string; // 'modelA' or 'modelB'
    senderName: string;
    content: string;
    timestamp: number;
}

export interface Session {
    id: string;
    topic: string;
    messages: DialogueItem[];
    timestamp: number;
    preview: string;
}

interface AppState {
    // UI State
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;

    // Configuration
    modelA: LLMConfig;
    modelB: LLMConfig;
    setModelA: (config: LLMConfig) => void;
    setModelB: (config: LLMConfig) => void;

    // Dialogue State
    topic: string;
    setTopic: (topic: string) => void;
    messages: DialogueItem[];
    sessions: Session[];
    activeSessionId: string | null;
    status: 'idle' | 'generating' | 'paused' | 'error';
    nextTurn: 'modelA' | 'modelB';
    error: string | null;

    // Actions
    createSession: (topic?: string) => void;
    switchSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    updateSessionTitle: (sessionId: string, newTitle: string) => void; // For renaming if needed, or auto-update
    startDialogue: (initialTopic?: string) => Promise<void>;
    nextStep: () => Promise<void>;
    resetDialogue: () => void;
    importState: (state: Partial<AppState>) => void;
}

const DEFAULT_CONFIG_A: LLMConfig = {
    id: 'modelA',
    name: 'Model A (Skeptic)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are a skeptical philosopher. You question everything and look for logical fallacies. Keep your responses concise (under 50 words) and provocative.',
};

const DEFAULT_CONFIG_B: LLMConfig = {
    id: 'modelB',
    name: 'Model B (Optimist)',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are an eternal optimist. You see the good in everything and try to find constructive solutions. Keep your responses concise (under 50 words) and cheerful.',
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            isSidebarOpen: true,
            setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),

            modelA: DEFAULT_CONFIG_A,
            modelB: DEFAULT_CONFIG_B,
            setModelA: (config) => set({ modelA: config }),
            setModelB: (config) => set({ modelB: config }),

            topic: '',
            setTopic: (topic) => set({ topic }),
            messages: [],
            sessions: [],
            activeSessionId: null,
            status: 'idle',
            nextTurn: 'modelA',
            error: null,

            createSession: (initialTopic = 'New Conversation') => {
                const newSession: Session = {
                    id: crypto.randomUUID(),
                    topic: initialTopic,
                    messages: [],
                    timestamp: Date.now(),
                    preview: 'Empty conversation',
                };
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    activeSessionId: newSession.id,
                    messages: [],
                    topic: initialTopic,
                    status: 'idle',
                    error: null,
                    nextTurn: 'modelA'
                }));
            },

            switchSession: (sessionId) => {
                const { sessions } = get();
                const session = sessions.find((s) => s.id === sessionId);
                if (session) {
                    set({
                        activeSessionId: sessionId,
                        messages: session.messages,
                        topic: session.topic,
                        status: 'idle', // Reset status on switch
                        error: null,
                        nextTurn: session.messages.length > 0 && session.messages[session.messages.length - 1].senderId === get().modelA.id ? 'modelB' : 'modelA',
                    });
                }
            },

            deleteSession: (sessionId) => {
                set((state) => {
                    const newSessions = state.sessions.filter((s) => s.id !== sessionId);
                    // If deleting active session, switch to first available or reset
                    let newActiveId = state.activeSessionId;
                    let newMessages = state.messages;
                    let newTopic = state.topic;

                    if (state.activeSessionId === sessionId) {
                        if (newSessions.length > 0) {
                            newActiveId = newSessions[0].id;
                            newMessages = newSessions[0].messages;
                            newTopic = newSessions[0].topic;
                        } else {
                            newActiveId = null;
                            newMessages = [];
                            newTopic = '';
                        }
                    }

                    return {
                        sessions: newSessions,
                        activeSessionId: newActiveId,
                        messages: newMessages,
                        topic: newTopic,
                    };
                });
            },

            updateSessionTitle: (sessionId, newTitle) => {
                set((state) => ({
                    sessions: state.sessions.map(s => s.id === sessionId ? { ...s, topic: newTitle } : s),
                    topic: state.activeSessionId === sessionId ? newTitle : state.topic,
                }));
            },

            resetDialogue: () => {
                set({
                    messages: [],
                    status: 'idle',
                    nextTurn: 'modelA',
                    error: null,
                });
            },

            startDialogue: async (initialTopic) => {
                let { activeSessionId, createSession, topic, modelA } = get();

                // If no active session, create one
                if (!activeSessionId) {
                    createSession(initialTopic);
                    // Update refs after creation
                    const state = get();
                    activeSessionId = state.activeSessionId;
                } else if (initialTopic && initialTopic !== topic) {
                    // Update topic if provided and different
                    get().updateSessionTitle(activeSessionId!, initialTopic);
                }

                const currentTopic = initialTopic || get().topic;
                if (!currentTopic) return;

                set({ topic: currentTopic, status: 'generating', error: null });

                try {
                    // Model A starts the conversation based on the topic
                    const promptMessages: Message[] = [
                        { role: 'system', content: modelA.systemPrompt },
                        { role: 'user', content: `The topic is: "${currentTopic}". Start a conversation about this.` }
                    ];

                    const content = await generateResponse(modelA, promptMessages);

                    set(() => ({
                        messages: [
                            {
                                id: crypto.randomUUID(),
                                senderId: modelA.id,
                                senderName: modelA.name,
                                content,
                                timestamp: Date.now(),
                            },
                        ],
                        status: 'paused',
                        nextTurn: 'modelB',
                    }));

                    // Sync to session
                    set((state) => ({
                        sessions: state.sessions.map(s =>
                            s.id === state.activeSessionId
                                ? { ...s, messages: state.messages, preview: content.substring(0, 50) + '...' }
                                : s
                        )
                    }));
                } catch (error: any) {
                    set({ status: 'error', error: error.message });
                }
            },

            nextStep: async () => {
                const { modelA, modelB, messages, nextTurn } = get();
                if (get().status === 'generating') return;

                const activeModel = nextTurn === 'modelA' ? modelA : modelB;

                set({ status: 'generating', error: null });

                try {
                    // Construct conversation history for the active model
                    // We need to map the dialogue items to system/user/assistant format
                    // The "system" prompt is the active model's persona
                    // The "history" is the conversation so far. 
                    // Since we are simulating A <-> B, A's output is B's input (user) and vice versa.

                    const conversationHistory: Message[] = [
                        { role: 'system', content: activeModel.systemPrompt },
                    ];

                    // Add recent context (last 10 messages)
                    // Ideally we should format it so the model understands the dialogue flow.
                    // Option 1: Treat previous messages from other model as 'user', and own messages as 'assistant'.

                    messages.slice(-10).forEach(msg => {
                        if (msg.senderId === activeModel.id) {
                            conversationHistory.push({ role: 'assistant', content: msg.content });
                        } else {
                            conversationHistory.push({ role: 'user', content: msg.content });
                        }
                    });

                    const content = await generateResponse(activeModel, conversationHistory);

                    set((state) => ({
                        messages: [
                            ...state.messages,
                            {
                                id: crypto.randomUUID(),
                                senderId: activeModel.id,
                                senderName: activeModel.name,
                                content,
                                timestamp: Date.now(),
                            },
                        ],
                        status: 'paused',
                        nextTurn: nextTurn === 'modelA' ? 'modelB' : 'modelA',
                    }));

                    // Sync to session
                    set((state) => ({
                        sessions: state.sessions.map(s =>
                            s.id === state.activeSessionId
                                ? { ...s, messages: state.messages, preview: content.substring(0, 50) + '...' }
                                : s
                        )
                    }));
                } catch (error: any) {
                    set({ status: 'error', error: error.message });
                }
            },

            importState: (newState) => {
                set((state) => ({
                    ...state,
                    ...newState,
                }));
            },
        }),
        {
            name: 'llm-dialogue-storage',
            partialize: (state) => ({
                isSidebarOpen: state.isSidebarOpen,
                modelA: state.modelA,
                modelB: state.modelB,
                sessions: state.sessions,
                activeSessionId: state.activeSessionId
            }),
        }
    )
);
