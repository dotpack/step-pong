import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Download, Upload, ChevronUp, ChevronDown, Terminal, Database, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { importState, sessions } = useAppStore();

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        const state = useAppStore.getState();
        const data = {
            modelA: state.modelA,
            modelB: state.modelB,
            sessions: state.sessions,
            activeSessionId: state.activeSessionId,
            exportedAt: new Date().toISOString(),
            version: 1
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `steppong_state_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const json = JSON.parse(content);

                // Basic validation
                if (!json.sessions || !Array.isArray(json.sessions)) {
                    throw new Error("Invalid state file: missing sessions");
                }

                // Remove metadata fields before importing
                const { exportedAt, version, ...stateToImport } = json;

                importState(stateToImport);

                // Clear input so same file can be selected again if needed
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                alert(`State imported successfully with ${json.sessions.length} sessions.`);
            } catch (err) {
                console.error("Import error:", err);
                alert("Failed to import state. Check console for details.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 font-mono text-xs select-none">
            {/* Expanded Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="bg-zinc-900/95 backdrop-blur-md border-t border-zinc-700 shadow-2xl overflow-hidden"
                    >
                        <div className="p-4 text-zinc-300 max-w-7xl mx-auto flex gap-8">
                            {/* State Actions */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mb-2">Persistence</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExport}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded border border-zinc-700 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Export JSON</span>
                                    </button>
                                    <button
                                        onClick={handleImportClick}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded border border-zinc-700 transition-colors"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Import JSON</span>
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-2">
                                <h3 className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mb-2">Statistics</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-zinc-400">
                                    <div className="flex justify-between gap-4">
                                        <span>Sessions:</span>
                                        <span className="text-zinc-100">{sessions.length}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span>Total Msgs:</span>
                                        <span className="text-zinc-100">{sessions.reduce((acc, s) => acc + s.messages.length, 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Persistent Bar */}
            <div
                className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 h-8 flex items-center justify-between px-4 cursor-pointer hover:bg-zinc-900 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="font-bold">DEBUG</span>
                    </div>

                    <div className="h-4 w-[1px] bg-zinc-800" />

                    <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Database className="w-3 h-3" />
                        <span>{sessions.length} sessions</span>
                    </div>

                    <div className="h-4 w-[1px] bg-zinc-800" />

                    <div className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Save className="w-3 h-3" />
                        <span>Local Storage Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 mr-2">v0.1.0</span>
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImport}
            />
        </div>
    );
}
