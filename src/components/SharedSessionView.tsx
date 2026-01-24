import { useRef, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getShareLink } from '../lib/utils';
import { ChevronRight, AlertCircle, Home, Link as LinkIcon, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/Button';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: number;
}

interface SharedContent {
    topic: string;
    messages: Message[];
}

const sessionCache = new Map<string, SharedContent>();
const pendingRequests = new Map<string, Promise<any>>();

export function SharedSessionView() {
    // Parse URL: #/share/<shareId>/[<currentMessageId>]
    const getParams = () => {
        const hash = window.location.hash;
        const parts = hash.split('/');
        // expected: ["#", "share", "shareId", "messageId"?]
        if (parts.length >= 3 && parts[1] === 'share') {
            return { shareId: parts[2], messageId: parts[3] };
        }
        return null;
    };

    const initialParams = getParams();
    const scrollRef = useRef<HTMLDivElement>(null);
    // Initialize with cache if available to avoid loading state logic flicker
    const [loading, setLoading] = useState(() => {
        if (!initialParams) return false;
        return !sessionCache.has(initialParams.shareId);
    });

    const [error, setError] = useState<string | null>(initialParams ? null : "Invalid shared link.");

    const [content, setContent] = useState<SharedContent | null>(() => {
        if (initialParams && sessionCache.has(initialParams.shareId)) {
            return sessionCache.get(initialParams.shareId)!;
        }
        return null;
    });

    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleCopyLink = (messageId: string) => {
        const params = getParams();
        if (params?.shareId) {
            const url = getShareLink(params.shareId, messageId);
            navigator.clipboard.writeText(url);
            setToastMessage("Link copied to clipboard!");
        }
    };

    const updateVisibleMessages = (fullContent: SharedContent, targetMessageId?: string) => {
        let index = -1;

        if (targetMessageId) {
            index = fullContent.messages.findIndex(m => m.id === targetMessageId);
        } else if (fullContent.messages.length > 0) {
            // Default to first message if no specific ID
            index = 0;
        }

        if (index !== -1) {
            setVisibleMessages(fullContent.messages.slice(0, index + 1));
        } else {
            // Fallback (shouldn't really happen if there are messages)
            setVisibleMessages(fullContent.messages);
        }
    };

    useEffect(() => {
        const params = getParams();
        if (!params) return;

        // Dedup logic: check cache first
        if (sessionCache.has(params.shareId)) {
            const data = sessionCache.get(params.shareId)!;
            setContent(data);
            updateVisibleMessages(data, params.messageId);
            setLoading(false);
            return;
        }

        const fetchSession = async () => {
            setLoading(true);

            try {
                let data;

                // Dedup logic: check pending requests
                if (pendingRequests.has(params.shareId)) {
                    data = await pendingRequests.get(params.shareId);
                } else {
                    const sbPromise = supabase
                        .from('shared_sessions')
                        .select('content')
                        .eq('id', params.shareId)
                        .single();

                    // Convert to standard promise to safely store in Map
                    const promise = Promise.resolve(sbPromise);

                    pendingRequests.set(params.shareId, promise);
                    data = await promise;
                    pendingRequests.delete(params.shareId);
                }

                if (data.error || !data.data) {
                    setError("Shared session not found.");
                    setLoading(false);
                    return;
                }

                const sharedContent = data.data.content as SharedContent;
                sessionCache.set(params.shareId, sharedContent);

                setContent(sharedContent);
                updateVisibleMessages(sharedContent, params.messageId);
            } catch (err) {
                console.error(err);
                setError("Failed to load session.");
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, []); // Only fetch once on mount? Or if shareId changes? Ideally shareId doesn't change often in one view session.

    // React to URL changes for navigation (messageId change)
    useEffect(() => {
        const handleHashChange = () => {
            const params = getParams();
            if (params && content) {
                updateVisibleMessages(content, params.messageId);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [content]);



    const handleNextTurn = () => {
        if (!content || visibleMessages.length === 0) return;

        const lastVisible = visibleMessages[visibleMessages.length - 1];
        const lastIndex = content.messages.findIndex(m => m.id === lastVisible.id);

        if (lastIndex !== -1 && lastIndex < content.messages.length - 1) {
            const nextMessage = content.messages[lastIndex + 1];
            const params = getParams();
            if (params) {
                // Now explicitly include the ID for the next step
                window.location.hash = `/share/${params.shareId}/${nextMessage.id}`;
            }
        }
    };

    const isAtEnd = !!(content && visibleMessages.length > 0 && visibleMessages.length === content.messages.length);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [visibleMessages]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading specific moment...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-destructive space-y-4">
                <AlertCircle className="w-12 h-12" />
                <p className="text-xl font-medium">{error}</p>
                <Button onClick={() => window.location.hash = ''} variant="outline">
                    <Home className="w-4 h-4 mr-2" /> Go Home
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative min-h-screen bg-background">
            <header className="w-full p-6 flex items-center justify-between border-b bg-background/50 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => window.location.hash = ''}>
                        <Home className="w-4 h-4 mr-2" /> StepPong
                    </Button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <h1 className="text-lg font-semibold truncate max-w-md">
                        {content?.topic}
                    </h1>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Read Only</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-8">
                <div className="max-w-3xl mx-auto w-full flex flex-col space-y-6 pb-32">
                    <AnimatePresence initial={false}>
                        {visibleMessages.map((msg) => {
                            // Determine alignment.
                            // In shared view, we don't have 'modelA' from store easily.
                            // We can infer from senderId or just alternate?
                            // Or better: Use the first sender as "Left" (Model A equivalent).
                            // A simple heuristic: first sender is "Left".
                            const isFirstSender = msg.senderId === content?.messages[0].senderId;

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className={cn(
                                        "flex w-full",
                                        isFirstSender ? "justify-start" : "justify-end"
                                    )}
                                >
                                    <div className={cn(
                                        "flex max-w-[85%] flex-col gap-2 rounded-2xl p-5 shadow-sm group relative",
                                        isFirstSender
                                            ? "bg-card rounded-tl-none border"
                                            : "bg-indigo-600 text-white rounded-tr-none"
                                    )}>
                                        <div className="flex items-center justify-between mb-1">

                                            <div className="flex items-center gap-2 text-xs font-semibold opacity-70">
                                                <span>{msg.senderName}</span>
                                                <span>•</span>
                                                <time dateTime={new Date(msg.timestamp).toISOString()}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyLink(msg.id);
                                                }}
                                                className={cn(
                                                    "p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all",
                                                    isFirstSender ? "hover:bg-black/10" : "hover:bg-white/20"
                                                )}
                                                title="Copy direct link to this message"
                                            >
                                                <LinkIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className={cn(
                                            "prose prose-sm max-w-none break-words leading-relaxed dark:prose-invert",
                                            !isFirstSender && "prose-headings:text-white prose-p:text-white prose-strong:text-white prose-ul:text-white prose-ol:text-white prose-code:text-white"
                                        )}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500 transition-colors" />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={scrollRef} />
                </div>
            </div>

            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        transition={{ duration: 0.3 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-foreground text-background rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Check className="w-4 h-4 text-green-500" />
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent pointer-events-none">
                <div className="max-w-3xl mx-auto flex justify-center pointer-events-auto">
                    <Button
                        size="lg"
                        onClick={handleNextTurn}
                        disabled={isAtEnd}
                        className={cn(
                            "shadow-lg transition-all",
                            isAtEnd ? "opacity-50" : "hover:scale-105"
                        )}
                    >
                        {isAtEnd ? "End of Snapshot" : "Next Turn"}
                        {!isAtEnd && <ChevronRight className="w-5 h-5 ml-2" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
