/**
 * TR Template Engine — Termo de Referência
 * Lei 14.133/2021, Art. 6º, XXIII
 * Renders structured data into a formal SEI-standard HTML document.
 */

const S = {
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
  td: `border: 1px solid #ccc; padding: 6px 10px;`,
  tdCenter: `border: 1px solid #ccc; padding: 6px 10px; text-align: center;`,
  tdLabel: `border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 35%; background: #f5f5f5;`,
  empty: `font-size: 12px; text-align: justify; color: #999; font-style: italic;`,
  footer: `margin-top: 56px; border-top: 2px solid #1a1a1a; padding-top: 16px; text-align: center;`,
  signBlock: `margin-top: 48px; text-align: center;`,
  signLine: `border-top: 1px solid #1a1a1a; width: 300px; margin: 0 auto; padding-top: 4px;`,
  signName: `font-size: 12px; font-weight: bold; margin: 0;`,
  signRole: `font-size: 11px; color: #444; margin: 0;`,
  annexBox: `border: 1px dashed #999; padding: 16px; margin: 16px 0; text-align: center; color: #999; font-style: italic; font-size: 12px;`,
};

function or(val: any, fallback = "—"): string {
  const s = val ? String(val).trim() : "";
  return s || fallback;
}

function emptyNote(text: string): string {
  return `<p style="${S.empty}">${text}</p>`;
}

/** Parse penalty items from JSON or array */
function parsePenalties(val: any): Array<{ infração: string; grau: string; sanção: string; fundamentação: string }> | null {
  if (!val) return null;
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(String(val));
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return null;
}

function renderPenaltyTable(dados: Record<string, any>): string {
  const items = parsePenalties(dados.itens_penalidades);

  if (items && items.length > 0) {
    const rows = items.map((item, i) => `
      <tr>
        <td style="${S.tdCenter}">${i + 1}</td>
        <td style="${S.td}">${or(item.infração)}</td>
        <td style="${S.tdCenter}">${or(item.grau)}</td>
        <td style="${S.td}">${or(item.sanção)}</td>
        <td style="${S.td}">${or(item.fundamentação)}</td>
      </tr>`).join("");

    return `
      <table style="${S.table}">
        <thead>
          <tr>
            <th style="${S.th}">#</th>
            <th style="${S.th}">Infração</th>
            <th style="${S.th}">Grau</th>
            <th style="${S.th}">Sanção</th>
            <th style="${S.th}">Fundamentação Legal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  // Fallback text
  const penalidades = or(dados.penalidades).trim();
  const sancoes = or(dados.sancoes).trim();

  return `
    <h3 style="${S.h3}">5.1 Penalidades Aplicáveis</h3>
    ${penalidades !== "—" ? `<p style="${S.p}">${penalidades}</p>` : emptyNote("A definir conforme legislação vigente.")}
    <h3 style="${S.h3}">5.2 Sanções Administrativas</h3>
    ${sancoes !== "—" ? `<p style="${S.p}">${sancoes}</p>` : emptyNote("Conforme Art. 155 e seguintes da Lei nº 14.133/2021.")}`;
}

export function renderTrTemplate(
  dados: Record<string, any>,
  processo?: Record<string, any>
): string {
  const orgao = processo?.orgao ?? dados.orgao ?? "—";
  const numero = processo?.numero_processo ?? dados.numero_processo ?? "—";
  const responsavel = or(dados.responsavel_tecnico ?? dados.responsavel);
  const fiscal = or(dados.fiscal_contrato);

  const dataGeracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return `
<div style="${S.page}">
  <!-- ═══ CABEÇALHO SEI ═══ -->
  <div style="${S.header}">
    <p style="${S.orgao}">${orgao}</p>
    <h1 style="${S.title}">TERMO DE REFERÊNCIA</h1>
    <p style="${S.subtitle}">Processo nº ${numero}</p>
    <p style="${S.legalRef}">Lei nº 14.133/2021, Art. 6º, XXIII</p>
  </div>

  <!-- ═══ SEÇÃO 1 — Definição do Objeto ═══ -->
  <h2 style="${S.h2}">1. Definição do Objeto</h2>
  <h3 style="${S.h3}">1.1 Objeto da Contratação</h3>
  <p style="${S.p}">${or(dados.objeto_contratacao ?? dados.definicao_objeto)}</p>
  <h3 style="${S.h3}">1.2 Natureza do Objeto</h3>
  <p style="${S.p}">${or(dados.natureza_objeto)}</p>
  <h3 style="${S.h3}">1.3 Justificativa da Contratação</h3>
  <p style="${S.p}">${or(dados.justificativa_contratacao)}</p>

  <!-- ═══ SEÇÃO 2 — Especificações Técnicas ═══ -->
  <h2 style="${S.h2}">2. Especificações Técnicas</h2>
  <h3 style="${S.h3}">2.1 Descrição Detalhada</h3>
  <p style="${S.p}">${or(dados.especificacoes_tecnicas)}</p>
  <h3 style="${S.h3}">2.2 Requisitos Técnicos Obrigatórios</h3>
  <p style="${S.p}">${or(dados.requisitos_tecnicos)}</p>
  <h3 style="${S.h3}">2.3 Padrões de Qualidade</h3>
  <p style="${S.p}">${or(dados.padroes_qualidade)}</p>

  <!-- ═══ SEÇÃO 3 — Condições de Execução e Recebimento ═══ -->
  <h2 style="${S.h2}">3. Condições de Execução e Recebimento</h2>
  <h3 style="${S.h3}">3.1 Prazo de Execução</h3>
  <p style="${S.p}">${or(dados.prazo_execucao)}</p>
  <h3 style="${S.h3}">3.2 Local de Execução / Entrega</h3>
  <p style="${S.p}">${or(dados.local_execucao)}</p>
  <h3 style="${S.h3}">3.3 Condições de Recebimento</h3>
  <p style="${S.p}">${or(dados.condicoes_recebimento)}</p>
  <h3 style="${S.h3}">3.4 Critérios de Aceitação</h3>
  <p style="${S.p}">${or(dados.criterios_aceitacao)}</p>

  <!-- ═══ SEÇÃO 4 — Obrigações das Partes ═══ -->
  <h2 style="${S.h2}">4. Obrigações das Partes</h2>
  <h3 style="${S.h3}">4.1 Obrigações da Contratante</h3>
  <p style="${S.p}">${or(dados.obrigacoes_contratante)}</p>
  <h3 style="${S.h3}">4.2 Obrigações da Contratada</h3>
  <p style="${S.p}">${or(dados.obrigacoes_contratada)}</p>

  <!-- ═══ SEÇÃO 5 — Penalidades e Sanções ═══ -->
  <h2 style="${S.h2}">5. Penalidades e Sanções</h2>
  ${renderPenaltyTable(dados)}

  <!-- ═══ ANEXOS ═══ -->
  <h2 style="${S.h2}">6. Anexos</h2>
  ${or(dados.anexos) !== "—"
    ? `<p style="${S.p}">${dados.anexos}</p>`
    : `<div style="${S.annexBox}">Espaço reservado para anexos técnicos, planilhas de custos e demais documentos complementares.</div>`
  }

  <!-- ═══ APROVAÇÃO E ASSINATURA ═══ -->
  <div style="${S.signBlock}">
    <div style="${S.signLine}">
      <p style="${S.signName}">${responsavel}</p>
      <p style="${S.signRole}">Responsável Técnico</p>
    </div>
  </div>
  ${fiscal !== "—" ? `
  <div style="${S.signBlock}">
    <div style="${S.signLine}">
      <p style="${S.signName}">${fiscal}</p>
      <p style="${S.signRole}">Fiscal do Contrato</p>
    </div>
  </div>` : ""}

  <!-- ═══ RODAPÉ ═══ -->
  <div style="${S.footer}">
    <p style="font-size: 11px; color: #666; margin: 0;">Documento gerado eletronicamente em ${dataGeracao}</p>
    <p style="font-size: 10px; color: #999; margin: 4px 0 0;">Este documento é parte integrante do Processo nº ${numero}</p>
  </div>
</div>`;
}
