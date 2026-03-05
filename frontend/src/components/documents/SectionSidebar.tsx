import { AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SectionSidebarProps {
    sections: any[];
    activeSectionId: string | null;
    onSelect: (id: string) => void;
}

export function SectionSidebar({ sections, activeSectionId, onSelect }: SectionSidebarProps) {
    if (sections.length === 0) {
        return (
            <div className="w-64 border-r border-border-base bg-main flex items-center justify-center p-4">
                <p className="text-text-muted text-sm text-center">Nenhuma seção disponível ainda.</p>
            </div>
        );
    }

    return (
        <div className="w-64 border-r border-border-base bg-main flex flex-col flex-shrink-0 h-full overflow-y-auto">
            <div className="p-4 border-b border-border-base sticky top-0 bg-main z-10">
                <h3 className="font-bold text-sm text-brand-dark">Seções do Documento</h3>
            </div>

            <div className="flex flex-col">
                {sections.map(section => {
                    const isActive = activeSectionId === section.id;
                    return (
                        <div
                            key={section.id}
                            onClick={() => onSelect(section.id)}
                            className={cn(
                                "flex items-start p-4 border-b border-border-base cursor-pointer transition-colors relative",
                                isActive ? "bg-white border-l-4 border-l-brand-primary" : "hover:bg-brand-light border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="flex-1 min-w-0 pr-2">
                                <h4 className={cn("text-sm font-semibold truncate", isActive ? "text-brand-primary" : "text-brand-dark")}>
                                    {section.title}
                                </h4>
                                <div className="flex items-center mt-1 space-x-2">
                                    {section.status === 'validated' && <Badge variant="publicado">Validado</Badge>}
                                    {section.status === 'failed' && <Badge variant="rascunho">Falha</Badge>}
                                    {section.status === 'draft' && <Badge variant="rascunho">Rascunho</Badge>}
                                    {!section.status && <Badge variant="rascunho">Rascunho</Badge>}
                                </div>
                            </div>

                            {section.has_warnings && (
                                <AlertTriangle className="w-4 h-4 text-status-yellow flex-shrink-0 mt-0.5" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
