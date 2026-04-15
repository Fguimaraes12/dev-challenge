import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChallengeOptions, Challenge } from "./types";
import { getBaseUrl } from "./config";

export type Provider = "anthropic" | "openai" | "openrouter" | "google" | "qwen";

export interface ModelConfig {
  provider: Provider;
  model: string;
  apiKey: string;
}

const difficultyMap = {
  easy: "fácil (básico, muito comentado, com dicas detalhadas, ideal para iniciantes)",
  medium: "médio (intermediário, moderadamente comentado, algumas dicas, requer conhecimento básico)",
  hard: "difícil (avançado, pouco comentado, desafiador, requer bom conhecimento do framework)",
};

const frameworkInstructions: Record<string, string> = {
  nextjs: "Next.js 14+ com App Router. Use TypeScript. Pode usar TailwindCSS para estilos básicos.",
  react: "React 18+ com Vite. Use TypeScript. Pode usar TailwindCSS.",
  typescript: "TypeScript puro com Node.js. Sem frameworks de UI.",
  vue: "Vue 3 com Vite e Composition API. Use TypeScript.",
  node: "Node.js com Express e TypeScript.",
};

function buildPrompt(options: ChallengeOptions): string {
  const { framework, difficulty, topic } = options;
  return `Você é um instrutor sênior de desenvolvimento web criando um desafio prático de programação.

Framework: ${framework} (${frameworkInstructions[framework]})
Dificuldade: ${difficultyMap[difficulty]}
Assunto: ${topic}

Crie um desafio prático completo. Responda APENAS com um JSON válido, sem markdown, sem \`\`\`json, sem explicações fora do JSON.

O JSON deve ter exatamente esta estrutura:
{
  "title": "Título do desafio",
  "description": "Descrição detalhada do que o aluno vai construir (2-3 frases)",
  "objectives": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "hints": ["dica 1", "dica 2", "dica 3"],
  "files": [
    {
      "path": "caminho/do/arquivo.tsx",
      "content": "conteúdo completo do arquivo com TODO comentários onde o aluno deve implementar"
    }
  ],
  "solution_notes": "Explicação de como seria a solução ideal, sem revelar o código"
}

REGRAS IMPORTANTES:
1. Você DEVE gerar TODOS os arquivos necessários para o projeto funcionar — incluindo package.json, tsconfig.json, e qualquer config de build.
2. Os arquivos de código devem ter partes PARCIALMENTE implementadas com // TODO: onde o aluno deve completar.
3. Os arquivos de configuração (package.json, tsconfig.json, etc.) devem estar COMPLETOS e corretos.
4. O projeto deve rodar com apenas "npm install" + "npm run dev".
5. Crie entre 2 e 5 arquivos de código fonte (além dos configs).
6. Se for Next.js, use App Router (app/ directory), inclua: package.json (next, react, react-dom, typescript), tsconfig.json, next.config.js, src/app/layout.tsx, src/app/page.tsx
7. Se for React com Vite, inclua: package.json (react, react-dom, vite, @vitejs/plugin-react, typescript), tsconfig.json, vite.config.ts, index.html, src/App.tsx, src/main.tsx
8. Se for Vue com Vite, inclua: package.json (vue, vite, @vitejs/plugin-vue, typescript), tsconfig.json, vite.config.ts, index.html, src/App.vue, src/main.ts
9. Se for TypeScript puro ou Node, inclua: package.json (typescript, ts-node, @types/node), tsconfig.json, src/index.ts
10. Se for Node.js com Express, inclua também express, cors, @types/express, @types/cors nas dependências.
11. Use versões reais e estáveis dos pacotes.
12. Inclua um arquivo de tipos TypeScript se relevante.
13. Não gere .gitignore — o CLI cria automaticamente.`;
}

function parseJson(text: string): Challenge {
  let clean = text.trim();
  clean = clean.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");

  const challenge: Challenge = JSON.parse(clean);
  if (!challenge.title || !challenge.description || !challenge.files?.length) {
    throw new Error("Resposta da IA incompleta ou mal formatada");
  }
  return challenge;
}

async function callAnthropic(prompt: string, model: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });
  const content = response.content[0];
  if (content.type !== "text") throw new Error("Resposta inesperada da API Anthropic");
  return content.text;
}

async function callOpenAI(prompt: string, model: string, apiKey: string, baseURL?: string): Promise<string> {
  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  const response = await client.chat.completions.create({
    model,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0].message.content ?? "";
}

async function callGoogle(prompt: string, model: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });
  const result = await genModel.generateContent(prompt);
  return result.response.text();
}

export async function generateChallenge(
  options: ChallengeOptions,
  modelConfig: ModelConfig
): Promise<Challenge> {
  const prompt = buildPrompt(options);
  const { provider, model, apiKey } = modelConfig;

  let rawText: string;

  switch (provider) {
    case "anthropic":
      rawText = await callAnthropic(prompt, model, apiKey);
      break;
    case "openai":
      rawText = await callOpenAI(prompt, model, apiKey);
      break;
    case "openrouter":
      rawText = await callOpenAI(prompt, model, apiKey, "https://openrouter.ai/api/v1");
      break;
    case "google":
      rawText = await callGoogle(prompt, model, apiKey);
      break;
    case "qwen":
      rawText = await callOpenAI(prompt, model, apiKey, getBaseUrl("qwen") || "https://dashscope.aliyuncs.com/compatible-mode/v1");
      break;
    default:
      throw new Error(`Provedor desconhecido: ${provider}`);
  }

  try {
    return parseJson(rawText);
  } catch (err) {
    throw new Error(`Falha ao processar resposta da IA: ${err instanceof Error ? err.message : String(err)}`);
  }
}
