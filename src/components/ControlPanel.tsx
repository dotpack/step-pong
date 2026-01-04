import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Play, SkipForward, RefreshCw, Dice5, Plus } from 'lucide-react';


export function ControlPanel() {
    const { startDialogue, nextStep, status, messages, topic, characters, selectCharacter, modelA, modelB, nextTurn } = useAppStore();
    const [inputTopic, setInputTopic] = useState('');

    // Helper to find selected char ID
    const selectedCharA = characters.find(c => c.name === modelA.name)?.id || '';
    const selectedCharB = characters.find(c => c.name === modelB.name)?.id || '';

    const handleStart = async () => {
        if (!inputTopic.trim()) return;
        await startDialogue(inputTopic);
    };

    const handleRandom = async () => {
        const topics = [
            "Is artificial intelligence capable of true creativity?",
            "The ethics of teleportation: is the traveler the same person?",
            "Cats vs Dogs: which is the superior companion?",
            "The simulation hypothesis: are we living in a computer?",
            "Pineapple on pizza: culinary genius or crime?",
            "The future of space exploration: Mars or Europa?",
        ];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        setInputTopic(randomTopic);
        await startDialogue(randomTopic);
    };

    const isStarted = messages.length > 0;
    const isGenerating = status === 'generating';

    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-10 print:hidden">
            <div className="max-w-3xl mx-auto flex flex-col gap-4">

                {/* Participant Selectors - Always Visible */}
                <div className="flex gap-4 justify-center bg-card/60 backdrop-blur-sm border rounded-lg p-2 shadow-sm w-fit mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[100px] sm:max-w-none truncate"
                            value={selectedCharA}
                            onChange={(e) => {
                                if (e.target.value) selectCharacter('modelA', e.target.value);
                            }}
                            title="Speaker A"
                        >
                            <option value="" disabled>Select Character...</option>
                            {characters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <span className="text-muted-foreground/40">vs</span>
                    <div className="flex items-center gap-2">
                        <select
                            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-right max-w-[100px] sm:max-w-none truncate"
                            value={selectedCharB}
                            onChange={(e) => {
                                if (e.target.value) selectCharacter('modelB', e.target.value);
                            }}
                            title="Speaker B"
                        >
                            <option value="" disabled>Select Character...</option>
                            {characters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-card/80 backdrop-blur-md border rounded-2xl p-2 shadow-2xl flex items-center gap-2 w-full">
                    {!isStarted ? (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleRandom}
                                title="Random Topic"
                                className="shrink-0"
                            >
                                <Dice5 className="w-5 h-5" />
                            </Button>
                            <Input
                                value={inputTopic}
                                onChange={(e) => setInputTopic(e.target.value)}
                                placeholder="Enter a topic to discuss..."
                                className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-base"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleStart();
                                }}
                            />
                            <Button
                                onClick={handleStart}
                                disabled={!inputTopic.trim() || isGenerating}
                                className="shrink-0"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Start
                            </Button>
                        </>
                    ) : (
                        <div className="flex w-full items-center justify-between px-2">
                            <div className="flex flex-col overflow-hidden mr-4">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Topic</span>
                                <span className="text-sm font-semibold truncate" title={topic}>{topic}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setInputTopic('');
                                        useAppStore.getState().createSession();
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Chat
                                </Button>
                                <Button
                                    onClick={nextStep}
                                    disabled={isGenerating || (nextTurn === 'modelA' ? !selectedCharA : !selectedCharB)}
                                    className="min-w-[120px]"
                                    variant="premium"
                                    title={
                                        (nextTurn === 'modelA' && !selectedCharA) ? "Select Character A to continue" :
                                            (nextTurn === 'modelB' && !selectedCharB) ? "Select Character B to continue" :
                                                "Next Turn"
                                    }
                                >
                                    {isGenerating ? (
                                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <SkipForward className="w-4 h-4 mr-2" />
                                    )}
                                    Next Turn
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
