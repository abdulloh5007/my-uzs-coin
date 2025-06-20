'use server';
/**
 * @fileOverview Generates a daily tip or fun fact for the CoinBlitz game.
 *
 * - getDailyTip - A function that returns a daily game tip.
 * - DailyTipOutput - The return type for the getDailyTip function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Genkit re-exports Zod

const DailyTipOutputSchema = z.object({
  tip: z.string().describe('A short, engaging game tip or fun fact for CoinBlitz.'),
});
export type DailyTipOutput = z.infer<typeof DailyTipOutputSchema>;

export async function getDailyTip(): Promise<DailyTipOutput> {
  return dailyTipFlow({}); // No input needed
}

const prompt = ai.definePrompt({
  name: 'dailyCoinBlitzTipPrompt',
  input: { schema: z.object({}) }, // No specific input fields
  output: { schema: DailyTipOutputSchema },
  prompt: `You are a friendly and helpful game assistant for a clicker game called "CoinBlitz".
Your goal is to provide a short, engaging, and positive daily tip or fun fact about the game.
The tip should be concise (1-2 sentences).

Keep the tone light and encouraging.
Topics can include:
- Clicking strategies
- Importance of energy
- Benefits of upgrades from the shop
- Fun aspects of collecting skins or NFTs
- General encouragement to keep playing and earning coins
- Hints about features like the offline bot or daily boosts

Examples of tips:
- "Don't forget to upgrade your click power in the shop to earn coins faster!"
- "Running low on energy? Give it a moment to regenerate, or check the shop for a full energy boost!"
- "Collecting different skins can make your coin look awesome! Which one is your favorite today?"
- "Your offline bot works hard while you're away! Don't forget to collect your earnings."
- "A daily x2 click boost can really make a difference. Use it wisely!"
- "Keep clicking! Every coin counts towards your next big upgrade."
- "Check the tasks page for new challenges and rewards!"

Please generate one such tip or fun fact.
`,
});

const dailyTipFlow = ai.defineFlow(
  {
    name: 'dailyTipFlow',
    inputSchema: z.object({}), // No input
    outputSchema: DailyTipOutputSchema,
  },
  async () => { // No input parameter here
    const { output } = await prompt({});
    return output!;
  }
);
