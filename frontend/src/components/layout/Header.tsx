import { useState, useEffect } from 'react';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
    const [userName, setUserName] = useState('Carregando...');
    const [userEmail, setUserEmail] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
                const { data: profile } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                setUserName(profile?.full_name || 'Usuário MeuJurídico');
            }
        }
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <header className="flex h-16 items-center justify-between bg-white border-b border-gray-100 px-6 z-10 shrink-0 shadow-sm relative">
            <div className="flex items-center">
                <button
                    onClick={toggleSidebar}
                    className="text-gray-500 hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/20"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            <div className="relative">
                <div
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                >
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-semibold text-gray-900">{userName}</span>
                        <span className="text-xs text-gray-500">{userEmail}</span>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-[#1A56DB] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>

                {showDropdown && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair do sistema
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
