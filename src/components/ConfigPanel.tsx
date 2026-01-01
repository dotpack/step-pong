import React from 'react';
import { Settings, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { motion, AnimatePresence } from 'framer-motion';

export function ConfigPanel() {
    const { modelA, modelB, setModelA, setModelB, resetDialogue } = useAppStore();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 right-4 z-50 rounded-full bg-background/80 backdrop-blur-sm shadow-md hover:bg-background"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Settings className="h-5 w-5" />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="fixed inset-y-0 right-0 z-40 w-full md:w-[480px] bg-background border-l shadow-2xl overflow-y-auto"
                    >
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Configuration</h2>
                                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
                            </div>

                            <div className="grid gap-6">
                                {/* Model A Configuration */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Model A (The First Speaker)</CardTitle>
                                        <CardDescription>Configure the starting model</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Name</label>
                                            <Input
                                                value={modelA.name}
                                                onChange={(e) => setModelA({ ...modelA, name: e.target.value })}
                                                placeholder="e.g. Skeptic"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">API Endpoint</label>
                                            <Input
                                                value={modelA.endpoint}
                                                onChange={(e) => setModelA({ ...modelA, endpoint: e.target.value })}
                                                placeholder="https://api.openai.com/v1/chat/completions"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">API Key</label>
                                            <Input
                                                type="password"
                                                value={modelA.apiKey}
                                                onChange={(e) => setModelA({ ...modelA, apiKey: e.target.value })}
                                                placeholder="sk-..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Model Name</label>
                                            <Input
                                                value={modelA.model}
                                                onChange={(e) => setModelA({ ...modelA, model: e.target.value })}
                                                placeholder="gpt-3.5-turbo"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">System Prompt</label>
                                            <Textarea
                                                value={modelA.systemPrompt}
                                                onChange={(e) => setModelA({ ...modelA, systemPrompt: e.target.value })}
                                                rows={4}
                                                placeholder="You are..."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Model B Configuration */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Model B (The Responder)</CardTitle>
                                        <CardDescription>Configure the second model</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Name</label>
                                            <Input
                                                value={modelB.name}
                                                onChange={(e) => setModelB({ ...modelB, name: e.target.value })}
                                                placeholder="e.g. Optimist"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">API Endpoint</label>
                                            <Input
                                                value={modelB.endpoint}
                                                onChange={(e) => setModelB({ ...modelB, endpoint: e.target.value })}
                                                placeholder="https://api.openai.com/v1/chat/completions"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">API Key</label>
                                            <Input
                                                type="password"
                                                value={modelB.apiKey}
                                                onChange={(e) => setModelB({ ...modelB, apiKey: e.target.value })}
                                                placeholder="sk-..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Model Name</label>
                                            <Input
                                                value={modelB.model}
                                                onChange={(e) => setModelB({ ...modelB, model: e.target.value })}
                                                placeholder="gpt-3.5-turbo"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">System Prompt</label>
                                            <Textarea
                                                value={modelB.systemPrompt}
                                                onChange={(e) => setModelB({ ...modelB, systemPrompt: e.target.value })}
                                                rows={4}
                                                placeholder="You are..."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="pt-4 flex justify-end">
                                    <Button variant="destructive" onClick={() => {
                                        resetDialogue();
                                        setIsOpen(false);
                                    }} className="w-full">
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Reset Dialogue & Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
