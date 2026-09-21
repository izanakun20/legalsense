export type UseCase = {
  id: string;
  title: string;
  description: string;
  tabOrRoute: string;
  neverDo: string;
};

export const USE_CASES: UseCase[] = [
  {
    id: "simplify",
    title: "Simplify",
    description: "Plain-language summary of complex legal text.",
    tabOrRoute: "summary",
    neverDo: "Will never provide a verdict on whether to sign or not."
  },
  {
    id: "compare",
    title: "Compare",
    description: "Side-by-side material-change detection between document versions.",
    tabOrRoute: "compare",
    neverDo: "Will never automatically accept or reject changes."
  },
  {
    id: "highlight",
    title: "Highlight",
    description: "Categorized risk flags for clauses, obligations and inconsistencies.",
    tabOrRoute: "highlight",
    neverDo: "Will never calculate a numeric risk score or grade."
  },
  {
    id: "ask",
    title: "Ask",
    description: "Citation-grounded Q&A, with refusal of out-of-scope questions.",
    tabOrRoute: "ask",
    neverDo: "Will never answer non-legal or out-of-scope questions."
  },
  {
    id: "options",
    title: "Options and next steps",
    description: "Negotiation points / topics to raise.",
    tabOrRoute: "options",
    neverDo: "Will never recommend pursuing specific legal action."
  },
  {
    id: "actionable",
    title: "Actionable outputs",
    description: "Exportable checklist (PDF and Markdown).",
    tabOrRoute: "actionable",
    neverDo: "Will never store history or send data to third parties."
  },
  {
    id: "attorney",
    title: "Prepare for a legal professional",
    description: "Attorney-ready question list.",
    tabOrRoute: "attorney",
    neverDo: "Will never act as a substitute for actual legal counsel."
  }
];
