#!/usr/bin/env node

import * as p from "@clack/prompts";
import chalk from "chalk";
import { generateChallenge, Provider, ModelConfig } from "./generator";
import { setupProject } from "./setup";
import { Framework, Difficulty } from "./types";
import { getApiKey, ensureConfigDir } from "./config";

const PROVIDER_MODELS: Record<Provider, { label: string; models: { value: string; label: string; hint: string }[] }> = {
  anthropic: {
    label: "🟣 Anthropic (Claude)",
    models: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", hint: "Recomendado — rápido e inteligente" },
      { value: "claude-opus-4-20250514", label: "Claude Opus 4", hint: "Mais poderoso" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", hint: "Mais rápido e barato" },
    ],
  },
  openai: {
    label: "🟢 OpenAI (GPT)",
    models: [
      { value: "gpt-4o", label: "GPT-4o", hint: "Recomendado" },
      { value: "gpt-4.1", label: "GPT-4.1", hint: "Mais recente" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini", hint: "Mais rápido e barato" },
      { value: "o3-mini", label: "o3-mini", hint: "Raciocínio avançado" },
    ],
  },
  openrouter: {
    label: "🔶 OpenRouter (multi-modelo)",
    models: [
      { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", hint: "Open source, gratuito" },
      { value: "deepseek/deepseek-chat", label: "DeepSeek Chat", hint: "Ótimo para código" },
      { value: "deepseek/deepseek-r1", label: "DeepSeek R1", hint: "Raciocínio avançado" },
      { value: "mistralai/mistral-large", label: "Mistral Large", hint: "Europeu, muito bom" },
      { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", hint: "Rápido e barato" },
      { value: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4 via OR", hint: "Claude pelo OpenRouter" },
    ],
  },
  google: {
    label: "🔵 Google (Gemini)",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", hint: "Rápido e gratuito" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", hint: "Mais poderoso" },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", hint: "Mais rápido" },
    ],
  },
  qwen: {
    label: "🟠 Qwen (Alibaba)",
    models: [
      { value: "qwen3-coder-plus", label: "Qwen3 Coder Plus", hint: "Recomendado — modelo de código" },
      { value: "qwen-plus", label: "Qwen Plus", hint: "Equilíbrio entre velocidade e qualidade" },
      { value: "qwen-turbo", label: "Qwen Turbo", hint: "Mais rápido e barato" },
      { value: "qwen-max", label: "Qwen Max", hint: "Mais poderoso" },
    ],
  },
};

const ENV_KEY_MAP: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  google: "GEMINI_API_KEY",
  qwen: "DASHSCOPE_API_KEY",
};

async function main() {
  console.clear();

  p.intro(chalk.bgCyan(chalk.black(" 🚀 DevChallenge CLI — Aprenda Praticando! ")));

  // 1. Provedor
  const provider = await p.select({
    message: "Qual provedor de IA você quer usar?",
    options: (Object.keys(PROVIDER_MODELS) as Provider[]).map((key) => ({
      value: key,
      label: PROVIDER_MODELS[key].label,
    })),
  });

  if (p.isCancel(provider)) { p.cancel("Cancelado."); process.exit(0); }

  // 2. Modelo
  const modelOptions = PROVIDER_MODELS[provider as Provider].models;
  const model = await p.select({
    message: "Qual modelo?",
    options: modelOptions,
  });

  if (p.isCancel(model)) { p.cancel("Cancelado."); process.exit(0); }

  // 3. API Key (tenta env → config file → pede)
  const envMap: Record<Provider, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    google: "GEMINI_API_KEY",
    qwen: "DASHSCOPE_API_KEY",
  };
  const envKey = envMap[provider as Provider];
  let apiKey = getApiKey(provider as string);

  if (apiKey) {
    const source = process.env[envKey] ? "variável de ambiente" : "arquivo de config";
    p.log.success(`✅ API Key encontrada no ${source}.`);
  } else {
    const inputKey = await p.password({
      message: `Cole sua API Key (${envKey}):`,
      validate: (v) => (!v || v.trim().length < 10 ? "API Key inválida." : undefined),
    });
    if (p.isCancel(inputKey)) { p.cancel("Cancelado."); process.exit(0); }
    apiKey = inputKey.toString().trim();
  }

  const modelConfig: ModelConfig = {
    provider: provider as Provider,
    model: model.toString(),
    apiKey,
  };

  // 4. Framework
  const framework = await p.select({
    message: "Qual linguagem/framework você quer praticar?",
    options: [
      { value: "nextjs", label: "⚡ Next.js", hint: "React + SSR/SSG" },
      { value: "react", label: "⚛️  React", hint: "Vite + React" },
      { value: "typescript", label: "🟦 TypeScript", hint: "Node.js + TS puro" },
      { value: "vue", label: "💚 Vue.js", hint: "Vite + Vue 3" },
      { value: "node", label: "🟩 Node.js", hint: "Express + Node" },
    ],
  });

  if (p.isCancel(framework)) { p.cancel("Cancelado."); process.exit(0); }

  // 5. Dificuldade
  const difficulty = await p.select({
    message: "Qual nível de dificuldade?",
    options: [
      { value: "easy", label: "🟢 Fácil", hint: "Conceitos básicos, bastante orientação" },
      { value: "medium", label: "🟡 Médio", hint: "Conceitos intermediários, orientação moderada" },
      { value: "hard", label: "🔴 Difícil", hint: "Conceitos avançados, pouca orientação" },
    ],
  });

  if (p.isCancel(difficulty)) { p.cancel("Cancelado."); process.exit(0); }

  // 6. Assunto
  const topic = await p.text({
    message: "Qual assunto específico você deseja praticar?",
    placeholder: "Ex: React Query, Server Components, JWT Auth...",
    validate(value) {
      if (!value || value.trim().length < 3) return "Descreva um assunto com pelo menos 3 caracteres.";
    },
  });

  if (p.isCancel(topic)) { p.cancel("Cancelado."); process.exit(0); }

  // 7. Nome do projeto
  const defaultName = `desafio-${framework}-${topic.toString().toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`;
  const projectName = await p.text({
    message: "Nome da pasta do projeto?",
    defaultValue: defaultName,
    placeholder: defaultName,
  });

  if (p.isCancel(projectName)) { p.cancel("Cancelado."); process.exit(0); }

  console.log("");

  // 8. Gerar desafio com IA
  const spinner = p.spinner();
  spinner.start(`🤖 Gerando desafio com ${PROVIDER_MODELS[provider as Provider].label}...`);

  let challenge;
  try {
    challenge = await generateChallenge(
      { framework: framework as Framework, difficulty: difficulty as Difficulty, topic: topic.toString() },
      modelConfig
    );
    spinner.stop("✅ Desafio gerado com sucesso!");
  } catch (error) {
    spinner.stop("❌ Erro ao gerar desafio.");
    p.log.error(`Falha na API: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // 9. Criar projeto
  spinner.start("📦 Criando estrutura do projeto...");
  try {
    const projectPath = await setupProject({
      projectName: projectName.toString(),
      framework: framework as Framework,
      challenge,
    });
    spinner.stop("✅ Projeto criado!");

    console.log("");
    p.note(
      [
        `📁 Projeto: ${chalk.cyan(projectPath)}`,
        "",
        `${chalk.bold("Para começar:")}`,
        `  ${chalk.cyan(`cd ${projectName}`)}`,
        `  ${chalk.cyan("npm install")}`,
        `  ${chalk.cyan("npm run dev")}`,
        "",
        `${chalk.bold("Leia o desafio:")}`,
        `  ${chalk.cyan("cat DESAFIO.md")}`,
      ].join("\n"),
      "🎯 Tudo pronto!"
    );

    p.outro(chalk.green("Bora codar! 💪 Boa sorte!"));
  } catch (error) {
    spinner.stop("❌ Erro ao criar projeto.");
    p.log.error(`Falha: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red("Erro inesperado:"), err);
  process.exit(1);
});
