import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className='flex h-screen bg-gray-50 min-w-[1280px]'>
            <Sidebar isCollapsed={isSidebarCollapsed} />
            <div className='flex flex-col flex-1 overflow-hidden transition-all duration-300 relative'>
                <Header toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
                <main className='flex-1 overflow-y-auto px-10 py-8 bg-gray-50/50'>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
