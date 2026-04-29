# DevChallenge

> CLI que gera desafios de programação personalizados usando Inteligência Artificial.

[![npm version](https://img.shields.io/npm/v/@fguimaraes12/devchallenge?label=version)](https://www.npmjs.com/package/@fguimaraes12/devchallenge)
[![npm downloads](https://img.shields.io/npm/dm/@fguimaraes12/devchallenge)](https://www.npmjs.com/package/@fguimaraes12/devchallenge)
[![license](https://img.shields.io/npm/l/@fguimaraes12/devchallenge)](LICENSE)

## ⚠️ Beta

Este projeto está em **beta ativo**. Novas funcionalidades podem ser adicionadas e mudanças breaking podem ocorrer. Use com consciência e contribua com feedback!

## 🚀 O que é?

O DevChallenge é uma ferramenta de linha de comando que cria projetos reais com desafios de programação personalizados para você praticar e aprender na prática. Você escolhe o framework, a dificuldade e o assunto — a IA gera todo o projeto automaticamente.

## ✨ Funcionalidades

- **Multi-framework:** Next.js, React, Vue, TypeScript, Node.js
- **Multi-IA:** Anthropic (Claude), OpenAI (GPT), Google (Gemini), OpenRouter, Qwen
- **Desafios com TODO:** código parcialmente implementado com pontos onde você deve completar
- **Projeto pronto para rodar:** a IA gera `package.json`, configs e estrutura completa — basta `npm install && npm run dev`

## 📦 Instalação

```bash
npm install -g @fguimaraes12/devchallenge
```

## 🎯 Uso

```bash
devchallenge
```

O CLI vai guiar você:

1. **Provedor de IA** — Anthropic, OpenAI, Google, OpenRouter ou Qwen
2. **Modelo** — escolha a IA específica
3. **Framework** — Next.js, React, Vue, TypeScript ou Node.js
4. **Dificuldade** — Fácil, Médio ou Difícil
5. **Assunto** — o tópico que quer praticar (ex: useMemo, JWT Auth, Server Components)
6. **Nome do projeto** — a pasta onde o desafio será criado

Depois de gerado:

```bash
cd nome-do-projeto
npm install
npm run dev
```

## 🔑 Configuração de API Keys

Você pode configurar suas API keys no arquivo `~/.devchallenge/config.json`:

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-..."
    },
    "openai": {
      "apiKey": "sk-..."
    },
    "qwen": {
      "apiKey": "sua-key",
      "baseUrl": "http://localhost:3099/v1"
    }
  }
}
```

Ou use variáveis de ambiente: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DASHSCOPE_API_KEY`.

## 🛠️ Desenvolvimento

```bash
git clone https://github.com/fguimaraes12/devchallenge.git
cd devchallenge
npm install
npm run build
npm link
```

## 📄 Licença

ISC

---

_Criado por fguimaraes12_
