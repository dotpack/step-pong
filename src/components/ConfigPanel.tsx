import { useState } from 'react';
import { Settings, Plus, Trash2, Edit2, Play, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Endpoint, Character } from '../store/useAppStore';
import { testEndpointConnection, type TestResult, type LLMConfig } from '../lib/llm';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationDialog } from './ui/ConfirmationDialog';

export function ConfigPanel() {
    const {
        endpoints, characters,
        addEndpoint, updateEndpoint, deleteEndpoint,
        addCharacter, updateCharacter, deleteCharacter
    } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'endpoints' | 'characters'>('characters');
    const [itemToDelete, setItemToDelete] = useState<{ type: 'endpoint' | 'character', id: string } | null>(null);

    // New Item States
    const [newEndpoint, setNewEndpoint] = useState<Partial<Endpoint>>({});
    const [newCharacter, setNewCharacter] = useState<Partial<Character>>({});
    const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);
    const [isAddingCharacter, setIsAddingCharacter] = useState(false);

    // Editing States
    const [editingEndpointId, setEditingEndpointId] = useState<string | null>(null);
    const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
    const [editEndpointData, setEditEndpointData] = useState<Partial<Endpoint>>({});
    const [editCharacterData, setEditCharacterData] = useState<Partial<Character>>({});

    // Test States
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleTestConnection = async (data: Partial<Endpoint>) => {
        if (!data.url || !data.apiKey) return;

        setIsTesting(true);
        setTestResult(null);

        try {
            const config: LLMConfig = {
                id: 'test',
                name: 'Test',
                endpoint: data.url,
                apiKey: data.apiKey,
                model: data.model || 'gpt-3.5-turbo',
                systemPrompt: ''
            };

            const result = await testEndpointConnection(config);
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Test failed unexpectedly',
                latencyMs: 0
            });
        } finally {
            setIsTesting(false);
        }
    };

    // Endpoint Helpers
    const handleSaveNewEndpoint = () => {
        if (newEndpoint.name && newEndpoint.url) {
            addEndpoint({
                id: crypto.randomUUID(),
                name: newEndpoint.name,
                url: newEndpoint.url,
                apiKey: newEndpoint.apiKey || '',
                model: newEndpoint.model || 'gpt-3.5-turbo',
                createdAt: Date.now(),
            } as Endpoint);
            setNewEndpoint({});
            setIsAddingEndpoint(false);
        }
    };

    const startEditingEndpoint = (ep: Endpoint) => {
        setEditEndpointData({ ...ep });
        setEditingEndpointId(ep.id);
    };

    const saveEditingEndpoint = () => {
        if (editingEndpointId && editEndpointData.name && editEndpointData.url) {
            updateEndpoint(editingEndpointId, editEndpointData);
            setEditingEndpointId(null);
            setEditEndpointData({});
        }
    };

    const cancelEditingEndpoint = () => {
        setEditingEndpointId(null);
        setEditEndpointData({});
    };

    const handleDuplicateEndpoint = (ep: Endpoint) => {
        addEndpoint({
            ...ep,
            id: crypto.randomUUID(),
            name: `${ep.name} (Copy)`,
            createdAt: Date.now(),
        });
    };

    // Character Helpers
    const handleSaveNewCharacter = () => {
        if (newCharacter.name && newCharacter.endpointId) {
            addCharacter({
                id: crypto.randomUUID(),
                name: newCharacter.name,
                systemPrompt: newCharacter.systemPrompt || '',
                endpointId: newCharacter.endpointId,
                createdAt: Date.now(),
            } as Character);
            setNewCharacter({});
            setIsAddingCharacter(false);
        }
    };

    const startEditingCharacter = (char: Character) => {
        setEditCharacterData({ ...char });
        setEditingCharacterId(char.id);
    };

    const saveEditingCharacter = () => {
        if (editingCharacterId && editCharacterData.name && editCharacterData.endpointId) {
            updateCharacter(editingCharacterId, editCharacterData);
            setEditingCharacterId(null);
            setEditCharacterData({});
        }
    };

    const cancelEditingCharacter = () => {
        setEditingCharacterId(null);
        setEditCharacterData({});
    };

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
                        className="fixed inset-y-0 right-0 z-40 w-full md:w-[600px] bg-background border-l shadow-2xl overflow-y-auto"
                    >
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Configuration</h2>
                                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 border-b">
                                <Button
                                    variant={activeTab === 'characters' ? 'default' : 'ghost'}
                                    onClick={() => setActiveTab('characters')}
                                    className="rounded-b-none"
                                >
                                    Characters
                                </Button>
                                <Button
                                    variant={activeTab === 'endpoints' ? 'default' : 'ghost'}
                                    onClick={() => setActiveTab('endpoints')}
                                    className="rounded-b-none"
                                >
                                    Endpoints
                                </Button>
                            </div>

                            {activeTab === 'endpoints' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">API Endpoints</h3>
                                        <Button size="sm" onClick={() => setIsAddingEndpoint(true)} disabled={isAddingEndpoint}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Endpoint
                                        </Button>
                                    </div>

                                    {isAddingEndpoint && (
                                        <Card className="border-dashed border-2">
                                            <CardContent className="pt-6 space-y-3">
                                                <Input
                                                    placeholder="Name (e.g. OpenAI)"
                                                    value={newEndpoint.name || ''}
                                                    onChange={e => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="URL (e.g. https://openrouter.ai/api/v1/chat/completions)"
                                                    value={newEndpoint.url || ''}
                                                    onChange={e => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="API Key"
                                                    type="password"
                                                    value={newEndpoint.apiKey || ''}
                                                    onChange={e => setNewEndpoint({ ...newEndpoint, apiKey: e.target.value })}
                                                />
                                                <Input
                                                    placeholder="Model (e.g. gpt-4o)"
                                                    value={newEndpoint.model || ''}
                                                    onChange={e => setNewEndpoint({ ...newEndpoint, model: e.target.value })}
                                                />
                                                <div className="flex gap-2 justify-end items-center">
                                                    {testResult && (
                                                        <div className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
                                                            {testResult.success ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                            {testResult.success ? `${testResult.latencyMs}ms` : 'Error'}
                                                            {testResult.contextWindow && ` (${testResult.contextWindow} tokens)`}
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleTestConnection(newEndpoint)}
                                                        disabled={isTesting || !newEndpoint.url || !newEndpoint.apiKey}
                                                    >
                                                        {isTesting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                                                        Test
                                                    </Button>
                                                    <div className="w-px h-4 bg-border mx-1" />
                                                    <Button variant="ghost" size="sm" onClick={() => setIsAddingEndpoint(false)}>Cancel</Button>
                                                    <Button size="sm" onClick={handleSaveNewEndpoint}>Save</Button>
                                                </div>
                                                {testResult && !testResult.success && (
                                                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                                        {testResult.message}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {endpoints
                                        .sort((a, b) => b.createdAt - a.createdAt)
                                        .map(ep => (
                                            <Card key={ep.id} className="relative group">
                                                <CardContent className="pt-6">
                                                    {editingEndpointId === ep.id ? (
                                                        <div className="space-y-3">
                                                            <Input
                                                                placeholder="Name"
                                                                value={editEndpointData.name || ''}
                                                                onChange={e => setEditEndpointData({ ...editEndpointData, name: e.target.value })}
                                                            />
                                                            <Input
                                                                placeholder="URL"
                                                                value={editEndpointData.url || ''}
                                                                onChange={e => setEditEndpointData({ ...editEndpointData, url: e.target.value })}
                                                            />
                                                            <Input
                                                                placeholder="API Key"
                                                                type="password"
                                                                value={editEndpointData.apiKey || ''}
                                                                onChange={e => setEditEndpointData({ ...editEndpointData, apiKey: e.target.value })}
                                                            />
                                                            <Input
                                                                placeholder="Model"
                                                                value={editEndpointData.model || ''}
                                                                onChange={e => setEditEndpointData({ ...editEndpointData, model: e.target.value })}
                                                            />
                                                            <div className="flex gap-2 justify-end items-center">
                                                                {testResult && (
                                                                    <div className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
                                                                        {testResult.success ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                                        {testResult.success ? `${testResult.latencyMs}ms` : 'Error'}
                                                                        {testResult.contextWindow && ` (${testResult.contextWindow} tokens)`}
                                                                    </div>
                                                                )}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleTestConnection(editEndpointData)}
                                                                    disabled={isTesting || !editEndpointData.url || !editEndpointData.apiKey}
                                                                >
                                                                    {isTesting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                                                                    Test
                                                                </Button>
                                                                <div className="w-px h-4 bg-border mx-1" />
                                                                <Button variant="ghost" size="sm" onClick={cancelEditingEndpoint}>Cancel</Button>
                                                                <Button size="sm" onClick={saveEditingEndpoint}>Save</Button>
                                                            </div>
                                                            {testResult && !testResult.success && (
                                                                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                                                    {testResult.message}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold">{ep.name}</div>
                                                                <div className="text-sm text-muted-foreground">{ep.url}</div>
                                                                <div className="text-xs text-muted-foreground mt-1">Model: {ep.model}</div>
                                                            </div>
                                                            <div className="flex gap-1 opacity-100">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-muted"
                                                                    onClick={() => startEditingEndpoint(ep)}
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-muted"
                                                                    onClick={() => handleDuplicateEndpoint(ep)}
                                                                    title="Duplicate"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() => setItemToDelete({ type: 'endpoint', id: ep.id })}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}

                                    {endpoints.length === 0 && !isAddingEndpoint && (
                                        <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                                            No endpoints configured. Add one to get started.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'characters' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">Characters</h3>
                                        <Button size="sm" onClick={() => setIsAddingCharacter(true)} disabled={isAddingCharacter}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Character
                                        </Button>
                                    </div>

                                    {isAddingCharacter && (
                                        <Card className="border-dashed border-2">
                                            <CardContent className="pt-6 space-y-3">
                                                <Input
                                                    placeholder="Name (e.g. Yoda)"
                                                    value={newCharacter.name || ''}
                                                    onChange={e => setNewCharacter({ ...newCharacter, name: e.target.value })}
                                                />
                                                <Textarea
                                                    placeholder="System Prompt"
                                                    value={newCharacter.systemPrompt || ''}
                                                    onChange={e => setNewCharacter({ ...newCharacter, systemPrompt: e.target.value })}
                                                />
                                                <select
                                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                    value={newCharacter.endpointId || ''}
                                                    onChange={e => setNewCharacter({ ...newCharacter, endpointId: e.target.value })}
                                                >
                                                    <option value="" disabled>Select Endpoint...</option>
                                                    {endpoints.map(ep => (
                                                        <option key={ep.id} value={ep.id}>{ep.name} ({ep.model})</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="sm" onClick={() => setIsAddingCharacter(false)}>Cancel</Button>
                                                    <Button size="sm" onClick={handleSaveNewCharacter}>Save</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {characters
                                        .sort((a, b) => b.createdAt - a.createdAt)
                                        .map(char => {
                                            const linkedEndpoint = endpoints.find(e => e.id === char.endpointId);
                                            return (
                                                <Card key={char.id}>
                                                    <CardContent className="pt-6">
                                                        {editingCharacterId === char.id ? (
                                                            <div className="space-y-3">
                                                                <Input
                                                                    placeholder="Name"
                                                                    value={editCharacterData.name || ''}
                                                                    onChange={e => setEditCharacterData({ ...editCharacterData, name: e.target.value })}
                                                                />
                                                                <Textarea
                                                                    placeholder="System Prompt"
                                                                    value={editCharacterData.systemPrompt || ''}
                                                                    onChange={e => setEditCharacterData({ ...editCharacterData, systemPrompt: e.target.value })}
                                                                />
                                                                <select
                                                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                                    value={editCharacterData.endpointId || ''}
                                                                    onChange={e => setEditCharacterData({ ...editCharacterData, endpointId: e.target.value })}
                                                                >
                                                                    <option value="" disabled>Select Endpoint...</option>
                                                                    {endpoints.map(ep => (
                                                                        <option key={ep.id} value={ep.id}>{ep.name} ({ep.model})</option>
                                                                    ))}
                                                                </select>
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button variant="ghost" size="sm" onClick={cancelEditingCharacter}>Cancel</Button>
                                                                    <Button size="sm" onClick={saveEditingCharacter}>Save</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between items-start">
                                                                <div className="space-y-1">
                                                                    <div className="font-semibold">{char.name}</div>
                                                                    <div className="text-xs text-muted-foreground/80 line-clamp-2">{char.systemPrompt}</div>
                                                                    <div className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full inline-block mt-2">
                                                                        {linkedEndpoint ? `${linkedEndpoint.name}` : 'Unknown Endpoint'}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 hover:bg-muted"
                                                                        onClick={() => startEditingCharacter(char)}
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                                        onClick={() => setItemToDelete({ type: 'character', id: char.id })}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}

                                    {characters.length === 0 && !isAddingCharacter && (
                                        <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                                            No characters configured. Add one to see them here.
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmationDialog
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => {
                    if (itemToDelete) {
                        if (itemToDelete.type === 'endpoint') {
                            deleteEndpoint(itemToDelete.id);
                        } else {
                            deleteCharacter(itemToDelete.id);
                        }
                        setItemToDelete(null);
                    }
                }}
                title={`Delete ${itemToDelete?.type === 'endpoint' ? 'Endpoint' : 'Character'}`}
                description={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone.`}
            />
        </>
    );
}
