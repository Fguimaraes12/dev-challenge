import * as fs from "fs-extra";
import * as path from "path";

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface LastModelConfig {
  provider: string;
  model: string;
  modelLabel: string;
  apiKey: string;
}

export interface DevChallengeConfig {
  providers: Record<string, ProviderConfig>;
  lastModel?: LastModelConfig;
}

export const CONFIG_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || ".",
  ".devchallenge",
);
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function getConfig(): DevChallengeConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { providers: {} };
  }
  return fs.readJsonSync(CONFIG_PATH);
}

export function getProviderConfig(name: string): ProviderConfig | undefined {
  const config = getConfig();
  return config.providers[name];
}

export function getApiKey(provider: string): string {
  const envMap: Record<string, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    google: "GEMINI_API_KEY",
    qwen: "DASHSCOPE_API_KEY",
  };
  const envKey = process.env[envMap[provider]];
  if (envKey) return envKey;

  const providerConfig = getProviderConfig(provider);
  if (providerConfig?.apiKey) return providerConfig.apiKey;

  return "";
}

export function getBaseUrl(provider: string): string | undefined {
  const providerConfig = getProviderConfig(provider);
  return providerConfig?.baseUrl;
}

export function ensureConfigDir(): void {
  fs.ensureDirSync(CONFIG_DIR);
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeJsonSync(CONFIG_PATH, { providers: {} }, { spaces: 2 });
  }
}

export function getLastModel(): LastModelConfig | undefined {
  const config = getConfig();
  return config.lastModel;
}

export function saveLastModel(lastModel: LastModelConfig): void {
  ensureConfigDir();
  const config = getConfig();
  config.lastModel = lastModel;
  fs.writeJsonSync(CONFIG_PATH, config, { spaces: 2 });
}

export { CONFIG_PATH };