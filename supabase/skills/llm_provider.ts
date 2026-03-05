// ============================================================
// MEUJURÍDICO.AI — LLM Provider (Seleção Manual)
// Camada universal de abstração de provedores de IA
//
// Provedores suportados:
//   - anthropic (Claude)
//   - openai    (GPT)
//   - gemini    (Google)
//
// REGRAS:
//   - SEM fallback automático
//   - Provider selecionado pelo admin via org_settings.llm_provider
//   - Se API key ausente → erro controlado, NUNCA troca de provider
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type LLMProvider = 'anthropic' | 'openai' | 'gemini';

export interface LLMMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface LLMCompletionRequest {
    provider: LLMProvider;            // OBRIGATÓRIO — selecionado pela org
    systemPrompt: string;
    messages: LLMMessage[];
    temperature?: number;             // default: 0.2
    maxTokens?: number;               // default: 4000
    model?: string;                   // override de modelo específico
}

export interface LLMCompletionResponse {
    text: string;
    parsed: Record<string, unknown>;
    provider: LLMProvider;
    model: string;
    tokens_used: {
        prompt: number;
        completion: number;
    };
    cost_usd: number;
    latency_ms: number;
}

// ─────────────────────────────────────────────
// Provider Config
// ─────────────────────────────────────────────

interface ProviderConfig {
    url: string;
    envKey: string;
    defaultModel: string;
    costPerInputToken: number;
    costPerOutputToken: number;
}

const PROVIDER_CONFIG: Record<LLMProvider, ProviderConfig> = {
    anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        envKey: 'ANTHROPIC_API_KEY',
        defaultModel: 'claude-sonnet-4-20250514',
        costPerInputToken: 0.000003,
        costPerOutputToken: 0.000015,
    },
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        envKey: 'OPENAI_API_KEY',
        defaultModel: 'gpt-4o',           // ← GPT-4o como modelo principal
        costPerInputToken: 0.0000025,
        costPerOutputToken: 0.00001,
    },
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models',
        envKey: 'GOOGLE_API_KEY',
        defaultModel: 'gemini-2.0-flash',
        costPerInputToken: 0.0000001,
        costPerOutputToken: 0.0000004,
    },
};

// ─────────────────────────────────────────────
// Leitura do provider da org (banco de dados)
// ─────────────────────────────────────────────

export async function getOrgProvider(
    supabase: ReturnType<typeof createClient>,
    orgId: string
): Promise<LLMProvider> {
    const { data, error } = await supabase
        .from('org_settings')
        .select('llm_provider')
        .eq('org_id', orgId)
        .single();

    if (error || !data?.llm_provider) {
        // Padrão: OpenAI GPT-4o quando não há configuração de org
        const envProvider = typeof Deno !== 'undefined'
            ? Deno.env.get('LLM_PROVIDER')?.toLowerCase()
            : undefined;

        if (envProvider === 'openai' || envProvider === 'gemini' || envProvider === 'anthropic') {
            return envProvider as LLMProvider;
        }

        return 'openai'; // ← Default fixo: OpenAI GPT-4o
    }

    const provider = data.llm_provider.toLowerCase();
    if (provider !== 'openai' && provider !== 'gemini' && provider !== 'anthropic') {
        throw new Error(
            `Provider "${data.llm_provider}" inválido. ` +
            `Valores aceitos: openai, gemini, anthropic.`
        );
    }

    return provider as LLMProvider;
}

// ─────────────────────────────────────────────
// Main: generateCompletion (SEM FALLBACK)
// ─────────────────────────────────────────────

export async function generateCompletion(
    request: LLMCompletionRequest
): Promise<LLMCompletionResponse> {

    const provider = request.provider;
    const config = PROVIDER_CONFIG[provider];

    // Validar API key — SEM FALLBACK, ABORTAR se ausente
    const apiKey = typeof Deno !== 'undefined'
        ? Deno.env.get(config.envKey)
        : undefined;

    if (!apiKey) {
        throw new ProviderNotConfiguredError(provider, config.envKey);
    }

    const model = request.model || config.defaultModel;
    const temperature = request.temperature ?? 0.2;
    const maxTokens = request.maxTokens ?? 4000;
    const startTime = Date.now();

    switch (provider) {
        case 'anthropic':
            return await callAnthropic(config, apiKey, model, request, temperature, maxTokens, startTime);
        case 'openai':
            return await callOpenAI(config, apiKey, model, request, temperature, maxTokens, startTime);
        case 'gemini':
            return await callGemini(config, apiKey, model, request, temperature, maxTokens, startTime);
        default:
            throw new Error(`Provider "${provider}" não suportado.`);
    }
}

// ─────────────────────────────────────────────
// Erro tipado: Provider não configurado
// ─────────────────────────────────────────────

export class ProviderNotConfiguredError extends Error {
    public readonly provider: LLMProvider;
    public readonly envKey: string;

    constructor(provider: LLMProvider, envKey: string) {
        super(
            `Provider "${provider}" não configurado. ` +
            `A variável de ambiente ${envKey} não está definida. ` +
            `Configure a chave API ou altere o provider em org_settings.llm_provider.`
        );
        this.name = 'ProviderNotConfiguredError';
        this.provider = provider;
        this.envKey = envKey;
    }
}

// ─────────────────────────────────────────────
// Provider: Anthropic (Claude)
// ─────────────────────────────────────────────

async function callAnthropic(
    config: ProviderConfig,
    apiKey: string,
    model: string,
    request: LLMCompletionRequest,
    temperature: number,
    maxTokens: number,
    startTime: number
): Promise<LLMCompletionResponse> {

    const response = await fetch(config.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature,
            system: request.systemPrompt,
            messages: request.messages.map(m => ({
                role: m.role,
                content: m.content,
            })),
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const latency_ms = Date.now() - startTime;
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    return {
        text,
        parsed: parseJSON(text),
        provider: 'anthropic',
        model,
        tokens_used: { prompt: inputTokens, completion: outputTokens },
        cost_usd: inputTokens * config.costPerInputToken + outputTokens * config.costPerOutputToken,
        latency_ms,
    };
}

// ─────────────────────────────────────────────
// Provider: OpenAI
// ─────────────────────────────────────────────

async function callOpenAI(
    config: ProviderConfig,
    apiKey: string,
    model: string,
    request: LLMCompletionRequest,
    temperature: number,
    maxTokens: number,
    startTime: number
): Promise<LLMCompletionResponse> {

    const messages = [
        { role: 'system', content: request.systemPrompt },
        ...request.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(config.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,                         // gpt-4o (configurado acima)
            max_tokens: maxTokens,
            temperature,
            messages,
            // Sem response_format: json_object — permite texto livre longo
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const latency_ms = Date.now() - startTime;
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;

    return {
        text,
        parsed: parseJSON(text),
        provider: 'openai',
        model,
        tokens_used: { prompt: inputTokens, completion: outputTokens },
        cost_usd: inputTokens * config.costPerInputToken + outputTokens * config.costPerOutputToken,
        latency_ms,
    };
}

// ─────────────────────────────────────────────
// Provider: Google Gemini
// ─────────────────────────────────────────────

async function callGemini(
    config: ProviderConfig,
    apiKey: string,
    model: string,
    request: LLMCompletionRequest,
    temperature: number,
    maxTokens: number,
    startTime: number
): Promise<LLMCompletionResponse> {

    const url = `${config.url}/${model}:generateContent?key=${apiKey}`;

    const contents = request.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: request.systemPrompt }] },
            contents,
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const latency_ms = Date.now() - startTime;
    const inputTokens = data.usageMetadata?.promptTokenCount || 0;
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

    return {
        text,
        parsed: parseJSON(text),
        provider: 'gemini',
        model,
        tokens_used: { prompt: inputTokens, completion: outputTokens },
        cost_usd: inputTokens * config.costPerInputToken + outputTokens * config.costPerOutputToken,
        latency_ms,
    };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parseJSON(text: string): Record<string, unknown> {
    try {
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) return JSON.parse(jsonMatch[1]);
        return JSON.parse(text);
    } catch {
        const objectMatch = text.match(/(\{[\s\S]*\})/);
        if (objectMatch) {
            try { return JSON.parse(objectMatch[1]); } catch { /* ignore */ }
        }
        return { raw_text: text };
    }
}

// ─────────────────────────────────────────────
// Utilities (para painel admin futuro)
// ─────────────────────────────────────────────

export function getAvailableProviders(): { provider: LLMProvider; configured: boolean; model: string }[] {
    return (['anthropic', 'openai', 'gemini'] as LLMProvider[]).map(p => ({
        provider: p,
        configured: typeof Deno !== 'undefined' ? !!Deno.env.get(PROVIDER_CONFIG[p].envKey) : false,
        model: PROVIDER_CONFIG[p].defaultModel,
    }));
}

export function getProviderConfig(provider: LLMProvider): { model: string; costPerInputToken: number; costPerOutputToken: number } {
    const config = PROVIDER_CONFIG[provider];
    return {
        model: config.defaultModel,
        costPerInputToken: config.costPerInputToken,
        costPerOutputToken: config.costPerOutputToken,
    };
}
