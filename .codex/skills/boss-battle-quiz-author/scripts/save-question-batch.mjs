import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    file: null,
    prod: false,
    push: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    switch (value) {
      case "--file":
        args.file = argv[index + 1] ?? null;
        index += 1;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--push":
        args.push = true;
        break;
      case "--prod":
        args.prod = true;
        break;
      case "--help":
        printHelp();
        process.exit(0);
        return;
      default:
        fail(`Unknown argument: ${value}`);
    }
  }

  if (!args.file) {
    fail("Missing required argument: --file /absolute/path/to/questions.json");
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node .codex/skills/boss-battle-quiz-author/scripts/save-question-batch.mjs \\
    --file /absolute/path/to/questions.json [--dry-run] [--push] [--prod]

Options:
  --file     Path to a JSON file containing either { "questions": [...] } or a raw array
  --dry-run  Validate the file shape and print a summary without calling Convex
  --push     Pass --push to convex run before saving
  --prod     Pass --prod to convex run`);
}

function normalizePayload(parsed) {
  if (Array.isArray(parsed)) {
    return { questions: parsed };
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions)) {
    return { questions: parsed.questions };
  }

  fail(
    "Question payload must be a JSON array or an object with a top-level questions array.",
  );
}

function summarizeQuestions(questions) {
  const categories = new Map();
  const complexities = new Map();

  for (const question of questions) {
    categories.set(
      question.category ?? "unknown",
      (categories.get(question.category ?? "unknown") ?? 0) + 1,
    );
    complexities.set(
      question.complexity ?? "unknown",
      (complexities.get(question.complexity ?? "unknown") ?? 0) + 1,
    );
  }

  return {
    categoryCounts: Object.fromEntries(categories),
    complexityCounts: Object.fromEntries(complexities),
    totalQuestions: questions.length,
  };
}

async function loadPayload(filePath) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const payload = normalizePayload(parsed);

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    fail("Question payload must include at least one question.");
  }

  return payload;
}

async function runConvex(payload, options) {
  const functionNames = [
    "quizQuestionAuthoring.upsertQuestionBank",
    "quizQuestions.upsertQuestionBank",
  ];
  const commandArgs = ["exec", "convex", "run"];

  if (options.push) {
    commandArgs.push("--push");
  }

  if (options.prod) {
    commandArgs.push("--prod");
  }

  let lastError;

  for (const publicFunction of functionNames) {
    const fullArgs = [...commandArgs, publicFunction, JSON.stringify(payload)];
    try {
      await new Promise((resolve, reject) => {
        const child = spawn("pnpm", fullArgs, {
          cwd: process.cwd(),
          env: process.env,
          stdio: "inherit",
        });

        child.on("exit", (code) => {
          if (code === 0) {
            resolve(undefined);
            return;
          }

          reject(
            new Error(
              `convex run (${publicFunction}) exited with status ${
                code ?? "unknown"
              }`,
            ),
          );
        });
        child.on("error", reject);
      });
      return;
    } catch (error) {
      lastError = error;
      console.error(String(error?.message ?? error));
      continue;
    }
  }

  if (lastError) {
    throw lastError;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = await loadPayload(args.file);
  const summary = summarizeQuestions(payload.questions);

  console.log(JSON.stringify(summary, null, 2));

  if (args.dryRun) {
    return;
  }

  await runConvex(payload, args);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
