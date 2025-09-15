'use server';
/**
 * @fileOverview Generates test cases from Python code.
 *
 * - generateTestCasesFromCode - A function that generates test cases from Python code.
 * - GenerateTestCasesFromCodeInput - The input type for the generateTestCasesFromCode function.
 * - GenerateTestCasesFromCodeOutput - The return type for the generateTestCasesFromCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTestCasesFromCodeInputSchema = z.object({
  code: z.string().describe('The Python code to generate test cases for.'),
  documentation: z
    .string()
    .optional()
    .describe('The documentation for the Python code.'),
});
export type GenerateTestCasesFromCodeInput = z.infer<
  typeof GenerateTestCasesFromCodeInputSchema
>;

const GenerateTestCasesFromCodeOutputSchema = z.object({
  testCases: z
    .string()
    .describe('The generated test cases for the Python code.'),
});
export type GenerateTestCasesFromCodeOutput = z.infer<
  typeof GenerateTestCasesFromCodeOutputSchema
>;

export async function generateTestCasesFromCode(
  input: GenerateTestCasesFromCodeInput
): Promise<GenerateTestCasesFromCodeOutput> {
  return generateTestCasesFromCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestCasesFromCodePrompt',
  input: {schema: GenerateTestCasesFromCodeInputSchema},
  output: {schema: GenerateTestCasesFromCodeOutputSchema},
  prompt: `You are a test case generator for Python code.
  You will generate test cases based on the provided code and documentation.

  Code:
  \`\`\`python
  {{{code}}}
  \`\`\`

  Documentation:
  {{#if documentation}}
  {{{documentation}}}
  {{else}}
  No documentation provided.
  {{/if}}

  Test Cases:
  `,
});

const generateTestCasesFromCodeFlow = ai.defineFlow(
  {
    name: 'generateTestCasesFromCodeFlow',
    inputSchema: GenerateTestCasesFromCodeInputSchema,
    outputSchema: GenerateTestCasesFromCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
