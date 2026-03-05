async function checkAPI(name, url, isXml = false) {
    const start = Date.now();
    console.log(`\n--- Testando ${name} ---`);
    try {
        const res = await fetch(url);
        const lat = Date.now() - start;
        if (!res.ok) {
            console.log(`[ERRO] Status: ${res.status} | Latência: ${lat}ms`);
            return;
        }
        const text = await res.text();
        console.log(`[OK] Status: 200 | Latência: ${lat}ms`);

        // Print snippet
        if (isXml || name === 'Planalto') {
            console.log("Snippet:", text.substring(0, 150).replace(/\n/g, ' ') + "...");
        } else {
            const json = JSON.parse(text);
            let snippet = JSON.stringify(json).substring(0, 150);
            console.log("Snippet JSON:", snippet + "...");
        }
    } catch (err) {
        console.log(`[ERRO FATAL] ${err.message}`);
    }
}

async function run() {
    console.log("=========================================");
    console.log(" TESTE DE APIs PÚBLICAS (MÓDULO B)");
    console.log("=========================================");

    await checkAPI('PNCP', 'https://pncp.gov.br/api/pncp/v1/orgaos/00394460000141/compras?dataInicial=20240101&dataFinal=20241231&pagina=1');
    await checkAPI('ComprasGov', 'https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?pagina=1');
    await checkAPI('LexML', 'https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve&version=1.1&query=urn+any+14133+and+date+any+2021&maximumRecords=5&startRecord=1', true);
    await checkAPI('TCU', 'https://dados-abertos.apps.tcu.gov.br/api/acordao/recupera-acordaos?inicio=0&quantidade=3');
    await checkAPI('Planalto', 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm', true);
}

run();
