# Boss Battle question bank contract

Use this reference when creating or saving quiz content for the Boss Battle repo.

## Verified code paths

- `convex/schema.js`
- `convex/quizQuestions.ts`
- `convex/lib/quizValidation.ts`
- `src/data/quiz-questions.ts`
- `src/components/join/player-quiz-question.tsx`

## Question shape

Persist questions through the `quizQuestions` table and the `quizQuestionAuthoring.upsertQuestionBank` mutation in the active code path for this repo.

Each question object must have:

```json
{
  "sourceKey": "science-medium-space-001",
  "prompt": "Which planet in our solar system has the most confirmed moons?",
  "choices": [
    { "id": "a", "text": "Earth" },
    { "id": "b", "text": "Mars" },
    { "id": "c", "text": "Saturn" },
    { "id": "d", "text": "Venus" }
  ],
  "correctChoiceId": "c",
  "category": "science",
  "complexity": "medium",
  "tokenReward": 3,
  "status": "ready"
}
```

## Allowed values

- `category`: `history`, `science`, `gaming`, `myth`
- `complexity`: `easy`, `medium`, `hard`
- `status`: `draft`, `ready`, `retired`

## Validation rules

- `sourceKey` must be non-empty.
- `prompt` must be non-empty.
- `choices` must contain at least two entries.
- Each choice must have a non-empty `id` and `text`.
- Choice ids must be unique after trim and lowercase normalization.
- `correctChoiceId` must match one of the choices.
- `tokenReward` must be an integer `>= 1`.

## Repo conventions

- Prefer four choices because that matches the current seeded content and phone UI comfortably.
- Keep token rewards aligned to complexity:
  - `easy`: `2`
  - `medium`: `3`
  - `hard`: `4`
- Prefer `sourceKey` format `<category>-<complexity>-<subject-slug>-NNN`.
- Save generated content with `status: "ready"` unless the user explicitly asks for drafts.

## Save commands

Save through the skill script from the repo root:

```bash
node .codex/skills/boss-battle-quiz-author/scripts/save-question-batch.mjs \
  --file /absolute/path/to/questions.json \
  --push
```

Dry-run the payload without calling Convex:

```bash
node .codex/skills/boss-battle-quiz-author/scripts/save-question-batch.mjs \
  --file /absolute/path/to/questions.json \
  --dry-run
```

The script accepts either:

- `{ "questions": [...] }`
- or a raw JSON array
