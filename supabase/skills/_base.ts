import { generateCompletion, type LLMProvider, type LLMCompletionRequest, type LLMCompletionResponse } from './llm_provider.ts';

// Adapter type required by the prompt
export interface LLMResult extends LLMCompletionResponse {
    rendered_content?: string;
    structured_data?: Record<string, unknown>;
    [key: string]: any;
}

export async function callLLM(opts: {
    system: string;
    user: string;
    max_tokens?: number;
    provider?: LLMProvider;
}): Promise<LLMResult> {
    const provider = opts.provider ?? 'anthropic';
    const request: LLMCompletionRequest = {
        provider,
        systemPrompt: opts.system,
        messages: [{ role: 'user', content: opts.user }],
        maxTokens: opts.max_tokens,
    };

    const response = await generateCompletion(request);
    
    // Adapt response to legacy skill format
    return {
        ...response,
        rendered_content: response.parsed?.rendered_content as string | undefined,
        structured_data: response.parsed?.structured_data as Record<string, unknown> | undefined,
    };
}

// Alias retrocompatível — não quebra nenhuma skill existente
export const callClaude = async (system: string, user: string, opts?: any): Promise<LLMResult> => {
    return callLLM({ system, user, ...opts, provider: 'anthropic' });
};
