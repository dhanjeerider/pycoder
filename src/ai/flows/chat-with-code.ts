'use server';
/**
 * @fileOverview A flow to chat with an AI about Python code.
 *
 * - chatWithCode - A function that handles the chat interaction.
 * - ChatWithCodeInput - The input type for the chatWithCode function.
 * - ChatWithCodeOutput - The return type for the chatWithCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ChatWithCodeInputSchema = z.object({
  prompt: z.string().describe('The user\'s question about the code.'),
  code: z.string().describe('The Python code context.'),
  chatHistory: z.array(ChatMessageSchema).describe('The history of the conversation.'),
});
export type ChatWithCodeInput = z.infer<typeof ChatWithCodeInputSchema>;

const ChatWithCodeOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user\'s question.'),
});
export type ChatWithCodeOutput = z.infer<typeof ChatWithCodeOutputSchema>;

export async function chatWithCode(input: ChatWithCodeInput): Promise<ChatWithCodeOutput> {
  return chatWithCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithCodePrompt',
  input: {schema: ChatWithCodeInputSchema},
  output: {schema: ChatWithCodeOutputSchema},
  prompt: `You are an expert Python developer AI assistant named Gemini. Your goal is to help users understand, debug, and improve their Python code.

You are having a conversation with a user. Here is the history of your conversation:
{{#each chatHistory}}
{{role}}: {{content}}
{{/each}}

Here is the user's current Python code:
\`\`\`python
{{{code}}}
\`\`\`

And here is the user's latest question:
{{prompt}}

Your response should be helpful, concise, and directly related to their question and code.
If you provide code snippets, use Markdown.
`,
});

const chatWithCodeFlow = ai.defineFlow(
  {
    name: 'chatWithCodeFlow',
    inputSchema: ChatWithCodeInputSchema,
    outputSchema: ChatWithCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {response: output!.response};
  }
);
