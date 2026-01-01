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
