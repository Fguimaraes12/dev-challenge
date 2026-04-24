#!/usr/bin/env node

import * as p from "@clack/prompts";
import chalk from "chalk";
import { generateChallenge, Provider, ModelConfig } from "./generator";
import { setupProject } from "./setup";
import { Framework, Difficulty } from "./types";
import { getApiKey, ensureConfigDir, CONFIG_DIR, getLastModel, saveLastModel } from "./config";
import { hintGreen, hintRed, hintYellow } from "./utils/colors/hints";


const PROVIDER_MODELS: Record<
  Provider,
  { label: string; models: { value: string; label: string; hint: string }[] }
> = {
  anthropic: {
    label: "Anthropic (Claude)",
    models: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", hint: hintGreen("Recomendado — rápido e inteligente") },
      { value: "claude-opus-4-20250514", label: "Claude Opus 4", hint: hintGreen("Mais poderoso") },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", hint: hintGreen("Mais rápido e barato") },
    ],
  },
  openai: {
    label: "OpenAI (GPT)",
    models: [
      { value: "gpt-4o", label: "GPT-4o", hint: hintGreen("Recomendado") },
      { value: "gpt-4.1", label: "GPT-4.1", hint: hintGreen("Mais recente") },
      { value: "gpt-4o-mini", label: "GPT-4o Mini", hint: hintGreen("Mais rápido e barato") },
      { value: "o3-mini", label: "o3-mini", hint: hintGreen("Raciocínio avançado") },
    ],
  },
  google: {
    label: "Google (Gemini)",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", hint: hintGreen("Rápido e gratuito") },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", hint: hintGreen("Mais poderoso") },
      { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", hint: hintGreen("Mais rápido") },
    ],
  },
  qwen: {
    label: "Qwen (Alibaba)",
    models: [
      { value: "qwen3-coder-plus", label: "Qwen3 Coder Plus", hint: hintGreen("Recomendado — modelo de código") },
      { value: "qwen-plus", label: "Qwen Plus", hint: hintGreen("Equilíbrio entre velocidade e qualidade") },
      { value: "qwen-turbo", label: "Qwen Turbo", hint: hintGreen("Mais rápido e barato") },
      { value: "qwen-max", label: "Qwen Max", hint: hintGreen("Mais poderoso") },
    ],
  },
  openrouter: {
    label: chalk.green("OpenRouter (Modelos Free & Pagos)"),
    models: [
      { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" + chalk.green(" FREE"), hint: hintGreen("Open source, gratuito") },
      { value: "deepseek/deepseek-chat", label: "DeepSeek Chat" + chalk.green(" FREE"), hint: hintGreen("Ótimo para código") },
      { value: "deepseek/deepseek-r1", label: "DeepSeek R1" + chalk.green(" FREE"), hint: hintGreen("Raciocínio avançado") },
      { value: "mistralai/mistral-large", label: "Mistral Large", hint: hintGreen("Europeu, muito bom") },
      { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", hint: hintGreen("Rápido e barato") },
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

async function selectProviderAndModel(): Promise<ModelConfig> {
  const provider = await p.select({
    message: "Qual provedor de IA você quer usar?",
    options: (Object.keys(PROVIDER_MODELS) as Provider[]).map((key) => ({
      value: key,
      label: PROVIDER_MODELS[key].label,
    })),
  });

  if (p.isCancel(provider)) { p.cancel("Cancelado."); process.exit(0); }

  const modelOptions = PROVIDER_MODELS[provider as Provider].models;
  const model = await p.select({
    message: "Qual modelo?",
    options: modelOptions,
  });

  if (p.isCancel(model)) { p.cancel("Cancelado."); process.exit(0); }

  const envKey = ENV_KEY_MAP[provider as Provider];
  let apiKey = getApiKey(provider as string);

  if (apiKey) {
    const source = process.env[envKey] ? "variável de ambiente" : "arquivo de config";
    p.log.success(`✅ API Key encontrada no ${source}. ${chalk.green(`seu diretório: ${CONFIG_DIR}`)}`);
  } else {
    const inputKey = await p.password({
      message: `Cole sua API Key (${envKey}) ${envKey === "OPENROUTER_API_KEY" ? chalk.green("primeira vez? crie sua conta --> https://openrouter.ai/") : ""} :`,
      validate: (v) => !v || v.trim().length < 10 ? "API Key inválida." : undefined,
    });
    if (p.isCancel(inputKey)) { p.cancel("Cancelado."); process.exit(0); }
    apiKey = inputKey.toString().trim();
  }

  const chosenModelLabel =
    modelOptions.find((m) => m.value === model.toString())?.label ?? model.toString();

  saveLastModel({
    provider: provider as string,
    model: model.toString(),
    modelLabel: chosenModelLabel.replace(/\u001b\[[0-9;]*m/g, ""),
    apiKey,
  });

  return {
    provider: provider as Provider,
    model: model.toString(),
    apiKey,
  };
}

async function main() {
  const ascii = `
██████╗ ███████╗██╗   ██╗                                                  
██╔══██╗██╔════╝██║   ██║                                                  
██║  ██║█████╗  ██║   ██║                                                  
██║  ██║██╔══╝  ╚██╗ ██╔╝                                                  
██████╔╝███████╗ ╚████╔╝                                                   
╚═════╝ ╚══════╝  ╚═══╝                                                    
`;

  const asciiTwo = `                                                 
                                                                          
  ██████╗██╗  ██╗ █████╗ ██╗     ██╗     ███████╗███╗   ██╗ ██████╗ ███████╗
 ██╔════╝██║  ██║██╔══██╗██║     ██║     ██╔════╝████╗  ██║██╔════╝ ██╔════╝
 ██║     ███████║███████║██║     ██║     █████╗  ██╔██╗ ██║██║  ███╗█████╗  
 ██║     ██╔══██║██╔══██║██║     ██║     ██╔══╝  ██║╚██╗██║██║   ██║██╔══╝  
 ╚██████╗██║  ██║██║  ██║███████╗███████╗███████╗██║ ╚████║╚██████╔╝███████╗
  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
 `;

  const asciiGroup = ascii + asciiTwo;
  const termWidth = process.stdout.columns || 80;

  if (termWidth >= 110) {
    const lines = asciiGroup.split('\n').filter(Boolean);

    const start = { r: 16, g: 204, b: 113 }; // #2ecc71 (esquerda)

    const devLineCount = ascii.split('\n').filter(Boolean).length;
    const maxLen = Math.max(...lines.map((l) => l.trimEnd().length));

    lines.forEach((line, i) => {
      const isDev = i < devLineCount;

      const end = isDev
        ? { r: 10, g: 120,  b: 70}  // verde escuro — DEV (usa tamanho da própria linha)
        : { r: 10, g: 80, b: 35 }; // verde médio — CHALLENGE (usa maxLen global)

      // DEV: referência = tamanho da própria linha (garante que escurece até o fim)
      // CHALLENGE: referência = maxLen global (gradiente consistente entre as linhas)
      const refLen = isDev ? line.trimEnd().length : maxLen;

      const colored = line
        .split("")
        .map((char, j) => {
          const ratio = refLen <= 1 ? 0 : j / (refLen - 1);
          const r = Math.round(start.r + (end.r - start.r) * ratio);
          const g = Math.round(start.g + (end.g - start.g) * ratio);
          const b = Math.round(start.b + (end.b - start.b) * ratio);
          return chalk.rgb(r, g, b)(char);
        })
        .join("");
      console.log(colored);
    });
  } else {
    console.log(chalk.green("\n🚀 DEV CHALLENGE\n"));
  }

  ensureConfigDir();

  const lastModel = getLastModel();
  let modelConfig: ModelConfig;

  if (!lastModel) {
    modelConfig = await selectProviderAndModel();
  } else {
    const mode = await p.select({
      message: "Como você quer usar a IA?",
      options: [
        {
          value: "last",
          label: chalk.white(`⚡ Usar último modelo (${lastModel.modelLabel})`),
          hint: hintGreen("Continuar de onde parou — sem reconfiguração!"),
        },
        {
          value: "custom",
          label: "🔑 Escolher provedor e modelo",
          hint: hintYellow("Anthropic, OpenAI, Google, Qwen, OpenRouter..."),
        },
      ],
    });

    if (p.isCancel(mode)) { p.cancel("Cancelado."); process.exit(0); }

    if (mode === "last") {
      modelConfig = {
        provider: lastModel.provider as Provider,
        model: lastModel.model,
        apiKey: lastModel.apiKey,
      };
      p.log.success(chalk.green(`✅ Usando ${lastModel.modelLabel} (${lastModel.provider})`));
    } else {
      modelConfig = await selectProviderAndModel();
    }
  }

  const framework = await p.select({
    message: "Qual linguagem/framework você quer praticar?",
    options: [
      { value: "nextjs", label: "Next.js", hint: hintGreen("React + SSR/SSG") },
      { value: "react", label: "React", hint: hintGreen("Vite + React") },
      { value: "typescript", label: "TypeScript", hint: hintGreen("Node.js + TS puro") },
      { value: "vue", label: "Vue.js", hint: hintGreen("Vite + Vue 3") },
      { value: "node", label: "Node.js", hint: hintGreen("Express + Node") },
    ],
  });

  if (p.isCancel(framework)) { p.cancel("Cancelado."); process.exit(0); }

  const difficulty = await p.select({
    message: "Qual nível de dificuldade?",
    options: [
      { value: "easy", label: "Fácil", hint: hintGreen("Conceitos básicos, bastante orientação") },
      { value: "medium", label: "Médio", hint: hintYellow("Conceitos intermediários, orientação moderada") },
      { value: "hard", label: "Difícil", hint: hintRed("Conceitos avançados, pouca orientação") },
    ],
  });

  if (p.isCancel(difficulty)) { p.cancel("Cancelado."); process.exit(0); }

  const topic = await p.text({
    message: "Qual assunto específico você deseja praticar?",
    placeholder: "Ex: React Query, Server Components, JWT Auth...",
    validate(value) {
      if (!value || value.trim().length < 3)
        return "Descreva um assunto com pelo menos 3 caracteres.";
    },
  });

  if (p.isCancel(topic)) { p.cancel("Cancelado."); process.exit(0); }

  const defaultName = `desafio-${framework}-${topic.toString().toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`;
  const projectName = await p.text({
    message: "Nome da pasta do projeto?",
    defaultValue: defaultName,
    placeholder: defaultName,
  });

  if (p.isCancel(projectName)) { p.cancel("Cancelado."); process.exit(0); }

  console.log("");

  const spinner = p.spinner();
  spinner.start(`🤖 Gerando desafio com ${modelConfig.model}...`);

  let challenge;
  try {
    challenge = await generateChallenge(
      {
        framework: framework as Framework,
        difficulty: difficulty as Difficulty,
        topic: topic.toString(),
      },
      modelConfig,
    );
    spinner.stop("✅ Desafio gerado com sucesso!");
  } catch (error) {
    spinner.stop("❌ Erro ao gerar desafio.");
    p.log.error(`Falha na API: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

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
      "🎯 Tudo pronto!",
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