import { useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatArea() {
    const { messages, modelA, status } = useAppStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, status]);

    if (messages.length === 0 && status === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-4">
                <Sparkles className="w-16 h-16 mb-4" />
                <p className="text-xl font-medium">Start a dialogue to see the magic happen</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6 pb-32 pt-8 px-4 max-w-3xl mx-auto w-full">
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
                                "flex max-w-[85%] flex-col gap-2 rounded-2xl p-5 shadow-sm",
                                isModelA
                                    ? "bg-card rounded-tl-none border"
                                    : "bg-indigo-600 text-white rounded-tr-none"
                            )}>
                                <div className="flex items-center gap-2 text-xs font-semibold opacity-70 mb-1">
                                    <span>{msg.senderName}</span>
                                    <span>•</span>
                                    <time dateTime={new Date(msg.timestamp).toISOString()}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
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
    );
}
