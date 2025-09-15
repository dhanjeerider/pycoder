'use server';
/**
 * @fileOverview A flow to suggest Python code completions.
 *
 * - suggestCode - A function that suggests code completion.
 * - SuggestCodeInput - The input type for the suggestCode function.
 * - SuggestCodeOutput - The return type for the suggestCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeInputSchema = z.object({
  code: z.string().describe('The Python code to complete.'),
});
export type SuggestCodeInput = z.infer<typeof SuggestCodeInputSchema>;

const SuggestCodeOutputSchema = z.object({
  suggestion: z.string().describe("The AI's code suggestion."),
});
export type SuggestCodeOutput = z.infer<typeof SuggestCodeOutputSchema>;

export async function suggestCode(input: SuggestCodeInput): Promise<SuggestCodeOutput> {
  return suggestCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodePrompt',
  input: {schema: SuggestCodeInputSchema},
  output: {schema: SuggestCodeOutputSchema},
  prompt: `You are an expert Python developer AI assistant. Your task is to complete the given Python code.
Only provide the code that should be added to complete the user's request. Do not repeat the code that the user has already written.
Your suggestion should be a continuation of the provided code.

Here is the user's current Python code:
\`\`\`python
{{{code}}}
\`\`\`

Your suggested code completion:
`,
});

const suggestCodeFlow = ai.defineFlow(
  {
    name: 'suggestCodeFlow',
    inputSchema: SuggestCodeInputSchema,
    outputSchema: SuggestCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {suggestion: output!.suggestion};
  }
);
