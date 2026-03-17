export const quizCategories = [
  "history",
  "science",
  "gaming",
  "myth",
  "star-trek",
] as const;

export const quizComplexities = ["easy", "medium", "hard"] as const;

export type QuizCategory = (typeof quizCategories)[number];
export type QuizComplexity = (typeof quizComplexities)[number];

export interface QuizChoiceSeed {
  id: string;
  text: string;
}

export interface QuizQuestionSeed {
  sourceKey: string;
  prompt: string;
  choices: QuizChoiceSeed[];
  correctChoiceId: string;
  category: QuizCategory;
  complexity: QuizComplexity;
  tokenReward: number;
  status: "ready";
}

export const quizQuestionSeeds: QuizQuestionSeed[] = [
  {
    sourceKey: "history-easy-001",
    prompt: "Which empire built the Colosseum?",
    choices: [
      { id: "a", text: "Roman Empire" },
      { id: "b", text: "Ottoman Empire" },
      { id: "c", text: "Mongol Empire" },
      { id: "d", text: "British Empire" },
    ],
    correctChoiceId: "a",
    category: "history",
    complexity: "easy",
    tokenReward: 2,
    status: "ready",
  },
  {
    sourceKey: "science-easy-001",
    prompt: "What planet is known as the Red Planet?",
    choices: [
      { id: "a", text: "Venus" },
      { id: "b", text: "Mars" },
      { id: "c", text: "Jupiter" },
      { id: "d", text: "Mercury" },
    ],
    correctChoiceId: "b",
    category: "science",
    complexity: "easy",
    tokenReward: 2,
    status: "ready",
  },
  {
    sourceKey: "gaming-easy-001",
    prompt: "In chess, which piece can move in an L-shape?",
    choices: [
      { id: "a", text: "Bishop" },
      { id: "b", text: "Knight" },
      { id: "c", text: "Rook" },
      { id: "d", text: "King" },
    ],
    correctChoiceId: "b",
    category: "gaming",
    complexity: "easy",
    tokenReward: 2,
    status: "ready",
  },
  {
    sourceKey: "myth-easy-001",
    prompt: "Who wields the hammer Mjolnir in Norse mythology?",
    choices: [
      { id: "a", text: "Loki" },
      { id: "b", text: "Thor" },
      { id: "c", text: "Odin" },
      { id: "d", text: "Freyr" },
    ],
    correctChoiceId: "b",
    category: "myth",
    complexity: "easy",
    tokenReward: 2,
    status: "ready",
  },
  {
    sourceKey: "history-medium-001",
    prompt: "Which treaty ended the Thirty Years' War in 1648?",
    choices: [
      { id: "a", text: "Treaty of Utrecht" },
      { id: "b", text: "Peace of Westphalia" },
      { id: "c", text: "Treaty of Tordesillas" },
      { id: "d", text: "Congress of Vienna" },
    ],
    correctChoiceId: "b",
    category: "history",
    complexity: "medium",
    tokenReward: 3,
    status: "ready",
  },
  {
    sourceKey: "science-medium-001",
    prompt: "What is the chemical symbol for sodium?",
    choices: [
      { id: "a", text: "So" },
      { id: "b", text: "Sd" },
      { id: "c", text: "Na" },
      { id: "d", text: "Sm" },
    ],
    correctChoiceId: "c",
    category: "science",
    complexity: "medium",
    tokenReward: 3,
    status: "ready",
  },
  {
    sourceKey: "gaming-medium-001",
    prompt: "How many standard tiles are in a complete Mahjong set?",
    choices: [
      { id: "a", text: "108" },
      { id: "b", text: "136" },
      { id: "c", text: "144" },
      { id: "d", text: "152" },
    ],
    correctChoiceId: "c",
    category: "gaming",
    complexity: "medium",
    tokenReward: 3,
    status: "ready",
  },
  {
    sourceKey: "myth-medium-001",
    prompt: "Which hero completed the Twelve Labors in Greek mythology?",
    choices: [
      { id: "a", text: "Perseus" },
      { id: "b", text: "Theseus" },
      { id: "c", text: "Achilles" },
      { id: "d", text: "Heracles" },
    ],
    correctChoiceId: "d",
    category: "myth",
    complexity: "medium",
    tokenReward: 3,
    status: "ready",
  },
  {
    sourceKey: "history-hard-001",
    prompt:
      "Who was the first woman to serve as Prime Minister of the United Kingdom?",
    choices: [
      { id: "a", text: "Margaret Thatcher" },
      { id: "b", text: "Theresa May" },
      { id: "c", text: "Angela Merkel" },
      { id: "d", text: "Indira Gandhi" },
    ],
    correctChoiceId: "a",
    category: "history",
    complexity: "hard",
    tokenReward: 4,
    status: "ready",
  },
  {
    sourceKey: "science-hard-001",
    prompt:
      "What particle gives the Higgs boson its nickname as the 'God particle' focus in popular media?",
    choices: [
      { id: "a", text: "It generates gravity directly" },
      { id: "b", text: "It explains why particles have mass" },
      { id: "c", text: "It travels faster than light" },
      { id: "d", text: "It replaces dark matter" },
    ],
    correctChoiceId: "b",
    category: "science",
    complexity: "hard",
    tokenReward: 4,
    status: "ready",
  },
  {
    sourceKey: "gaming-hard-001",
    prompt:
      "In Dungeons & Dragons, what ability score usually drives a wizard's spellcasting?",
    choices: [
      { id: "a", text: "Wisdom" },
      { id: "b", text: "Charisma" },
      { id: "c", text: "Intelligence" },
      { id: "d", text: "Dexterity" },
    ],
    correctChoiceId: "c",
    category: "gaming",
    complexity: "hard",
    tokenReward: 4,
    status: "ready",
  },
  {
    sourceKey: "myth-hard-001",
    prompt:
      "Which Egyptian god is commonly depicted with the head of a jackal?",
    choices: [
      { id: "a", text: "Anubis" },
      { id: "b", text: "Horus" },
      { id: "c", text: "Set" },
      { id: "d", text: "Thoth" },
    ],
    correctChoiceId: "a",
    category: "myth",
    complexity: "hard",
    tokenReward: 4,
    status: "ready",
  },
];
