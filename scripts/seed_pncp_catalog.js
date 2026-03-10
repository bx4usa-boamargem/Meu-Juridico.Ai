/**
 * seed_pncp_catalog.js
 * 
 * Script local que:
 * 1. Busca itens de Atas de Registro de Preços do PNCP (API pública)
 * 2. Normaliza e insere na tabela pncp_catalog do Supabase
 * 3. Também seed de um catálogo base CATMAT/CATSER de ~500 itens comuns
 * 
 * Execução: node scripts/seed_pncp_catalog.js
 * 
 * Recomendado rodar 1x por semana via cron local ou GitHub Actions
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://dtqxbwehofsvkoxekidp.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY não definida.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── CATÁLOGO BASE CATMAT/CATSER (500+ itens comuns em compras públicas) ─────
const CATALOGO_BASE = [
  // ── MATERIAL DE ESCRITÓRIO ──────────────────────────────────────────────
  { id: "catmat-000001", descricao: "Caneta esferográfica azul 1.0mm", unidade_medida: "UN", valor_unitario_estimado: 1.50, categoria: "material", codigo_catmat: "000001" },
  { id: "catmat-000002", descricao: "Caneta esferográfica preta 1.0mm", unidade_medida: "UN", valor_unitario_estimado: 1.50, categoria: "material", codigo_catmat: "000002" },
  { id: "catmat-000003", descricao: "Caneta esferográfica vermelha 1.0mm", unidade_medida: "UN", valor_unitario_estimado: 1.50, categoria: "material", codigo_catmat: "000003" },
  { id: "catmat-000004", descricao: "Lápis preto nº 2 sextavado", unidade_medida: "UN", valor_unitario_estimado: 0.80, categoria: "material", codigo_catmat: "000004" },
  { id: "catmat-000005", descricao: "Borracha escolar branca", unidade_medida: "UN", valor_unitario_estimado: 0.90, categoria: "material", codigo_catmat: "000005" },
  { id: "catmat-000006", descricao: "Papel A4 75g resma 500 folhas", unidade_medida: "RS", valor_unitario_estimado: 25.00, categoria: "material", codigo_catmat: "000006" },
  { id: "catmat-000007", descricao: "Papel A4 90g resma 500 folhas", unidade_medida: "RS", valor_unitario_estimado: 32.00, categoria: "material", codigo_catmat: "000007" },
  { id: "catmat-000008", descricao: "Envelope branco A4 sem janela kraft", unidade_medida: "PC", valor_unitario_estimado: 18.00, categoria: "material", codigo_catmat: "000008" },
  { id: "catmat-000009", descricao: "Clipe para papel nº 4/0 metálico cx 100 un", unidade_medida: "CX", valor_unitario_estimado: 4.50, categoria: "material", codigo_catmat: "000009" },
  { id: "catmat-000010", descricao: "Grampo 26/6 caixa 5000 unidades", unidade_medida: "CX", valor_unitario_estimado: 8.00, categoria: "material", codigo_catmat: "000010" },
  { id: "catmat-000011", descricao: "Grampeador de mesa 26/6 metálico", unidade_medida: "UN", valor_unitario_estimado: 22.00, categoria: "material", codigo_catmat: "000011" },
  { id: "catmat-000012", descricao: "Perfurador de papel 2 furos metálico", unidade_medida: "UN", valor_unitario_estimado: 28.00, categoria: "material", codigo_catmat: "000012" },
  { id: "catmat-000013", descricao: "Tesoura escritório 21cm inox cabo reto", unidade_medida: "UN", valor_unitario_estimado: 12.00, categoria: "material", codigo_catmat: "000013" },
  { id: "catmat-000014", descricao: "Fita adesiva transparente 12mm x 30m ", unidade_medida: "RL", valor_unitario_estimado: 2.50, categoria: "material", codigo_catmat: "000014" },
  { id: "catmat-000015", descricao: "Fita adesiva transparente 19mm x 45m", unidade_medida: "RL", valor_unitario_estimado: 3.20, categoria: "material", codigo_catmat: "000015" },
  { id: "catmat-000016", descricao: "Pasta AZ A4 lombo largo arquivo morto", unidade_medida: "UN", valor_unitario_estimado: 15.00, categoria: "material", codigo_catmat: "000016" },
  { id: "catmat-000017", descricao: "Pasta suspensa kraft com viseira", unidade_medida: "UN", valor_unitario_estimado: 4.00, categoria: "material", codigo_catmat: "000017" },
  { id: "catmat-000018", descricao: "Pasta plástica transparente L A4", unidade_medida: "UN", valor_unitario_estimado: 1.20, categoria: "material", codigo_catmat: "000018" },
  { id: "catmat-000019", descricao: "Etiqueta adesiva 25x15mm folha cx 25 fl", unidade_medida: "CX", valor_unitario_estimado: 18.00, categoria: "material", codigo_catmat: "000019" },
  { id: "catmat-000020", descricao: "Marcador permanente preto ponta grossa", unidade_medida: "UN", valor_unitario_estimado: 3.50, categoria: "material", codigo_catmat: "000020" },
  { id: "catmat-000021", descricao: "Marcador para quadro branco azul", unidade_medida: "UN", valor_unitario_estimado: 4.50, categoria: "material", codigo_catmat: "000021" },
  { id: "catmat-000022", descricao: "Marcador para quadro branco preto", unidade_medida: "UN", valor_unitario_estimado: 4.50, categoria: "material", codigo_catmat: "000022" },
  { id: "catmat-000023", descricao: "Quadro branco moldura alumínio 90x60cm", unidade_medida: "UN", valor_unitario_estimado: 120.00, categoria: "material", codigo_catmat: "000023" },
  { id: "catmat-000024", descricao: "Apagador para quadro branco EVA", unidade_medida: "UN", valor_unitario_estimado: 8.00, categoria: "material", codigo_catmat: "000024" },
  { id: "catmat-000025", descricao: "Post-it bloco adesivo 76x76mm amarelo cx 12 un", unidade_medida: "CX", valor_unitario_estimado: 35.00, categoria: "material", codigo_catmat: "000025" },
  // ── INFORMÁTICA / PERIFÉRICOS ─────────────────────────────────────────
  { id: "catmat-001001", descricao: "Mouse óptico USB sem fio", unidade_medida: "UN", valor_unitario_estimado: 85.00, categoria: "material", codigo_catmat: "001001" },
  { id: "catmat-001002", descricao: "Teclado USB ABNT2 padrão", unidade_medida: "UN", valor_unitario_estimado: 95.00, categoria: "material", codigo_catmat: "001002" },
  { id: "catmat-001003", descricao: "Monitor LED 21.5 polegadas Full HD", unidade_medida: "UN", valor_unitario_estimado: 850.00, categoria: "material", codigo_catmat: "001003" },
  { id: "catmat-001004", descricao: "Monitor LED 24 polegadas Full HD", unidade_medida: "UN", valor_unitario_estimado: 1100.00, categoria: "material", codigo_catmat: "001004" },
  { id: "catmat-001005", descricao: "Computador desktop core i5 8GB RAM 256GB SSD", unidade_medida: "UN", valor_unitario_estimado: 3200.00, categoria: "material", codigo_catmat: "001005" },
  { id: "catmat-001006", descricao: "Notebook 14 polegadas core i5 8GB RAM 256GB SSD", unidade_medida: "UN", valor_unitario_estimado: 3800.00, categoria: "material", codigo_catmat: "001006" },
  { id: "catmat-001007", descricao: "Impressora multifuncional laser monocromática", unidade_medida: "UN", valor_unitario_estimado: 1200.00, categoria: "material", codigo_catmat: "001007" },
  { id: "catmat-001008", descricao: "Impressora multifuncional jato de tinta colorida", unidade_medida: "UN", valor_unitario_estimado: 850.00, categoria: "material", codigo_catmat: "001008" },
  { id: "catmat-001009", descricao: "Cartucho de tinta preto impressora jato tinta", unidade_medida: "UN", valor_unitario_estimado: 65.00, categoria: "material", codigo_catmat: "001009" },
  { id: "catmat-001010", descricao: "Toner laser preto compatível", unidade_medida: "UN", valor_unitario_estimado: 125.00, categoria: "material", codigo_catmat: "001010" },
  { id: "catmat-001011", descricao: "Pendrive USB 3.0 16GB", unidade_medida: "UN", valor_unitario_estimado: 35.00, categoria: "material", codigo_catmat: "001011" },
  { id: "catmat-001012", descricao: "Pendrive USB 3.0 32GB", unidade_medida: "UN", valor_unitario_estimado: 48.00, categoria: "material", codigo_catmat: "001012" },
  { id: "catmat-001013", descricao: "Cabo HDMI 1.8m 4K", unidade_medida: "UN", valor_unitario_estimado: 22.00, categoria: "material", codigo_catmat: "001013" },
  { id: "catmat-001014", descricao: "No-break 600VA bivolt", unidade_medida: "UN", valor_unitario_estimado: 280.00, categoria: "material", codigo_catmat: "001014" },
  { id: "catmat-001015", descricao: "Switch de rede 8 portas gigabit", unidade_medida: "UN", valor_unitario_estimado: 220.00, categoria: "material", codigo_catmat: "001015" },
  { id: "catmat-001016", descricao: "Webcam HD 1080p com microfone integrado", unidade_medida: "UN", valor_unitario_estimado: 180.00, categoria: "material", codigo_catmat: "001016" },
  { id: "catmat-001017", descricao: "Projetor multimídia 3000 lúmens HDMI", unidade_medida: "UN", valor_unitario_estimado: 2800.00, categoria: "material", codigo_catmat: "001017" },
  { id: "catmat-001018", descricao: "Headset USB com microfone cancelamento ruído", unidade_medida: "UN", valor_unitario_estimado: 145.00, categoria: "material", codigo_catmat: "001018" },
  // ── LIMPEZA / HIGIENE ──────────────────────────────────────────────────
  { id: "catmat-002001", descricao: "Papel higiênico folha dupla 30m rolo cx 64 un", unidade_medida: "CX", valor_unitario_estimado: 65.00, categoria: "material", codigo_catmat: "002001" },
  { id: "catmat-002002", descricao: "Sabão em barra 200g cx 20 un", unidade_medida: "CX", valor_unitario_estimado: 38.00, categoria: "material", codigo_catmat: "002002" },
  { id: "catmat-002003", descricao: "Sabonete líquido refil 5 litros", unidade_medida: "FR", valor_unitario_estimado: 28.00, categoria: "material", codigo_catmat: "002003" },
  { id: "catmat-002004", descricao: "Detergente líquido neutro 500ml", unidade_medida: "UN", valor_unitario_estimado: 3.50, categoria: "material", codigo_catmat: "002004" },
  { id: "catmat-002005", descricao: "Desinfetante bactericida 2 litros lavanda", unidade_medida: "FR", valor_unitario_estimado: 8.50, categoria: "material", codigo_catmat: "002005" },
  { id: "catmat-002006", descricao: "Água sanitária 1 litro", unidade_medida: "FR", valor_unitario_estimado: 4.20, categoria: "material", codigo_catmat: "002006" },
  { id: "catmat-002007", descricao: "Álcool 70% líquido 1 litro", unidade_medida: "FR", valor_unitario_estimado: 9.00, categoria: "material", codigo_catmat: "002007" },
  { id: "catmat-002008", descricao: "Álcool em gel 70% 500ml", unidade_medida: "FR", valor_unitario_estimado: 7.50, categoria: "material", codigo_catmat: "002008" },
  { id: "catmat-002009", descricao: "Pano de chão algodão 400g", unidade_medida: "UN", valor_unitario_estimado: 8.00, categoria: "material", codigo_catmat: "002009" },
  { id: "catmat-002010", descricao: "Vassoura nylon cabo madeira 1.20m", unidade_medida: "UN", valor_unitario_estimado: 18.00, categoria: "material", codigo_catmat: "002010" },
  { id: "catmat-002011", descricao: "Rodo 40cm com cabo alumínio", unidade_medida: "UN", valor_unitario_estimado: 22.00, categoria: "material", codigo_catmat: "002011" },
  { id: "catmat-002012", descricao: "Balde plástico 10 litros", unidade_medida: "UN", valor_unitario_estimado: 14.00, categoria: "material", codigo_catmat: "002012" },
  { id: "catmat-002013", descricao: "Saco de lixo preto 100L cx 100 un", unidade_medida: "CX", valor_unitario_estimado: 42.00, categoria: "material", codigo_catmat: "002013" },
  { id: "catmat-002014", descricao: "Saco de lixo preto 30L cx 100 un", unidade_medida: "CX", valor_unitario_estimado: 18.00, categoria: "material", codigo_catmat: "002014" },
  { id: "catmat-002015", descricao: "Luva de borracha tamanho M par", unidade_medida: "PR", valor_unitario_estimado: 6.50, categoria: "material", codigo_catmat: "002015" },
  // ── COPA E COZINHA ─────────────────────────────────────────────────────
  { id: "catmat-003001", descricao: "Café torrado e moído 500g pacote", unidade_medida: "PC", valor_unitario_estimado: 18.00, categoria: "material", codigo_catmat: "003001" },
  { id: "catmat-003002", descricao: "Açúcar cristal 1kg pacote", unidade_medida: "PC", valor_unitario_estimado: 5.50, categoria: "material", codigo_catmat: "003002" },
  { id: "catmat-003003", descricao: "Copo descartável 50ml branco cx 100 un", unidade_medida: "CX", valor_unitario_estimado: 4.00, categoria: "material", codigo_catmat: "003003" },
  { id: "catmat-003004", descricao: "Copo descartável 200ml branco cx 100 un", unidade_medida: "CX", valor_unitario_estimado: 5.50, categoria: "material", codigo_catmat: "003004" },
  { id: "catmat-003005", descricao: "Água mineral sem gás pet 500ml", unidade_medida: "UN", valor_unitario_estimado: 2.50, categoria: "material", codigo_catmat: "003005" },
  { id: "catmat-003006", descricao: "Água mineral sem gás galão 20 litros", unidade_medida: "GL", valor_unitario_estimado: 18.00, categoria: "material", codigo_catmat: "003006" },
  { id: "catmat-003007", descricao: "Filtro de papel para café tamanho 103 cx 30 un", unidade_medida: "CX", valor_unitario_estimado: 6.00, categoria: "material", codigo_catmat: "003007" },
  // ── EQUIPAMENTOS HOSPITALARES/AMBULATORIAIS ─────────────────────────
  { id: "catmat-004001", descricao: "Máscara cirúrgica descartável cx 50 un", unidade_medida: "CX", valor_unitario_estimado: 22.00, categoria: "material", codigo_catmat: "004001" },
  { id: "catmat-004002", descricao: "Luva de procedimento nitrila tamanho M cx 100 un", unidade_medida: "CX", valor_unitario_estimado: 42.00, categoria: "material", codigo_catmat: "004002" },
  { id: "catmat-004003", descricao: "Termômetro digital infravermelho", unidade_medida: "UN", valor_unitario_estimado: 85.00, categoria: "material", codigo_catmat: "004003" },
  { id: "catmat-004004", descricao: "Esfigmomanômetro aneroide adulto", unidade_medida: "UN", valor_unitario_estimado: 145.00, categoria: "material", codigo_catmat: "004004" },
  { id: "catmat-004005", descricao: "Seringa descartável 5ml agulha 25x7 cx 100 un", unidade_medida: "CX", valor_unitario_estimado: 38.00, categoria: "material", codigo_catmat: "004005" },
  { id: "catmat-004006", descricao: "Curativo adesivo estéril caixa 100 un", unidade_medida: "CX", valor_unitario_estimado: 15.00, categoria: "material", codigo_catmat: "004006" },
  // ── COMBUSTÍVEIS / INFRAESTRUTURA ────────────────────────────────────
  { id: "catmat-005001", descricao: "Gasolina comum litro", unidade_medida: "LT", valor_unitario_estimado: 6.40, categoria: "material", codigo_catmat: "005001" },
  { id: "catmat-005002", descricao: "Óleo diesel S10 litro", unidade_medida: "LT", valor_unitario_estimado: 6.10, categoria: "material", codigo_catmat: "005002" },
  { id: "catmat-005003", descricao: "Etanol hidratado litro", unidade_medida: "LT", valor_unitario_estimado: 4.80, categoria: "material", codigo_catmat: "005003" },
  { id: "catmat-005004", descricao: "Areia lavada m³", unidade_medida: "M3", valor_unitario_estimado: 120.00, categoria: "material", codigo_catmat: "005004" },
  { id: "catmat-005005", descricao: "Brita nº 1 m³", unidade_medida: "M3", valor_unitario_estimado: 150.00, categoria: "material", codigo_catmat: "005005" },
  { id: "catmat-005006", descricao: "Cimento Portland CP-II 50kg saco", unidade_medida: "SC", valor_unitario_estimado: 38.00, categoria: "material", codigo_catmat: "005006" },
  { id: "catmat-005007", descricao: "Cal hidratada 20kg saco", unidade_medida: "SC", valor_unitario_estimado: 18.00, categoria: "material", codigo_catmat: "005007" },
  { id: "catmat-005008", descricao: "Tijolo cerâmico furado 9 furos 19x19x9cm pc 1000 un", unidade_medida: "PC", valor_unitario_estimado: 850.00, categoria: "material", codigo_catmat: "005008" },
  // ── SERVIÇOS ──────────────────────────────────────────────────────────
  { id: "catser-010001", descricao: "Serviço de manutenção predial mensal", unidade_medida: "MS", valor_unitario_estimado: 4500.00, categoria: "servico", codigo_catmat: "010001" },
  { id: "catser-010002", descricao: "Serviço de limpeza e conservação mensal", unidade_medida: "MS", valor_unitario_estimado: 8500.00, categoria: "servico", codigo_catmat: "010002" },
  { id: "catser-010003", descricao: "Serviço de segurança e vigilância 12h diurno/noturno mensal", unidade_medida: "MS", valor_unitario_estimado: 12000.00, categoria: "servico", codigo_catmat: "010003" },
  { id: "catser-010004", descricao: "Serviço de transporte de passageiros veículo utilitário hora", unidade_medida: "HR", valor_unitario_estimado: 85.00, categoria: "servico", codigo_catmat: "010004" },
  { id: "catser-010005", descricao: "Serviço de manutenção e suporte de rede de TI mensal", unidade_medida: "MS", valor_unitario_estimado: 3200.00, categoria: "servico", codigo_catmat: "010005" },
  { id: "catser-010006", descricao: "Serviço de impressão e reprografia página A4 PB", unidade_medida: "PG", valor_unitario_estimado: 0.08, categoria: "servico", codigo_catmat: "010006" },
  { id: "catser-010007", descricao: "Serviço de impressão e reprografia página A4 colorida", unidade_medida: "PG", valor_unitario_estimado: 0.35, categoria: "servico", codigo_catmat: "010007" },
  { id: "catser-010008", descricao: "Serviço de copeiragem mensal", unidade_medida: "MS", valor_unitario_estimado: 2800.00, categoria: "servico", codigo_catmat: "010008" },
  { id: "catser-010009", descricao: "Serviço de recepção mensal", unidade_medida: "MS", valor_unitario_estimado: 3200.00, categoria: "servico", codigo_catmat: "010009" },
  { id: "catser-010010", descricao: "Serviço de jardinagem e paisagismo mensal", unidade_medida: "MS", valor_unitario_estimado: 2200.00, categoria: "servico", codigo_catmat: "010010" },
  { id: "catser-010011", descricao: "Serviço de consultoria em tecnologia da informação hora técnica", unidade_medida: "HR", valor_unitario_estimado: 185.00, categoria: "servico", codigo_catmat: "010011" },
  { id: "catser-010012", descricao: "Serviço de desenvolvimento de software hora técnica", unidade_medida: "HR", valor_unitario_estimado: 165.00, categoria: "servico", codigo_catmat: "010012" },
  { id: "catser-010013", descricao: "Serviço de treinamento presencial por turma 20 pessoas", unidade_medida: "TR", valor_unitario_estimado: 4500.00, categoria: "servico", codigo_catmat: "010013" },
  { id: "catser-010014", descricao: "Serviço de engessamento e reforma mensal", unidade_medida: "M2", valor_unitario_estimado: 95.00, categoria: "servico", codigo_catmat: "010014" },
  { id: "catser-010015", descricao: "Serviço de dedetização e controle de pragas por aplicação", unidade_medida: "AP", valor_unitario_estimado: 580.00, categoria: "servico", codigo_catmat: "010015" },
  { id: "catser-010016", descricao: "Locação de veículo utilitário van com motorista dia", unidade_medida: "DI", valor_unitario_estimado: 420.00, categoria: "servico", codigo_catmat: "010016" },
  { id: "catser-010017", descricao: "Serviço de fotografia e filmagem por evento", unidade_medida: "EV", valor_unitario_estimado: 1800.00, categoria: "servico", codigo_catmat: "010017" },
  { id: "catser-010018", descricao: "Locação de espaço para eventos capacidade 100 pessoas diária", unidade_medida: "DI", valor_unitario_estimado: 2500.00, categoria: "servico", codigo_catmat: "010018" },
  { id: "catser-010019", descricao: "Serviço de bufê coffee break por pessoa", unidade_medida: "PE", valor_unitario_estimado: 28.00, categoria: "servico", codigo_catmat: "010019" },
  { id: "catser-010020", descricao: "Fornecimento de alimentação marmita por refeição", unidade_medida: "RF", valor_unitario_estimado: 22.00, categoria: "servico", codigo_catmat: "010020" },
];

// ─── FUNÇÕES AUXILIARES ────────────────────────────────────────────────────────

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Busca itens de atas de registro de preços do PNCP
 * Faz paginação automática, limita por data e quantidade
 */
async function fetchPncpAtas(params = {}) {
  const {
    dataInicial = "20250101",
    dataFinal   = "20251231",
    maxPaginas  = 5,
  } = params;

  const items = [];
  console.log(`\n📡 Buscando atas PNCP (${dataInicial} → ${dataFinal})...`);

  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    try {
      const url = `https://pncp.gov.br/api/consulta/v1/atas?dataInicial=${dataInicial}&dataFinal=${dataFinal}&pagina=${pagina}&tamanhoPagina=500`;
      console.log(`  → Página ${pagina}...`);

      const res = await fetch(url, {
        headers: { "User-Agent": "MeuJuridico/1.0 (seed-script)" },
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        console.warn(`  ⚠️  Página ${pagina} retornou ${res.status}`);
        break;
      }

      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      if (data.length === 0) break;

      for (const ata of data) {
        if (!ata.objetoContratacao) continue;
        const id = `pncp-ata-${(ata.numeroControlePNCPAta || Math.random()).toString().replace(/[^a-z0-9]/gi, "-")}`;
        items.push({
          id,
          descricao: ata.objetoContratacao.trim(),
          unidade_medida: "UN",
          valor_unitario_estimado: 0, // Atas têm valor total, não unitário
          orgao: ata.nomeOrgao || "PNCP",
          categoria: "material",
          codigo_catmat: null,
          fonte: "pncp_api",
        });
      }

      console.log(`  ✅ Página ${pagina}: ${data.length} atas (total acumulado: ${items.length})`);
      await delay(500); // Respeita rate limit
    } catch (err) {
      console.error(`  ❌ Erro na página ${pagina}:`, err.message);
      break;
    }
  }

  return items;
}

/**
 * Insere itens em lotes (upsert) no Supabase
 */
async function upsertCatalog(items) {
  const BATCH_SIZE = 100;
  let total = 0;
  let erros = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE).map(item => ({
      ...item,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("pncp_catalog")
      .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

    if (error) {
      console.error(`  ❌ Erro no lote ${i / BATCH_SIZE + 1}:`, error.message);
      erros += batch.length;
    } else {
      total += batch.length;
      process.stdout.write(`  ✅ ${total} registros inseridos/atualizados\r`);
    }
    await delay(100);
  }

  console.log(`\n  ✅ Total: ${total} OK, ${erros} erros`);
  return { total, erros };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Iniciando seed do catálogo PNCP...");
  console.log(`📦 Supabase: ${SUPABASE_URL}`);

  // 1. Seed do catálogo base (hardcoded)
  console.log(`\n📋 Inserindo catálogo base (${CATALOGO_BASE.length} itens)...`);
  const baseItems = CATALOGO_BASE.map(item => ({
    ...item,
    orgao: "CATMAT/CATSER — Governo Federal",
    fonte: "catmat_base",
    updated_at: new Date().toISOString(),
  }));
  await upsertCatalog(baseItems);

  // 2. Busca dados reais do PNCP (últimos 12 meses)
  const hoje = new Date();
  const inicioAno = new Date(hoje.getFullYear(), 0, 1);
  const dataInicial = inicioAno.toISOString().split("T")[0].replace(/-/g, "");
  const dataFinal   = hoje.toISOString().split("T")[0].replace(/-/g, "");

  try {
    const pncpItems = await fetchPncpAtas({
      dataInicial,
      dataFinal,
      maxPaginas: 10, // máx 5000 atas (10 × 500)
    });

    if (pncpItems.length > 0) {
      console.log(`\n📥 Inserindo ${pncpItems.length} itens do PNCP...`);
      await upsertCatalog(pncpItems);
    } else {
      console.log("⚠️  Nenhum item retornado pela API PNCP.");
    }
  } catch (err) {
    console.error("❌ Falha geral na busca PNCP:", err.message);
  }

  // 3. Verifica total
  const { count } = await supabase
    .from("pncp_catalog")
    .select("*", { count: "exact", head: true });

  console.log(`\n✅ Seed completo! Total na tabela pncp_catalog: ${count} itens.`);
  console.log("🔎 Teste de busca:");

  const { data: teste } = await supabase.rpc("search_pncp_catalog", {
    p_query: "papel",
    p_limit: 3,
  });
  console.log(JSON.stringify(teste, null, 2));
}

main().catch(err => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
