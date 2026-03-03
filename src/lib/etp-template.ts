/**
 * ETP Template Engine — Modelo SEI / Lei 14.133/2021, Art. 18
 * Renders structured data into a formal HTML document for Estudo Técnico Preliminar.
 */

const STYLES = {
  page: `font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; color: #1a1a1a; line-height: 1.8; font-size: 13px;`,
  header: `text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 20px; margin-bottom: 28px;`,
  orgao: `font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin: 0; color: #333;`,
  title: `font-size: 18px; font-weight: bold; margin: 14px 0 4px; letter-spacing: 1px;`,
  subtitle: `font-size: 12px; margin: 0; color: #444;`,
  legalRef: `font-size: 10px; color: #666; margin: 4px 0 0; font-style: italic;`,
  h2: `font-size: 14px; font-weight: bold; margin: 28px 0 10px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px;`,
  h3: `font-size: 13px; font-weight: bold; margin: 18px 0 6px;`,
  p: `font-size: 13px; text-align: justify; margin: 6px 0;`,
  table: `width: 100%; border-collapse: collapse; font-size: 12px; margin: 10px 0;`,
  th: `border: 1px solid #999; padding: 6px 10px; font-weight: bold; background: #e8e8e8; text-align: center; font-size: 11px; text-transform: uppercase;`,
  tdLabel: `border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 35%; background: #f5f5f5;`,
  td: `border: 1px solid #ccc; padding: 6px 10px;`,
  tdCenter: `border: 1px solid #ccc; padding: 6px 10px; text-align: center;`,
  empty: `font-size: 12px; text-align: justify; color: #999; font-style: italic;`,
  footer: `margin-top: 56px; border-top: 2px solid #1a1a1a; padding-top: 16px; text-align: center;`,
  signBlock: `margin-top: 48px; text-align: center;`,
  signLine: `border-top: 1px solid #1a1a1a; width: 300px; margin: 0 auto; padding-top: 4px;`,
  signName: `font-size: 12px; font-weight: bold; margin: 0;`,
  signRole: `font-size: 11px; color: #444; margin: 0;`,
};

function esc(val: any): string {
  if (!val) return "";
  return String(val);
}

function or(val: any, fallback = "—"): string {
  const s = esc(val).trim();
  return s || fallback;
}

function emptyNote(text: string): string {
  return `<p style="${STYLES.empty}">${text}</p>`;
}

/** Try to parse a JSON array of items for the estimate table */
function parseEstimateItems(val: any): Array<{ descricao: string; qtd: string; unidade: string; valor_unitario: string; valor_total: string }> | null {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(String(val));
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return null;
}

/** Try to parse risk items */
function parseRiskItems(val: any): Array<{ risco: string; probabilidade: string; impacto: string; mitigacao: string }> | null {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(String(val));
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return null;
}

function renderEstimateTable(dados: Record<string, any>): string {
  const items = parseEstimateItems(dados.itens_estimativa);

  if (items && items.length > 0) {
    const rows = items.map((item, i) => `
      <tr>
        <td style="${STYLES.tdCenter}">${i + 1}</td>
        <td style="${STYLES.td}">${or(item.descricao)}</td>
        <td style="${STYLES.tdCenter}">${or(item.unidade)}</td>
        <td style="${STYLES.tdCenter}">${or(item.qtd)}</td>
        <td style="${STYLES.tdCenter}">${or(item.valor_unitario)}</td>
        <td style="${STYLES.tdCenter}">${or(item.valor_total)}</td>
      </tr>`).join("");

    return `
      <table style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.th}">Item</th>
            <th style="${STYLES.th}">Descrição</th>
            <th style="${STYLES.th}">Unid.</th>
            <th style="${STYLES.th}">Qtd.</th>
            <th style="${STYLES.th}">Valor Unit. (R$)</th>
            <th style="${STYLES.th}">Valor Total (R$)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  // Fallback: simple key-value table from wizard fields
  return `
    <table style="${STYLES.table}">
      <tr>
        <td style="${STYLES.tdLabel}">Estimativa de Quantidade</td>
        <td style="${STYLES.td}">${or(dados.estimativa_quantidade)}</td>
      </tr>
      <tr>
        <td style="${STYLES.tdLabel}">Estimativa de Preço</td>
        <td style="${STYLES.td}">${or(dados.estimativa_preco)}</td>
      </tr>
    </table>`;
}

function renderRiskMatrix(dados: Record<string, any>): string {
  const items = parseRiskItems(dados.itens_risco);

  if (items && items.length > 0) {
    const rows = items.map((item, i) => `
      <tr>
        <td style="${STYLES.tdCenter}">${i + 1}</td>
        <td style="${STYLES.td}">${or(item.risco)}</td>
        <td style="${STYLES.tdCenter}">${or(item.probabilidade)}</td>
        <td style="${STYLES.tdCenter}">${or(item.impacto)}</td>
        <td style="${STYLES.td}">${or(item.mitigacao)}</td>
      </tr>`).join("");

    return `
      <table style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.th}">#</th>
            <th style="${STYLES.th}">Risco</th>
            <th style="${STYLES.th}">Probabilidade</th>
            <th style="${STYLES.th}">Impacto</th>
            <th style="${STYLES.th}">Ação de Mitigação</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  // Fallback: text-based risk display
  const riscos = esc(dados.riscos_principais).trim();
  const mitigacao = esc(dados.mitigacao).trim();

  return `
    <h3 style="${STYLES.h3}">5.1 Riscos Principais</h3>
    ${riscos ? `<p style="${STYLES.p}">${riscos}</p>` : emptyNote("Não foram identificados riscos relevantes nesta fase.")}
    <h3 style="${STYLES.h3}">5.2 Ações de Mitigação</h3>
    ${mitigacao ? `<p style="${STYLES.p}">${mitigacao}</p>` : emptyNote("A informar conforme evolução do processo.")}`;
}

export function renderEtpTemplate(
  dados: Record<string, any>,
  processo?: Record<string, any>
): string {
  const orgao = processo?.orgao ?? dados.orgao ?? "—";
  const numero = processo?.numero_processo ?? dados.numero_processo ?? "—";
  const responsavel = or(dados.responsavel_demanda ?? dados.responsavel);
  const areaReq = or(dados.area_requisitante);

  const dataGeracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
<div style="${STYLES.page}">
  <!-- ═══ CABEÇALHO SEI ═══ -->
  <div style="${STYLES.header}">
    <p style="${STYLES.orgao}">${orgao}</p>
    <h1 style="${STYLES.title}">ESTUDO TÉCNICO PRELIMINAR</h1>
    <p style="${STYLES.subtitle}">Processo nº ${numero}</p>
    <p style="${STYLES.legalRef}">Lei nº 14.133/2021, Art. 18</p>
  </div>

  <!-- ═══ SEÇÃO 1 — Descrição da Necessidade ═══ -->
  <h2 style="${STYLES.h2}">1. Descrição da Necessidade da Contratação</h2>
  <h3 style="${STYLES.h3}">1.1 Necessidade da Contratação</h3>
  <p style="${STYLES.p}">${or(dados.necessidade_contratacao)}</p>
  <h3 style="${STYLES.h3}">1.2 Alinhamento com o PCA</h3>
  <p style="${STYLES.p}">${or(dados.alinhamento_pca)}</p>

  <!-- ═══ SEÇÃO 2 — Área Requisitante ═══ -->
  <h2 style="${STYLES.h2}">2. Área Requisitante e Responsáveis</h2>
  <table style="${STYLES.table}">
    <tr>
      <td style="${STYLES.tdLabel}">Área Requisitante</td>
      <td style="${STYLES.td}">${areaReq}</td>
    </tr>
    <tr>
      <td style="${STYLES.tdLabel}">Responsável pela Demanda</td>
      <td style="${STYLES.td}">${responsavel}</td>
    </tr>
  </table>

  <!-- ═══ SEÇÃO 3 — Estimativas de Quantidades e Preços ═══ -->
  <h2 style="${STYLES.h2}">3. Estimativas de Quantidades e Preços</h2>
  ${renderEstimateTable(dados)}
  <h3 style="${STYLES.h3}">3.1 Metodologia de Pesquisa de Preço</h3>
  <p style="${STYLES.p}">${or(dados.metodologia_preco)}</p>

  <!-- ═══ SEÇÃO 4 — Descrição das Soluções Consideradas ═══ -->
  <h2 style="${STYLES.h2}">4. Descrição das Soluções Consideradas</h2>
  <h3 style="${STYLES.h3}">4.1 Soluções de Mercado Identificadas</h3>
  <p style="${STYLES.p}">${or(dados.solucoes_mercado)}</p>
  <h3 style="${STYLES.h3}">4.2 Solução Escolhida</h3>
  <p style="${STYLES.p}">${or(dados.solucao_escolhida)}</p>
  <h3 style="${STYLES.h3}">4.3 Justificativa da Escolha</h3>
  <p style="${STYLES.p}">${or(dados.justificativa_escolha)}</p>

  <!-- ═══ SEÇÃO 5 — Análise de Riscos ═══ -->
  <h2 style="${STYLES.h2}">5. Análise de Riscos</h2>
  ${renderRiskMatrix(dados)}

  <!-- ═══ SEÇÃO 6 — Conclusão ═══ -->
  <h2 style="${STYLES.h2}">6. Conclusão</h2>
  <p style="${STYLES.p}">
    Diante do exposto, conclui-se pela viabilidade da contratação pretendida, conforme justificativas
    e análises apresentadas neste Estudo Técnico Preliminar, em conformidade com o Art. 18 da Lei nº 14.133/2021,
    recomendando-se o prosseguimento do processo licitatório.
  </p>

  <!-- ═══ ASSINATURA ═══ -->
  <div style="${STYLES.signBlock}">
    <div style="${STYLES.signLine}">
      <p style="${STYLES.signName}">${responsavel}</p>
      <p style="${STYLES.signRole}">${areaReq}</p>
    </div>
  </div>

  <!-- ═══ RODAPÉ ═══ -->
  <div style="${STYLES.footer}">
    <p style="font-size: 11px; color: #666; margin: 0;">Documento gerado eletronicamente em ${dataGeracao}</p>
    <p style="font-size: 10px; color: #999; margin: 4px 0 0;">Este documento é parte integrante do Processo nº ${numero}</p>
  </div>
</div>`;
}
