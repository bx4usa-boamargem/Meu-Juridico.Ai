/**
 * ETP Template Engine — Modelo SEI
 * Renders structured data into a formal HTML document for Estudo Técnico Preliminar.
 */

const ETP_TEMPLATE = `
<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
  <!-- Header -->
  <div style="text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">{{orgao}}</p>
    <h1 style="font-size: 18px; font-weight: bold; margin: 12px 0 4px;">ESTUDO TÉCNICO PRELIMINAR</h1>
    <p style="font-size: 12px; margin: 0;">Processo nº {{numero_processo}}</p>
  </div>

  <!-- BLOCO 1 — Descrição da Necessidade -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">1. DESCRIÇÃO DA NECESSIDADE DA CONTRATAÇÃO</h2>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">1.1 Necessidade da Contratação</h3>
  <p style="font-size: 13px; text-align: justify;">{{necessidade_contratacao}}</p>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">1.2 Alinhamento com o PCA</h3>
  <p style="font-size: 13px; text-align: justify;">{{alinhamento_pca}}</p>

  <!-- BLOCO 2 — Área Requisitante -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">2. ÁREA REQUISITANTE</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">Área Requisitante</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{area_requisitante}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; background: #f5f5f5;">Responsável pela Demanda</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{responsavel_demanda}}</td>
    </tr>
  </table>

  <!-- BLOCO 3 — Estimativas e Preços -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">3. ESTIMATIVAS DE QUANTIDADES E PREÇOS</h2>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">3.1 Estimativa de Quantidade</h3>
  <p style="font-size: 13px; text-align: justify;">{{estimativa_quantidade}}</p>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">
    <tr>
      <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">Estimativa de Preço</td>
      <td style="border: 1px solid #ccc; padding: 6px 10px;">{{estimativa_preco}}</td>
    </tr>
  </table>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">3.2 Metodologia de Pesquisa de Preço</h3>
  <p style="font-size: 13px; text-align: justify;">{{metodologia_preco}}</p>

  <!-- BLOCO 4 — Levantamento de Soluções -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">4. LEVANTAMENTO DE SOLUÇÕES</h2>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">4.1 Soluções de Mercado Identificadas</h3>
  <p style="font-size: 13px; text-align: justify;">{{solucoes_mercado}}</p>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">4.2 Solução Escolhida</h3>
  <p style="font-size: 13px; text-align: justify;">{{solucao_escolhida}}</p>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">4.3 Justificativa da Escolha</h3>
  <p style="font-size: 13px; text-align: justify;">{{justificativa_escolha}}</p>

  <!-- BLOCO 5 — Análise de Riscos -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">5. ANÁLISE DE RISCOS</h2>
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">5.1 Riscos Principais</h3>
  {{#riscos_principais}}
  <p style="font-size: 13px; text-align: justify;">{{riscos_principais}}</p>
  {{/riscos_principais}}
  {{^riscos_principais}}
  <p style="font-size: 13px; text-align: justify; color: #999;">Não foram identificados riscos relevantes nesta fase.</p>
  {{/riscos_principais}}
  <h3 style="font-size: 13px; font-weight: bold; margin: 16px 0 4px;">5.2 Ações de Mitigação</h3>
  {{#mitigacao}}
  <p style="font-size: 13px; text-align: justify;">{{mitigacao}}</p>
  {{/mitigacao}}
  {{^mitigacao}}
  <p style="font-size: 13px; text-align: justify; color: #999;">A informar conforme evolução do processo.</p>
  {{/mitigacao}}

  <!-- BLOCO 6 — Conclusão -->
  <h2 style="font-size: 14px; font-weight: bold; margin: 20px 0 8px; text-transform: uppercase;">6. CONCLUSÃO</h2>
  <p style="font-size: 13px; text-align: justify;">
    Diante do exposto, conclui-se pela viabilidade da contratação pretendida, conforme justificativas e análises apresentadas neste Estudo Técnico Preliminar, recomendando-se o prosseguimento do processo licitatório.
  </p>

  <!-- Footer -->
  <div style="margin-top: 48px; border-top: 1px solid #ccc; padding-top: 16px; text-align: center;">
    <p style="font-size: 11px; color: #666;">Documento gerado eletronicamente em {{data_geracao}}</p>
  </div>
</div>
`;

export function renderEtpTemplate(
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

  // Handle conditional blocks
  let html = ETP_TEMPLATE.replace(
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
