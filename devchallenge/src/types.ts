export type Framework = "nextjs" | "react" | "typescript" | "vue" | "node";

export type Difficulty = "easy" | "medium" | "hard";

export interface ChallengeOptions {
  framework: Framework;
  difficulty: Difficulty;
  topic: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface Challenge {
  title: string;
  description: string;
  objectives: string[];
  hints: string[];
  files: GeneratedFile[];
  solution_notes: string;
}

export interface SetupOptions {
  projectName: string;
  framework: Framework;
  challenge: Challenge;
}
