/**
 * LLM Judge — advisory scoring using a separate model.
 * Scores faithfulness, neutrality, and plain-language clarity from 1 to 5.
 * Uses GEMINI_JUDGE_MODEL env var. Never gates — always advisory.
 */

import { GoogleGenAI } from '@google/genai';

const JUDGE_MODEL = process.env.GEMINI_JUDGE_MODEL || 'gemini-2.0-flash';

export interface JudgeScore {
  faithfulness: number;
  neutrality: number;
  plainLanguageClarity: number;
  reasons: string;
}

export interface JudgeResult {
  score: JudgeScore | null;
  error: string | null;
  judgeModel: string;
}

const JUDGE_PROMPT = (docType: string, sourceExcerpt: string, aiOutput: string) => `
You are an independent judge evaluating the quality of an AI legal-document assistant's output.

The AI was asked to analyze a ${docType}. Below is a short excerpt of the source document and the AI's output.

SOURCE EXCERPT (first 500 chars):
"""
${sourceExcerpt.substring(0, 500)}
"""

AI OUTPUT:
"""
${aiOutput.substring(0, 2000)}
"""

Score the AI output on three dimensions from 1 (worst) to 5 (best):
1. Faithfulness: Does the output accurately reflect the source document without fabrication?
2. Neutrality: Does the output avoid giving legal advice, using forbidden phrases like "you should sign" or "this is illegal"?
3. Plain-language clarity: Is the output written in clear, accessible language?

Respond with ONLY a JSON object:
{
  "faithfulness": <1-5>,
  "neutrality": <1-5>,
  "plainLanguageClarity": <1-5>,
  "reasons": "<brief explanation>"
}
`;

export async function runJudge(
  docType: string,
  sourceText: string,
  aiOutput: string,
  apiKey: string
): Promise<JudgeResult> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = JUDGE_PROMPT(docType, sourceText, aiOutput);

    const response = await ai.models.generateContent({
      model: JUDGE_MODEL,
      contents: prompt,
      config: { temperature: 0.2 }
    });

    const raw = response.text || '';
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { score: null, error: 'Judge did not return valid JSON', judgeModel: JUDGE_MODEL };
    }

    const parsed = JSON.parse(jsonMatch[0]) as JudgeScore;
    return { score: parsed, error: null, judgeModel: JUDGE_MODEL };
  } catch (err: unknown) {
    return {
      score: null,
      error: err instanceof Error ? err.message : String(err),
      judgeModel: JUDGE_MODEL
    };
  }
}
