import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { MessageSquare, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ConfirmationDialog } from './ui/ConfirmationDialog';
import { SupabaseSync } from './SupabaseSync';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const {
        sessions, activeSessionId, deleteSession
    } = useAppStore();
    const [deleteConfirmation, setDeleteConfirmation] = React.useState<string | null>(null);


    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                            onClick={onClose}
                        />

                        <motion.div
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-xl flex flex-col"
                        >
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="font-semibold text-lg">History</h2>
                                <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-4">
                                {/* New Chat button removed, replaced by Home landing page */}
                            </div>


                            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                                {sessions.length === 0 && (
                                    <div className="text-center text-muted-foreground text-sm py-8">
                                        No history yet. Start a conversation!
                                    </div>
                                )}
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border border-transparent",
                                            activeSessionId === session.id
                                                ? "bg-accent border-border"
                                                : "hover:bg-muted/50"
                                        )}
                                        onClick={() => {
                                            window.location.hash = `/sessions/${session.id}`;
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                    >
                                        <MessageSquare className={cn(
                                            "w-4 h-4 shrink-0",
                                            activeSessionId === session.id ? "text-primary" : "text-muted-foreground"
                                        )} />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="font-medium truncate text-sm">
                                                {session.topic || 'New Chat'}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {session.preview || 'No messages yet'}
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 h-6 w-6 ml-auto"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmation(session.id);
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 border-t space-y-4">
                                <SupabaseSync className="justify-center w-full" />
                                <div className="text-xs text-center text-muted-foreground">
                                    v1.2 • Cloud Sync
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <ConfirmationDialog
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={async () => {
                    if (deleteConfirmation) {
                        await deleteSession(deleteConfirmation);
                    }
                }}
                title="Delete Chat"
                description="Are you sure you want to delete this conversation? This action cannot be undone."
            />
        </>
    );
}
