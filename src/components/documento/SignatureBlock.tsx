interface SignatureBlockProps {
  responsavelTecnico?: string;
  fiscalContrato?: string;
  ordenadorDespesa?: string;
  className?: string;
}

export function SignatureBlock({
  responsavelTecnico,
  fiscalContrato,
  ordenadorDespesa,
  className,
}: SignatureBlockProps) {
  const signatures = [
    { role: "Responsável Técnico", name: responsavelTecnico },
    { role: "Fiscal do Contrato", name: fiscalContrato },
    { role: "Ordenador de Despesa", name: ordenadorDespesa },
  ].filter((s) => s.name);

  if (signatures.length === 0) return null;

  return (
    <div className={className}>
      <div className="border-t border-border pt-8 mt-8">
        <div className="grid grid-cols-1 gap-10">
          {signatures.map((sig) => (
            <div key={sig.role} className="text-center">
              <div className="w-64 mx-auto border-b border-foreground mb-1" />
              <p className="text-sm font-semibold">{sig.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{sig.role}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-8 italic">
          Documento assinado eletronicamente conforme Lei nº 14.063/2020
        </p>
      </div>
    </div>
  );
}

/** Generate signature HTML for PDF print */
export function renderSignatureHtml(
  responsavelTecnico?: string,
  fiscalContrato?: string,
  ordenadorDespesa?: string,
): string {
  const sigs = [
    { role: "Responsável Técnico", name: responsavelTecnico },
    { role: "Fiscal do Contrato", name: fiscalContrato },
    { role: "Ordenador de Despesa", name: ordenadorDespesa },
  ].filter((s) => s.name);

  if (sigs.length === 0) return "";

  return `
    <div style="border-top: 1px solid #ccc; padding-top: 32px; margin-top: 48px; page-break-inside: avoid;">
      ${sigs.map((s) => `
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 250px; margin: 0 auto; border-bottom: 1px solid #1a1a1a;"></div>
          <p style="font-size: 12px; font-weight: bold; margin: 4px 0 0;">${s.name || "—"}</p>
          <p style="font-size: 11px; color: #666; margin: 0;">${s.role}</p>
        </div>
      `).join("")}
      <p style="font-size: 9px; color: #999; text-align: center; font-style: italic; margin-top: 16px;">
        Documento assinado eletronicamente conforme Lei nº 14.063/2020
      </p>
    </div>
  `;
}
