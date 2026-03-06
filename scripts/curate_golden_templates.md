# Plano de Curadoria: 50 Golden Templates para ETP (15+ páginas)

## Objetivo
Garantir que a IA do MeuJurídico.ai gere ETPs e Termos de Referência completos, técnicos e profundos, com qualidade superior aos concorrentes (que entregam 3 a 4 páginas rasas). O marco de qualidade da administração federal é um ETP de 15 a 45 páginas.

## Como a IA Vai Trabalhar (RAG + Few-Shot Prompting)
Em vez de depender do conhecimento cru do Gemini/GPT (o que gera textos genéricos), nosso banco vetorial (Pinecone/Weaviate no backend da Lovable) vai armazenar **pares de instrução-resultado perfeitos**.

Quando a prefeitura pedir: *"Gerar ETP de Limpeza Terceirizada"*.
A IA vai buscar no banco os **3 melhores ETPs de Limpeza do Brasil** e injetar no prompt as seções correspondentes como "Exemplo 1, Exemplo 2. Agora gere o atual baseado na necessidade local."

## A Missão: 10 Segmentos x 5 Templates (50 Templates Ouro)

A equipe precisará baixar do **PNCP Oficial (ComprasNet / Federal)** ETPs recém-homologados (pós-2023, Lei 14.133/21) de órgãos de excelência (TCU, STF, Polícia Federal, Universidades Federais).

**Segmentos Principais:**
1.  **Tecnologia da Informação (TIC):** Aquisição de Computadores/Notebooks, Licenciamento de Software (Microsoft/Adobe), Links de Internet.
2.  **Serviços Contínuos c/ Mão de Obra:** Limpeza e Conservação, Vigilância/Segurança Armada, Recepcionista/Apoio Administrativo.
3.  **Manutenção Predial e Obras Menores:** Manutenção de Ar Condicionado (PMOC), Pintura e Reparos Prediais.
4.  **Transporte e Veículos:** Locação de Veículos (com e sem motorista), Aquisição de Pneus, Fornecimento de Combustível.
5.  **Saúde e Medicamentos:** Aquisição de Insumos Hospitalares/Odontológicos, Equipamentos Médicos.
6.  **Educação e Assistência:** Nutrição/Merenda Escolar, Uniformes Escolares, Material Didático.
7.  **Eventos e Promoções:** Locação de Estruturas (Tendas/Palcos), Serviço de Buffet/Coffee Break.
8.  **Mobiliário:** Cadeiras Ergonômicas, Mesas e Estações de Trabalho.
9.  **Limpeza e Higiene (Materiais):** Aquisição de Materiais de Limpeza, Papel Toalha, Sabonetes.
10. **Comunicação e Marketing:** Serviços de Agência de Publicidade, Serviços Gráficos.

## Formato Guardado
Cada PDF deve ser extraído e tratado. Nós converteremos em arquivos de texto (Markdown) limpos para a IA, divididos pelas 14 seções da IN 58/2022 que recém cadastramos no banco.
