import * as fs from "fs-extra";
import * as path from "path";
import { SetupOptions } from "./types";

function generateReadme(challenge: SetupOptions["challenge"], framework: string): string {
  const difficultyEmoji = "🎯";
  const objectivesList = challenge.objectives
    .map((obj, i) => `${i + 1}. ${obj}`)
    .join("\n");
  const hintsList = challenge.hints
    .map((hint, i) => `> **Dica ${i + 1}:** ${hint}`)
    .join("\n\n");

  return `# ${challenge.title}

> ${difficultyEmoji} **Desafio de ${framework.toUpperCase()}**

## 📋 Descrição

${challenge.description}

## 🎯 Objetivos

${objectivesList}

## 🚀 Como começar

\`\`\`bash
npm install
npm run dev
\`\`\`

## 📁 Estrutura do Projeto

Encontre os arquivos com comentários \`// TODO:\` — esses são os pontos onde você deve implementar o código!

## 💡 Dicas

${hintsList}

## 📝 Notas sobre a Solução

${challenge.solution_notes}

---

*Gerado por DevChallenge CLI 🚀*
`;
}

export async function setupProject(options: SetupOptions): Promise<string> {
  const { projectName, framework, challenge } = options;

  const cwd = process.cwd();
  const projectPath = path.join(cwd, projectName);

  // Create project directory
  await fs.ensureDir(projectPath);

  // Write all AI-generated files (package.json, tsconfig, configs, source files)
  for (const file of challenge.files) {
    const filePath = path.join(projectPath, file.path);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, file.content);
  }

  // Write .gitignore
  await fs.writeFile(
    path.join(projectPath, ".gitignore"),
    `node_modules\n.next\ndist\n.env\n.env.local\n`
  );

  // Write DESAFIO.md
  const readme = generateReadme(challenge, framework);
  await fs.writeFile(path.join(projectPath, "DESAFIO.md"), readme);

  return projectPath;
}
