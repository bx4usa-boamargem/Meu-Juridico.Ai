/**
 * DFD Template Engine — Modelo SEI
 * Renders structured data into a formal HTML document with 9 blocks.
 */

const DFD_TEMPLATE = `
<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
  <!-- Header -->
  <div style="text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">{{orgao}}</p>
    <h1 style="font-size: 18px; font-weight: bold; margin: 12px 0 4px;">DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA</h1>
    <p style="font-size: 12px; margin: 0;">Processo nº {{numero_processo}}</p>
  </div>

  <!-- BLOCO 1 — Área Requisitante -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 1 — ÁREA REQUISITANTE</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">Área Demandante</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{area_demandante}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Setor Demandante</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{setor_demandante}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Responsável</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{responsavel}}</td>
    </tr>
  </table>

  <!-- BLOCO 2 — Identificação da Demanda -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 2 — IDENTIFICAÇÃO DA DEMANDA</h2>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">2.1 Objeto da Contratação</h3>
  <p style="font-size: 13px; text-align: justify;">{{objeto_contratacao}}</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">Categoria</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{categoria}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Modalidade</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{modalidade}}</td>
    </tr>
  </table>

  <!-- BLOCO 3 — Justificativa -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 3 — JUSTIFICATIVA DA CONTRATAÇÃO</h2>
  <p style="font-size: 13px; text-align: justify;">{{justificativa_contratacao}}</p>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">3.1 Descrição da Necessidade</h3>
  <p style="font-size: 13px; text-align: justify;">{{necessidade}}</p>

  <!-- BLOCO 4 — Resultados Pretendidos -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 4 — RESULTADOS PRETENDIDOS</h2>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">4.1 Problema Público Identificado</h3>
  <p style="font-size: 13px; text-align: justify;">{{problema_publico}}</p>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">4.2 Impacto Esperado</h3>
  <p style="font-size: 13px; text-align: justify;">{{impacto_esperado}}</p>

  <!-- BLOCO 5 — Alinhamento Estratégico -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 5 — ALINHAMENTO ESTRATÉGICO</h2>
  <p style="font-size: 13px; text-align: justify;">{{alinhamento_estrategico}}</p>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">5.1 Fundamento Legal</h3>
  <p style="font-size: 13px; text-align: justify;">{{fundamento_legal}}</p>

  <!-- BLOCO 6 — Estimativa de Quantidades -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 6 — ESTIMATIVA DE QUANTIDADES</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">Descrição dos Itens</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{descricao_itens}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Quantidade Estimada</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{quantidade}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Unidade de Medida</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{unidade_medida}}</td>
    </tr>
  </table>

  <!-- BLOCO 7 — Classificação do Objeto -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 7 — CLASSIFICAÇÃO DO OBJETO</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">Valor Estimado (R$)</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{valor_estimado}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Prioridade</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{prioridade}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Prazo de Entrega</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{prazo_entrega}}</td>
    </tr>
  </table>

  <!-- BLOCO 8 — Recursos Orçamentários -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 8 — RECURSOS ORÇAMENTÁRIOS</h2>
  {{#observacoes}}
  <p style="font-size: 13px; text-align: justify;">{{observacoes}}</p>
  {{/observacoes}}
  {{^observacoes}}
  <p style="font-size: 13px; text-align: justify; color: #999;">A informar.</p>
  {{/observacoes}}

  <!-- BLOCO 9 — Encaminhamento ao ETP -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">BLOCO 9 — RESPONSÁVEIS E ENCAMINHAMENTO</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">Responsável Técnico</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{responsavel_tecnico}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Fiscal do Contrato</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{fiscal_contrato}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Ordenador de Despesa</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{ordenador_despesa}}</td>
    </tr>
  </table>

  <!-- Footer -->
  <div style="margin-top: 48px; border-top: 1px solid #ccc; padding-top: 16px; text-align: center;">
    <p style="font-size: 11px; color: #666;">Documento gerado eletronicamente em {{data_geracao}}</p>
  </div>
</div>
`;

export function renderDfdTemplate(
  dados: Record<string, any>,
  processo?: Record<string, any>
): string {
  const merged: Record<string, string> = {};

  if (processo) {
    for (const [k, v] of Object.entries(processo)) {
      if (v) merged[k] = String(v);
    }
  }

  for (const [k, v] of Object.entries(dados)) {
    if (v && k !== "meta" && k !== "conteudo_final") {
      merged[k] = String(v);
    }
  }

  merged.data_geracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Handle conditional blocks {{#key}}...{{/key}} and {{^key}}...{{/key}}
  let html = DFD_TEMPLATE.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => {
      const val = merged[key];
      return val && val.trim() ? content : "";
    }
  );

  html = html.replace(
    /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => {
      const val = merged[key];
      return !val || !val.trim() ? content : "";
    }
  );

  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return merged[key] ?? "—";
  });

  return html;
}
