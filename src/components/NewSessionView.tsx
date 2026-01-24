import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent } from './ui/Card';
import { Dice5, ChevronRight } from 'lucide-react';

const SUGGESTED_TOPICS = [
    "Is AI consciousness possible?",
    "The ethics of genetic engineering",
    "Mars colonization: Hope or hype?",
    "The future of work in an automated world",
    "Should art be separated from the artist?"
];

export function NewSessionView() {
    const {
        startSessionWithFirstTurn, // Keeping for backup or if needed
        characters,
        selectCharacter,
        modelA,
        modelB
    } = useAppStore();

    const [topic, setTopic] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial default selection if nothing selected?
    // The store persists selection, so we just show what's there.
    // But if characters list is empty, we might show a warning.

    const handleStart = async () => {
        if (!topic.trim()) return;
        setIsSubmitting(true);

        // Use new deferred creation flow
        const sessionId = await startSessionWithFirstTurn(topic);

        if (sessionId) {
            window.location.hash = `/sessions/${sessionId}`;
        } else {
            setIsSubmitting(false);
        }
    };

    const handleRandomTopic = () => {
        const random = SUGGESTED_TOPICS[Math.floor(Math.random() * SUGGESTED_TOPICS.length)];
        setTopic(random);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 animate-in fade-in duration-500">
            <div className="max-w-2xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 leading-tight pb-2">
                        StepPong
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Orchestrate an infinite debate between two AI personas.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Speaker A */}
                    <Card className="border-indigo-500/20 bg-indigo-500/5">
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold text-indigo-600 dark:text-indigo-400">Speaker A</h3>
                            <select
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={characters.find(c => c.name === modelA.name)?.id || ''}
                                onChange={(e) => selectCharacter('modelA', e.target.value)}
                            >
                                <option value="" disabled>Select Character...</option>
                                {characters.map(char => (
                                    <option key={char.id} value={char.id}>{char.name}</option>
                                ))}
                            </select>
                            <div className="text-xs text-muted-foreground min-h-[3em]">
                                {modelA.systemPrompt.slice(0, 100)}...
                            </div>
                        </CardContent>
                    </Card>

                    {/* Speaker B */}
                    <Card className="border-purple-500/20 bg-purple-500/5">
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold text-purple-600 dark:text-purple-400">Speaker B</h3>
                            <select
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={characters.find(c => c.name === modelB.name)?.id || ''}
                                onChange={(e) => selectCharacter('modelB', e.target.value)}
                            >
                                <option value="" disabled>Select Character...</option>
                                {characters.map(char => (
                                    <option key={char.id} value={char.id}>{char.name}</option>
                                ))}
                            </select>
                            <div className="text-xs text-muted-foreground min-h-[3em]">
                                {modelB.systemPrompt.slice(0, 100)}...
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4 bg-card p-6 rounded-xl shadow-sm border">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Topic of Debate</label>
                        <Button variant="ghost" size="sm" onClick={handleRandomTopic} className="text-xs h-7">
                            <Dice5 className="w-3 h-3 mr-1" /> Random
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. Is it ethical to clone dinosaurs?"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="text-lg py-6"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                        />
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button
                        size="lg"
                        onClick={handleStart}
                        disabled={!topic.trim() || isSubmitting}
                        className="text-lg px-8 py-6 rounded-full shadow-lg hover:scale-105 transition-transform w-full md:w-auto"
                    >
                        {isSubmitting ? 'Initializing...' : 'Start Conversation'}
                        {!isSubmitting && <ChevronRight className="ml-2 w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
