'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate comments for Python code based on project requirements.
 *
 * - generateCommentsForPythonCode - An asynchronous function that takes Python code and project requirements as input and returns the commented Python code.
 * - GenerateCommentsForPythonCodeInput - The input type for the generateCommentsForPythonCode function, including the Python code and project requirements.
 * - GenerateCommentsForPythonCodeOutput - The output type for the generateCommentsForPythonCode function, which contains the commented Python code.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCommentsForPythonCodeInputSchema = z.object({
  pythonCode: z
    .string()
    .describe('The Python code to be commented.'),
  projectRequirements: z
    .string()
    .describe('The project requirements to be followed while commenting the code.'),
});
export type GenerateCommentsForPythonCodeInput = z.infer<
  typeof GenerateCommentsForPythonCodeInputSchema
>;

const GenerateCommentsForPythonCodeOutputSchema = z.object({
  commentedPythonCode: z
    .string()
    .describe('The Python code with comments generated based on the project requirements.'),
});
export type GenerateCommentsForPythonCodeOutput = z.infer<
  typeof GenerateCommentsForPythonCodeOutputSchema
>;

export async function generateCommentsForPythonCode(
  input: GenerateCommentsForPythonCodeInput
): Promise<GenerateCommentsForPythonCodeOutput> {
  return generateCommentsForPythonCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommentsForPythonCodePrompt',
  input: {schema: GenerateCommentsForPythonCodeInputSchema},
  output: {schema: GenerateCommentsForPythonCodeOutputSchema},
  prompt: `You are an AI assistant specialized in generating comments for Python code.
    Given the following Python code and project requirements, generate comments for the code.

    Project Requirements: {{{projectRequirements}}}

    Python Code: {{{pythonCode}}}

    Commented Python Code:`,
});

const generateCommentsForPythonCodeFlow = ai.defineFlow(
  {
    name: 'generateCommentsForPythonCodeFlow',
    inputSchema: GenerateCommentsForPythonCodeInputSchema,
    outputSchema: GenerateCommentsForPythonCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {commentedPythonCode: output!.commentedPythonCode!};
  }
);
