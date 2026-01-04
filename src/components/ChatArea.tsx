import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Sparkles, RotateCw, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ControlPanel } from './ControlPanel';

export function ChatArea() {
    const { messages, modelA, status, regenerateMessage } = useAppStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, status]);

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto px-4">
                <div className="max-w-3xl mx-auto w-full flex flex-col space-y-6 pb-32">
                    {messages.length === 0 && status === 'idle' && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 space-y-4">
                            <Sparkles className="w-16 h-16 mb-4" />
                            <p className="text-xl font-medium">Start a dialogue to see the magic happen</p>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                            const isModelA = msg.senderId === modelA.id;
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className={cn(
                                        "flex w-full",
                                        isModelA ? "justify-start" : "justify-end"
                                    )}
                                >
                                    <div className={cn(
                                        "flex max-w-[85%] flex-col gap-2 rounded-2xl p-5 shadow-sm group relative",
                                        isModelA
                                            ? "bg-card rounded-tl-none border"
                                            : "bg-indigo-600 text-white rounded-tr-none"
                                    )}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 text-xs font-semibold opacity-70">
                                                <span>{msg.senderName}</span>
                                                <span>•</span>
                                                <time dateTime={new Date(msg.timestamp).toISOString()}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {confirmResetId === msg.id ? (
                                                    <div className="flex items-center gap-1 bg-background/50 backdrop-blur rounded-full p-0.5 border shadow-sm animate-in fade-in slide-in-from-right-2 duration-200">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                regenerateMessage(msg.id);
                                                                setConfirmResetId(null);
                                                            }}
                                                            className="p-1 rounded-full hover:bg-green-500/20 text-green-500 transition-colors"
                                                            title="Confirm Regenerate"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setConfirmResetId(null);
                                                            }}
                                                            className="p-1 rounded-full hover:bg-red-500/20 text-red-500 transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmResetId(msg.id);
                                                        }}
                                                        className={cn(
                                                            "p-1 rounded-full hover:bg-black/10 transition-colors",
                                                            !isModelA && "hover:bg-white/20"
                                                        )}
                                                        title="Regenerate from here"
                                                    >
                                                        <RotateCw className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "prose prose-sm max-w-none break-words leading-relaxed dark:prose-invert",
                                            !isModelA && "prose-headings:text-white prose-p:text-white prose-strong:text-white prose-ul:text-white prose-ol:text-white prose-code:text-white"
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

                    {status === 'generating' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center py-4"
                        >
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-xs font-medium text-muted-foreground animate-pulse">
                                <Sparkles className="w-3 h-3" />
                                Thinking...
                            </div>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                            An error occurred. Check your configuration/API keys.
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>
            </div>
            <ControlPanel />
        </div>
    );
}
