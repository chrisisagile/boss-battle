---
name: boss-battle-quiz-author
description: Research a subject, write Boss Battle multiple-choice quiz questions in the repo's validated format, and save them into the live Convex question bank. Use when Codex needs to create or expand quiz content for this repo, especially requests like "write 20 science questions about space", "research mythology trivia and save it", or "generate a new round-ready question batch for Boss Battle."
---

# Boss Battle Quiz Author

Use the existing Boss Battle quiz contract. Do not invent a new schema, do not edit generated Convex files, and do not treat `src/data/quiz-questions.ts` as the normal persistence surface once the app is running.

Read [references/question-bank-contract.md](references/question-bank-contract.md) before generating content or saving anything. It contains the verified question shape, allowed categories and complexities, source key pattern, and the save command.

## Workflow

1. Map the requested subject into one of the supported quiz categories: `history`, `science`, `gaming`, or `myth`.
2. Decide the requested question count and complexity mix. Keep token rewards aligned to the repo convention: `easy=2`, `medium=3`, `hard=4`.
3. Research the subject with web search before writing questions. Prefer primary or authoritative sources, cross-check facts, and avoid disputed trivia that produces ambiguous correct answers.
4. Draft the payload as JSON using the exact `questions` array shape from the reference file. Keep each question multiple-choice with concise distractors and one unambiguous correct answer.
5. Validate the batch yourself before saving:
   - every `sourceKey` is unique within the batch
   - every `prompt` is specific and answerable from the cited research
   - every `choices` entry has a non-empty `id` and `text`
   - `correctChoiceId` matches one choice
   - `category`, `complexity`, and `tokenReward` match the contract
6. Save through the skill script instead of hand-typing the Convex command:

```bash
node .codex/skills/boss-battle-quiz-author/scripts/save-question-batch.mjs \
  --file /absolute/path/to/questions.json \
  --push
```

7. If the repo does not have a reachable Convex dev deployment, stop before saving, keep the JSON artifact, and report the blocker clearly instead of pretending persistence succeeded.
8. After saving, report the `insertedCount`, `updatedCount`, and the category/complexity mix that was written.

## Output Rules

- Prefer four answer choices even though the backend only requires at least two.
- Keep distractors plausible but clearly wrong.
- Avoid "all of the above", trick wording, or answers that depend on unsettled facts.
- Keep prompts short enough to read comfortably on a phone.
- Include the researched subject in the `sourceKey` slug so later maintenance can trace where the batch came from.

## Save Script

Use `scripts/save-question-batch.mjs` for persistence. It accepts either:

- a JSON object shaped like `{ "questions": [...] }`
- or a raw JSON array of question objects

Use `--dry-run` first when you want to validate the file shape without calling Convex.

## Failure Handling

- If the requested subject does not fit one of the supported categories, tell the user and ask them to either broaden the topic or choose the closest supported category before writing questions.
- If research results disagree, either remove that fact from the batch or rewrite the question so the correct answer is stable.
- If Convex rejects the batch, fix the payload rather than bypassing the mutation or editing storage manually.
