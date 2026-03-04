import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Document, Paragraph, TextRun, HeadingLevel, Packer, Footer } from 'https://esm.sh/docx@8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { document_id } = await req.json()
        if (!document_id) {
            throw new Error('document_id is required')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch document
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select('doc_type, section_memories, process_id')
            .eq('id', document_id)
            .single()

        if (docError || !document) {
            throw new Error(`Document not found: ${docError?.message || 'No data'}`)
        }

        // 2. Fetch template details
        const { data: template, error: tmplError } = await supabase
            .from('document_templates')
            .select('name, sections_plan')
            .eq('doc_type', document.doc_type)
            .single()

        if (tmplError || !template) {
            throw new Error(`Template not found: ${tmplError?.message || 'No data'}`)
        }

        const sectionsPlan = Array.isArray(template.sections_plan)
            ? template.sections_plan
            : (JSON.parse(template.sections_plan as string) || [])

        // Sort sections by order_index
        sectionsPlan.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))

        const memories = (document.section_memories as Record<string, any>) || {}

        // 3. Build DOCX
        const children: any[] = []

        // Capa (Simple Header)
        children.push(
            new Paragraph({
                text: template.name || 'Documento',
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 },
            })
        )

        if (document.process_id) {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `Processo: `, bold: true }),
                        new TextRun({ text: document.process_id }),
                    ],
                    spacing: { after: 200 }
                })
            )
        }

        const data = new Date().toLocaleDateString('pt-BR')
        children.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `Data de Geração: `, bold: true }),
                    new TextRun({ text: data }),
                ],
                spacing: { after: 600 }
            })
        )

        // Para cada seção na ordem
        for (const section of sectionsPlan) {
            const sectionId = section.section_id
            const memory = memories[sectionId]
            const content = memory?.content || ''

            // Título da seção
            children.push(
                new Paragraph({
                    text: section.title,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 400, after: 200 },
                })
            )

            // Separar por quebras de linha reais para criar parágrafos separados
            const paragraphsText = content.split('\n').map((p: string) => p.trim()).filter(Boolean)

            if (paragraphsText.length === 0) {
                children.push(
                    new Paragraph({
                        children: [new TextRun({ text: 'Sem conteúdo gerado.', italics: true })],
                    })
                )
            } else {
                for (const text of paragraphsText) {
                    children.push(
                        new Paragraph({
                            children: [new TextRun({ text })],
                            spacing: { after: 120 }
                        })
                    )
                }
            }
        }

        const doc = new Document({
            sections: [{
                properties: {},
                headers: {
                    default: undefined
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Gerado por MeuJurídico.ai — Lei 14.133/2021", size: 20, color: "999999" })
                                ]
                            })
                        ]
                    })
                },
                children,
            }]
        })

        const buffer = await Packer.toBuffer(doc)

        return new Response(buffer, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${document.doc_type}-${document_id}.docx"`
            }
        })

    } catch (error: any) {
        console.error('Error generating DOCX:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
