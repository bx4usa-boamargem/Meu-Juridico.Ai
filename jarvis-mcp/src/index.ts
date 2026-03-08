import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";

import { getProjectState } from "./tools/get_project_state.js";
import { listTasks } from "./tools/list_tasks.js";
import { createTask } from "./tools/create_task.js";
import { getAgentsRegistry } from "./tools/get_agents_registry.js";
import { getSkillsRegistry } from "./tools/get_skills_registry.js";
import { createAgent } from "./tools/create_agent.js";
import { createSkill } from "./tools/create_skill.js";
import { createAntigravityTask } from "./tools/create_antigravity_task.js";

const server = new Server(
    { name: "jarvis", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

// ─── Tool Manifest ────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "get_project_state",
            description: "Retorna o estado atual de um projeto buscando do banco de dados Jarvis.",
            inputSchema: {
                type: "object",
                properties: {
                    project_name: { type: "string" },
                },
                required: ["project_name"],
            },
        },
        {
            name: "list_tasks",
            description: "Lista as tasks mais recentes de um projeto do banco de dados Jarvis.",
            inputSchema: {
                type: "object",
                properties: {
                    project_id: { type: "string" },
                    limit: { type: "number" },
                },
                required: ["project_id"],
            },
        },
        {
            name: "create_task",
            description: "Cria uma nova task no banco de dados do Jarvis para um projeto.",
            inputSchema: {
                type: "object",
                properties: {
                    project_id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                },
                required: ["project_id", "title"],
            },
        },
    ],
}));

// ─── Tool Router ──────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case "get_project_state": return await getProjectState(args?.project_name as string);
        case "list_tasks": return await listTasks(args?.project_id as string, args?.limit as number);
        case "create_task": return await createTask(args as any);
        default: throw new Error(`Tool desconhecida: "${name}"`);
    }
});

// ─── Bootstrap (Dual Mode: Stdio & SSE) ──────────────────────────────────────
async function main() {
    const isSSE = process.env.TRANSPORT === "sse" || process.env.NODE_ENV === "production";

    if (isSSE) {
        const app = express();
        app.use(cors());
        app.use(bodyParser.json());

        let transport: SSEServerTransport | null = null;

        app.get("/", (req, res) => {
            res.send("<h1>✅ Jarvis MCP Server is Online</h1><p>Endpoint: /sse</p>");
        });

        app.get("/sse", async (req: Request, res: Response) => {
            console.error("🔌 Nova conexão SSE recebida");
            transport = new SSEServerTransport("/messages", res);
            await server.connect(transport);
        });

        app.post("/messages", async (req: Request, res: Response) => {
            if (transport) {
                await transport.handlePostMessage(req, res);
            } else {
                res.status(400).send("Transporte não inicializado");
            }
        });

        const port = Number(process.env.PORT) || 3000;
        app.listen(port, "0.0.0.0", () => {
            console.error(`✅ Jarvis MCP Server rodando via SSE na porta ${port}`);
            console.error(`🔗 Endpoint: http://0.0.0.0:${port}/sse`);
        });
    } else {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("✅ Jarvis MCP Server online (stdio)");
    }
}

main().catch(console.error);
