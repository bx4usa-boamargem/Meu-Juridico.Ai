/**
 * Unified document template renderer.
 * Routes to the correct template based on document type.
 */
import { renderDfdTemplate } from "./dfd-template";
import { renderEtpTemplate } from "./etp-template";
import { renderTrTemplate } from "./templates/tr-template";

export function renderDocumentTemplate(
  tipo: string | null | undefined,
  dados: Record<string, any>,
  processo?: Record<string, any>
): string {
  switch (tipo) {
    case "dfd":
      return renderDfdTemplate(dados, processo);
    case "etp":
      return renderEtpTemplate(dados, processo);
    case "tr":
      return renderTrTemplate(dados, processo);
    default:
      // Fallback: render a simple HTML with all data
      return renderGenericTemplate(tipo, dados, processo);
  }
}

function renderGenericTemplate(
  tipo: string | null | undefined,
  dados: Record<string, any>,
  processo?: Record<string, any>
): string {
  const orgao = processo?.orgao ?? "—";
  const numero = processo?.numero_processo ?? "—";
  const dataGeracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const rows = Object.entries(dados)
    .filter(([k, v]) => k !== "meta" && k !== "conteudo_final" && v)
    .map(([k, v]) => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 6px 10px; font-weight: bold; width: 40%; background: #f5f5f5;">${k.replace(/_/g, " ")}</td>
        <td style="border: 1px solid #ccc; padding: 6px 10px;">${String(v)}</td>
      </tr>`)
    .join("");

  return `
<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
  <div style="text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
    <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">${orgao}</p>
    <h1 style="font-size: 18px; font-weight: bold; margin: 12px 0 4px;">${(tipo ?? "DOCUMENTO").toUpperCase()}</h1>
    <p style="font-size: 12px; margin: 0;">Processo nº ${numero}</p>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0;">${rows}</table>
  <div style="margin-top: 48px; border-top: 1px solid #ccc; padding-top: 16px; text-align: center;">
    <p style="font-size: 11px; color: #666;">Documento gerado eletronicamente em ${dataGeracao}</p>
  </div>
</div>`;
}

/** Maps document type to the status the processo should transition to after approval */
export function getProcessoStatusAfterApproval(tipo: string | null | undefined): string {
  switch (tipo) {
    case "dfd": return "DFD_APROVADO";
    case "etp": return "ETP_APROVADO";
    case "tr": return "TR_APROVADO";
    default: return "DOCUMENTO_APROVADO";
  }
}

/** Returns a human-friendly label for the document type */
export function getDocumentTypeLabel(tipo: string | null | undefined): string {
  switch (tipo) {
    case "dfd": return "DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA";
    case "etp": return "ESTUDO TÉCNICO PRELIMINAR";
    case "tr": return "TERMO DE REFERÊNCIA";
    default: return (tipo ?? "DOCUMENTO").toUpperCase();
  }
}
