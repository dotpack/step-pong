export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMConfig {
    id: string;
    name: string;
    endpoint: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
}

export async function generateResponse(
    config: LLMConfig,
    messages: Message[]
): Promise<string> {
    // Mock mode if no API key is provided
    if (!config.apiKey) {
        console.log(`[Mock LLM ${config.name}] Generating response for:`, messages);
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
        return `[Mock response from ${config.name}] I have received your message. The last message was: "${messages[messages.length - 1].content}". Let's continue **the discussion** on the topic.`;
    }

    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: messages,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LLM API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('LLM Generation Error:', error);
        throw error;
    }
}

export interface TestResult {
    success: boolean;
    message: string;
    model?: string;
    contextWindow?: number;
    latencyMs?: number;
}

export async function testEndpointConnection(config: LLMConfig): Promise<TestResult> {
    const start = Date.now();
    try {
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 1 // We just want to check connection
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${response.status} ${response.statusText} - ${errorText}`);
        }

        // If we got here, generation worked
        return {
            success: true,
            message: "Connection Verified (via Generation).",
            model: config.model,
            latencyMs: Date.now() - start
        };

    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Connection Failed",
            latencyMs: Date.now() - start
        };
    }
}
