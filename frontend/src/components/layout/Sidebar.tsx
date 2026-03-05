import { FileText, Home, FilePlus2, BarChart3, HelpCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SidebarProps {
    isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
    const location = useLocation();

    const navGroup1 = [
        { label: 'Home', icon: Home, path: '/' },
        { label: 'Criar documento', icon: FilePlus2, path: '/criar' },
        { label: 'Meus documentos', icon: FileText, path: '/documentos' },
    ];

    const navGroup2 = [
        { label: 'Meu consumo', icon: BarChart3, path: '/consumo' },
        { label: 'Central de ajuda', icon: HelpCircle, path: '/ajuda' },
    ];

    return (
        <div
            className={cn(
                "flex flex-col bg-[#1E3A5F] text-white transition-all duration-300",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex h-16 items-center border-b border-blue-800/50 px-6">
                {/* Logo Placeholder */}
                {!isCollapsed && <span className="font-bold text-xl tracking-tight truncate">meu Jurídico.ai</span>}
                {isCollapsed && <span className="font-bold text-xl text-center w-full block">mJ</span>}
            </div>

            <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
                {navGroup1.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center px-4 py-3 rounded-lg transition-colors border border-transparent",
                                isActive
                                    ? "bg-[#1A56DB] text-white font-medium shadow-sm border-blue-400/20"
                                    : "text-blue-100/70 hover:bg-[#152c48] hover:text-white",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-blue-300/60")} />
                            {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                        </Link>
                    );
                })}

                <div className="h-px bg-blue-800/40 my-4 mx-2"></div>

                {navGroup2.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center px-4 py-3 rounded-lg transition-colors border border-transparent",
                                isActive
                                    ? "bg-[#1A56DB] text-white font-medium shadow-sm border-blue-400/20"
                                    : "text-blue-100/70 hover:bg-[#152c48] hover:text-white",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-white" : "text-blue-300/60")} />
                            {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
