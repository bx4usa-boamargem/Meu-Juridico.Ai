interface DocumentPreviewProps {
    section: any;
}

export function DocumentPreview({ section }: DocumentPreviewProps) {
    if (!section) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-main p-8 border-l border-border-base text-center">
                <h3 className="text-text-secondary font-medium">Preview ao vivo</h3>
                <p className="text-sm text-text-muted mt-2">O HTML renderizado da seção selecionada aparecerá aqui.</p>
            </div>
        );
    }

    // Se rendered_html não existe, usamos o content purgado como fallback básico (pois a Edge injeta o html final)
    const htmlToShow = section.rendered_html || `<p>${section.content?.replace(/\n/g, '<br/>') || ''}</p>`;

    return (
        <div className="flex-1 flex flex-col bg-white border-l border-border-base h-full animate-in fade-in duration-300">
            <div className="p-4 border-b border-border-base bg-main flex-shrink-0 flex items-center justify-between">
                <h3 className="font-bold text-sm text-brand-dark flex flex-col">
                    Preview
                    <span className="text-xs font-normal text-text-muted uppercase mt-0.5 tracking-wide">Documento Final</span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50 flex justify-center">
                {/* Página "A4" simulada */}
                <div className="w-full max-w-[21cm] min-h-[29.7cm] bg-white shadow-sm border border-border-base p-12 text-black prose prose-sm sm:prose-base font-serif">
                    <div
                        dangerouslySetInnerHTML={{ __html: htmlToShow }}
                    />
                </div>
            </div>
        </div>
    );
}
