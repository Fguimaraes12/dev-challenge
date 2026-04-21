import chalk from "chalk";

function hintGreen(hint: string) {
  return chalk.green(hint);
}

function hintYellow(hint: string) {
  return chalk.yellow(hint);
}

function hintRed(hint: string) {
  return chalk.red(hint);
}

export { hintGreen, hintYellow, hintRed };