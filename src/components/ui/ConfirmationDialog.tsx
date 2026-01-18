import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Delete",
    cancelText = "Cancel"
}) => {
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small timeout to ensure animation/mounting is ready
            const timer = setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Dialog */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card w-full max-w-md rounded-lg shadow-lg border p-6 space-y-4"
                        >
                            <div className="flex items-center gap-3 text-destructive">
                                <div className="p-2 bg-destructive/10 rounded-full">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                            </div>

                            <p className="text-muted-foreground">
                                {description}
                            </p>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={onClose}>
                                    {cancelText}
                                </Button>
                                <Button
                                    ref={confirmButtonRef}
                                    variant="destructive"
                                    disabled={isLoading}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        try {
                                            await onConfirm();
                                            onClose();
                                        } catch (error) {
                                            console.error("Confirmation action failed", error);
                                        } finally {
                                            if (isOpen) setIsLoading(false); // Only update if still mounted/open
                                        }
                                    }}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                            {confirmText}
                                        </span>
                                    ) : confirmText}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
