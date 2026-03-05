import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell, TableEmpty, TableLoading } from '../ui/Table';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FileText, MoreVertical, Lock, PlusCircle, LayoutTemplate } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
    const [activeTab, setActiveTab] = useState('Meus documentos');
    const [documents, setDocuments] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [expertState, setExpertState] = useState({
        name: 'Amanda Sampaio',
        role: 'Sua Especialista em Licitações',
    });
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch User
            const { data: profile } = await supabase
                .from('users')
                .select('id, full_name, org_id')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                setUserProfile(profile);

                // Fetch Org Exec para Banner
                const { data: orgSettings } = await supabase
                    .from('org_settings')
                    .select('expert_name, expert_role')
                    .eq('org_id', profile.org_id)
                    .single();

                if (orgSettings && orgSettings.expert_name) {
                    setExpertState({
                        name: orgSettings.expert_name,
                        role: orgSettings.expert_role || 'Sua Especialista',
                    });
                }
            }

            // Fetch Templates (DFD, ETP, TR)
            const { data: templatesData } = await supabase
                .from('document_templates')
                .select('id, name, description, doc_type')
                .eq('is_default', true)
                .in('doc_type', ['DFD', 'ETP', 'TR']);

            if (templatesData) setTemplates(templatesData);

            // Fetch Documents
            const { data, error: docError } = await supabase
                .from('documents')
                .select(`
                    id, title, doc_type, status, process_number, updated_at, created_by,
                    processes(tipo_objeto),
                    created_by_user:users!documents_created_by_fkey(full_name, avatar_url)
                `)
                .order('updated_at', { ascending: false });

            if (docError) {
                setError(docError.message);
            } else {
                setDocuments(data || []);
            }

            setLoading(false);
        }

        fetchDashboardData();
    }, []);

    const handleCreate = (templateId?: string) => {
        // Redireciona pro wizard. Pode passar o template como state futuramente
        navigate('/criar');
    };

    const filteredDocuments = documents.filter(doc => {
        if (activeTab === 'Meus documentos') return doc.created_by === userProfile?.id;
        if (activeTab === 'Documentos da minha UASG') return doc.status !== 'arquivado'; // Na vida real, filtrar UASG
        if (activeTab === 'Documentos de outras UASG') return false;
        if (activeTab === 'Lixeira') return doc.status === 'arquivado';
        return true;
    });

    const getUserFirstName = () => {
        if (!userProfile?.full_name) return 'Usuário';
        return userProfile.full_name.split(' ')[0];
    };

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">

            {/* Banner Amanda Sampaio (Especialista) */}
            <div className="bg-[#1A56DB] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

                <div className="flex items-center space-x-6 relative z-10 w-full">
                    {/* Avatar Specialist Fallback */}
                    <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="text-3xl font-bold text-white">{expertState.name.charAt(0)}</span>
                    </div>

                    <div className="flex flex-col text-white">
                        <h1 className="text-2xl font-bold mb-1">Olá, {getUserFirstName()}!</h1>
                        <p className="text-blue-100 text-lg">Eu sou <span className="font-semibold text-white">{expertState.name}</span>, {expertState.role.toLowerCase()}.</p>
                        <p className="text-blue-100/80 text-sm mt-1">Como posso te ajudar a instruir a sua contratação hoje?</p>
                    </div>
                </div>

                <div className="mt-6 md:mt-0 relative z-10 shrink-0">
                    <button
                        onClick={() => handleCreate()}
                        className="flex items-center space-x-2 bg-white text-[#1A56DB] px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all whitespace-nowrap"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span>Novo Documento</span>
                    </button>
                </div>
            </div>

            {/* Ações Rápidas - Cards Document Templates (DFD, ETP, TR) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map(tpl => (
                    <div key={tpl.id} onClick={() => handleCreate(tpl.id)} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-[#1A56DB] hover:ring-1 hover:ring-[#1A56DB]/30 transition-all cursor-pointer group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-[#1A56DB] transition-colors">
                                    <LayoutTemplate className="h-6 w-6 text-[#1A56DB] group-hover:text-white transition-colors" />
                                </div>
                                <Badge variant="rascunho" className="bg-gray-100 text-gray-600 border-none">{tpl.doc_type}</Badge>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2">{tpl.name}</h3>
                            <p className="text-gray-500 text-sm mt-2 line-clamp-2">{tpl.description}</p>
                        </div>
                    </div>
                ))}
                {templates.length === 0 && !loading && (
                    <div className="col-span-3 text-center p-8 bg-gray-50 text-gray-500 rounded-xl border border-dashed border-gray-200">
                        Nenhum template padrão encontrado.
                    </div>
                )}
            </div>

            {/* Tabela de Documentos */}
            <div className="flex flex-col space-y-4 pt-2">
                <Tabs
                    variant="underline"
                    tabs={[
                        { id: 'Meus documentos', label: 'Meus documentos' },
                        { id: 'Documentos da minha UASG', label: 'Documentos da minha UASG' },
                        { id: 'Documentos de outras UASG', label: 'Documentos de outras UASG' },
                        { id: 'Lixeira', label: 'Lixeira' }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-4">
                    {error ? (
                        <div className="p-8 text-center text-red-500 bg-red-50">{error}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <TableHead className="font-semibold text-gray-700">Documento</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Responsável</TableHead>
                                    <TableHead className="font-semibold text-gray-700">UASG</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Categoria</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-center">Réplicas</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </tr>
                            </TableHeader>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <TableLoading />
                                ) : filteredDocuments.length === 0 ? (
                                    <TableEmpty message="Nenhum documento encontrado para esta visão." />
                                ) : (
                                    filteredDocuments.map((doc) => (
                                        <TableRow key={doc.id} className="hover:bg-blue-50/50 cursor-pointer transition-colors" onClick={() => navigate(`/documentos/${doc.id}`)}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 line-clamp-1">{doc.title}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">Criado em {new Date(doc.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-6 w-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold">
                                                        {(doc.created_by_user?.full_name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-gray-700 font-medium truncate max-w-[120px]">
                                                        {doc.created_by_user?.full_name?.split(' ')[0] || 'Desconhecido'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">999999</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="rascunho" className="bg-gray-100 text-gray-700">{doc.doc_type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-600">{doc.processes?.tipo_objeto || 'Não def.'}</span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-sm text-gray-500 font-medium">0</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={doc.status as any}>{doc.status?.replace('_', ' ').toUpperCase()}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-[#1A56DB] hover:bg-blue-50">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </div>
            </div>

        </div>
    );
}
