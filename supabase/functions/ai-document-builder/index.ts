import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_MODEL = "google/gemini-3-flash-preview";
const FALLBACK_MODEL = "google/gemini-2.5-flash";

interface FieldResult {
  valor: string;
  confianca: "alta" | "media" | "baixa";
  fontes: string[];
  sugestao_melhoria: string;
}

interface SectionResult {
  secao_id: string;
  campos: Record<string, FieldResult>;
  alertas_aplicaveis: Array<{
    titulo: string;
    fonte: string;
    impacto: string;
    url: string | null;
    severidade: string;
  }>;
}

async function callAI(apiKey: string, model: string, systemPrompt: string, userContent: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const t = await response.text();
      console.error(`AI error (${model}):`, response.status, t);
      return null;
    }
    const result = await response.json();
    return result.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    clearTimeout(timeout);
    console.error(`AI call failed (${model}):`, e);
    return null;
  }
}

async function getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ input: text.slice(0, 2000), model: "text-embedding-3-small" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

// Section definitions per doc type
const DOC_SECTIONS: Record<string, Array<{ id: string; label: string; fields: string[]; instructions: string }>> = {
  dfd: [
    { id: "buscar_objeto", label: "Buscar Objeto", fields: ["objeto_contratacao"], instructions: "Objeto detalhado da contratação" },
    { id: "contexto_contratacao", label: "Contexto da Contratação", fields: ["problema_publico", "area_demandante", "impacto_esperado", "publico_beneficiado"], instructions: "Contexto, problema público, área demandante e impacto esperado" },
    { id: "alinhamento_estrategico", label: "Alinhamento Estratégico", fields: ["alinhamento_estrategico", "fundamento_legal", "plano_anual_contratacoes", "politica_publica_relacionada"], instructions: "Alinhamento com PPA/LOA/LDO, fundamento legal e políticas públicas" },
    { id: "informacoes_gerais", label: "Informações Gerais", fields: ["categoria", "setor_demandante", "responsavel", "descricao_sucinta_objeto"], instructions: "Categoria (bens/serviços/obras), setor demandante" },
    { id: "justificativa", label: "Justificativa", fields: ["justificativa_contratacao", "necessidade"], instructions: "Justificativa detalhada e descrição da necessidade com fundamentação legal" },
    { id: "materiais_servicos", label: "Materiais / Serviços", fields: ["descricao_itens", "quantidade", "unidade_medida", "valor_estimado"], instructions: "Descrição dos itens, quantidades e valores estimados" },
    { id: "responsaveis", label: "Responsáveis", fields: ["responsavel_tecnico", "fiscal_contrato", "ordenador_despesa"], instructions: "Responsável técnico e fiscal do contrato" },
  ],
  etp: [
    { id: "informacoes_basicas_etp", label: "Informações Básicas", fields: ["registro_preco", "valor_global"], instructions: "Se é registro de preço e como o valor global será computado" },
    { id: "necessidades", label: "Descrição das Necessidades", fields: ["descricao_necessidade"], instructions: "Necessidades da contratação conforme Art. 18 da Lei 14.133/2021" },
    { id: "solucao", label: "Solução", fields: ["descricao_solucao", "sobre_opcao"], instructions: "Solução de mercado escolhida e justificativa da opção" },
    { id: "requisitos", label: "Requisitos", fields: ["requisitos_contratacao"], instructions: "Requisitos técnicos e necessidades institucionais" },
  ],
  tr: [
    { id: "objeto", label: "Definição do Objeto", fields: ["objeto_contratacao", "natureza_objeto", "justificativa_contratacao"], instructions: "Objeto, natureza e justificativa da contratação" },
    { id: "especificacoes", label: "Especificações Técnicas", fields: ["especificacoes_tecnicas", "requisitos_tecnicos", "padroes_qualidade"], instructions: "Especificações técnicas detalhadas, requisitos obrigatórios e padrões de qualidade" },
    { id: "execucao", label: "Condições de Execução", fields: ["prazo_execucao", "local_execucao", "condicoes_recebimento", "criterios_aceitacao"], instructions: "Prazos, local, condições de recebimento" },
    { id: "obrigacoes", label: "Obrigações das Partes", fields: ["obrigacoes_contratante", "obrigacoes_contratada"], instructions: "Obrigações da contratante e contratada" },
    { id: "penalidades", label: "Penalidades e Sanções", fields: ["penalidades", "sancoes"], instructions: "Penalidades aplicáveis e sanções administrativas" },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objeto, doc_type, orgao, processo_id } = await req.json();

    if (!objeto || objeto.length < 5) {
      return new Response(JSON.stringify({ error: "Objeto muito curto" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const docType = doc_type ?? "dfd";
    const sections = DOC_SECTIONS[docType] ?? DOC_SECTIONS.dfd;

    // ── Parallel context gathering ─────────────────────────────────
    const [ragResult, alertsResult, processoResult] = await Promise.all([
      // Consulta A: RAG - knowledge base
      (async () => {
        try {
          const { data: orgSettings } = await supabase
            .from("org_settings").select("org_id").limit(1).maybeSingle();
          if (!orgSettings?.org_id) return "";

          const embedding = await getEmbedding(objeto, LOVABLE_API_KEY);
          if (!embedding) return "";

          const { data: chunks } = await supabase.rpc("match_knowledge_chunks", {
            p_org_id: orgSettings.org_id,
            p_embedding: JSON.stringify(embedding),
            p_match_threshold: 0.45,
            p_match_count: 8,
            p_doc_types: null,
          });
          if (!chunks?.length) return "";
          return chunks.map((c: any) =>
            `[${c.doc_title}] (similaridade: ${(c.similarity * 100).toFixed(0)}%): ${String(c.content_text).substring(0, 800)}`
          ).join("\n\n");
        } catch (e) {
          console.warn("RAG error:", e);
          return "";
        }
      })(),

      // Consulta B: Monitoring alerts
      (async () => {
        try {
          const { data: alerts } = await supabase.rpc("get_alertas_documento", { p_doc_type: docType });
          if (!alerts?.length) return [];
          return alerts.slice(0, 10).map((a: any) => ({
            titulo: a.title,
            fonte: a.source,
            impacto: a.impact_analysis ?? a.summary ?? "",
            url: a.source_url,
            severidade: a.severity,
            resumo: a.summary,
          }));
        } catch (e) {
          console.warn("Alerts error:", e);
          return [];
        }
      })(),

      // Consulta C: Processo data
      (async () => {
        if (!processo_id) return null;
        try {
          const { data } = await supabase
            .from("processos")
            .select("objeto, orgao, modalidade, numero_processo")
            .eq("id", processo_id)
            .single();
          return data;
        } catch {
          return null;
        }
      })(),
    ]);

    const processoOrgao = orgao ?? processoResult?.orgao ?? "não informado";
    const processoModalidade = processoResult?.modalidade ?? "a definir";

    // ── Build context block ────────────────────────────────────────
    let contextBlock = "";
    if (ragResult) {
      contextBlock += `\n## BASE DE CONHECIMENTO INSTITUCIONAL (RAG)\n${ragResult}\n`;
    }
    if (alertsResult.length > 0) {
      contextBlock += `\n## ALERTAS NORMATIVOS ATIVOS\n`;
      for (const a of alertsResult) {
        contextBlock += `- [${a.severidade.toUpperCase()}] ${a.titulo} (Fonte: ${a.fonte})\n  Impacto: ${a.impacto?.substring(0, 300) ?? "N/A"}\n`;
      }
    }

    // ── Generate all sections ──────────────────────────────────────
    const allFields = sections.flatMap(s => s.fields);
    const fieldsSchema = allFields.map(f => `"${f}": { "valor": "string", "confianca": "alta|media|baixa", "fontes": ["string"], "sugestao_melhoria": "string" }`).join(",\n  ");

    const systemPrompt = `Você é um agente especialista em contratações públicas brasileiras (Lei 14.133/2021, Lei 8.666/1993, IN SEGES/MP).

Seu trabalho é PREENCHER AUTOMATICAMENTE todos os campos de um ${docType.toUpperCase()} com base no objeto da contratação informado pelo usuário.

## CONTEXTO DO PROCESSO
- Objeto: ${objeto}
- Órgão: ${processoOrgao}
- Modalidade: ${processoModalidade}
- Nº Processo: ${processoResult?.numero_processo ?? "N/A"}
${contextBlock}

## INSTRUÇÕES POR SEÇÃO
${sections.map(s => `### ${s.label}\nCampos: ${s.fields.join(", ")}\n${s.instructions}`).join("\n\n")}

## REGRAS OBRIGATÓRIAS
1. Use linguagem técnica da administração pública brasileira
2. Cite artigos específicos da Lei 14.133/2021 quando relevante
3. Se houver alertas normativos acima, INCORPORE-OS nos campos relevantes
4. Se houver dados do RAG, USE-OS como referência
5. Para cada campo, avalie a confiança:
   - "alta": baseado em dados concretos ou legislação clara
   - "media": inferido com razoável certeza
   - "baixa": sugestão genérica que o usuário deve revisar
6. Em "fontes", liste as normas/acórdãos usados (ex: "Art. 29, Lei 14.133/2021", "Acórdão TCU 1234/2024")
7. Em "sugestao_melhoria", diga o que o usuário pode aprimorar
8. NÃO invente valores numéricos (preços, quantidades) — use "A definir pelo órgão"
9. Campos como "responsavel_tecnico", "fiscal_contrato" devem ter confiança "baixa" com valor sugerindo preenchimento manual

Retorne APENAS um JSON válido com esta estrutura exata:
{
  ${fieldsSchema}
}

NÃO inclua texto fora do JSON. NÃO use markdown code fences.`;

    const userContent = `Preencha TODOS os campos do ${docType.toUpperCase()} para o objeto: "${objeto}"`;

    let rawText = await callAI(LOVABLE_API_KEY, PRIMARY_MODEL, systemPrompt, userContent);
    if (!rawText) {
      console.log(`Fallback: ${PRIMARY_MODEL} → ${FALLBACK_MODEL}`);
      rawText = await callAI(LOVABLE_API_KEY, FALLBACK_MODEL, systemPrompt, userContent);
    }

    if (!rawText) {
      return new Response(JSON.stringify({ error: "Falha ao gerar documento" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse response
    const cleaned = rawText.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned.slice(0, 500));
      // Try to extract JSON from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return new Response(JSON.stringify({ error: "Resposta da IA não é JSON válido" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: "Resposta da IA não é JSON válido" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build section results
    const sectionResults: SectionResult[] = sections.map(section => {
      const campos: Record<string, FieldResult> = {};
      for (const fieldId of section.fields) {
        const fieldData = parsed[fieldId];
        if (fieldData && typeof fieldData === "object" && fieldData.valor) {
          campos[fieldId] = {
            valor: fieldData.valor,
            confianca: fieldData.confianca ?? "media",
            fontes: Array.isArray(fieldData.fontes) ? fieldData.fontes : [],
            sugestao_melhoria: fieldData.sugestao_melhoria ?? "",
          };
        } else if (fieldData && typeof fieldData === "string") {
          // Fallback: AI returned plain string instead of object
          campos[fieldId] = {
            valor: fieldData,
            confianca: "media",
            fontes: [],
            sugestao_melhoria: "",
          };
        }
      }

      // Find alerts relevant to this section
      const sectionAlerts = alertsResult
        .filter((a: any) => {
          const text = `${a.titulo} ${a.impacto}`.toLowerCase();
          return section.fields.some(f => text.includes(f.replace(/_/g, " "))) ||
            text.includes(section.label.toLowerCase());
        })
        .slice(0, 3);

      return {
        secao_id: section.id,
        campos,
        alertas_aplicaveis: sectionAlerts,
      };
    });

    // Flatten campos for simple consumption
    const camposPreenchidos: Record<string, any> = {};
    const camposMeta: Record<string, { confianca: string; fontes: string[]; sugestao: string }> = {};

    for (const section of sectionResults) {
      for (const [fieldId, fieldData] of Object.entries(section.campos)) {
        if (fieldData.valor) {
          camposPreenchidos[fieldId] = fieldData.valor;
          camposMeta[fieldId] = {
            confianca: fieldData.confianca,
            fontes: fieldData.fontes,
            sugestao: fieldData.sugestao_melhoria,
          };
        }
      }
    }

    return new Response(JSON.stringify({
      sections: sectionResults,
      campos_preenchidos: camposPreenchidos,
      campos_meta: camposMeta,
      alertas_globais: alertsResult,
      contexto: {
        rag_encontrado: !!ragResult,
        alertas_encontrados: alertsResult.length,
        modelo_usado: rawText ? PRIMARY_MODEL : FALLBACK_MODEL,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-document-builder error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
