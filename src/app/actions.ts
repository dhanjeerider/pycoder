'use server';

import { z } from 'zod';
import { generateCommentsForPythonCode } from '@/ai/flows/generate-comments-for-python-code';
import { generateTestCasesFromCode } from '@/ai/flows/generate-test-cases-from-code';
import { chatWithCode } from '@/ai/flows/chat-with-code';

const testCasesSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty.'),
  documentation: z.string().optional(),
});

export async function handleGenerateTestCases(prevState: any, formData: FormData) {
  const validatedFields = testCasesSchema.safeParse({
    code: formData.get('code'),
    documentation: formData.get('documentation'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { testCases } = await generateTestCasesFromCode(validatedFields.data);
    return { message: 'success', testCases };
  } catch (e) {
    return { message: 'An error occurred.', error: (e as Error).message };
  }
}

const commentsSchema = z.object({
  pythonCode: z.string().min(1, 'Code cannot be empty.'),
  projectRequirements: z.string().min(1, 'Project requirements cannot be empty.'),
});

export async function handleGenerateComments(prevState: any, formData: FormData) {
  const validatedFields = commentsSchema.safeParse({
    pythonCode: formData.get('pythonCode'),
    projectRequirements: formData.get('projectRequirements'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid input.',
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { commentedPythonCode } = await generateCommentsForPythonCode(validatedFields.data);
    return { message: 'success', commentedPythonCode };
  } catch (e) {
    return { message: 'An error occurred.', error: (e as Error).message };
  }
}


const chatSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required.'),
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
  code: z.string(),
  chatHistory: z.string(),
});

export async function handleChat(prevState: any, formData: FormData) {
    const validatedFields = chatSchema.safeParse({
        apiKey: formData.get('apiKey'),
        prompt: formData.get('prompt'),
        code: formData.get('code'),
        chatHistory: formData.get('chatHistory'),
    });

    if (!validatedFields.success) {
        return {
        message: 'Invalid input.',
        error: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const { apiKey, prompt, code, chatHistory } = validatedFields.data;
        process.env.GEMINI_API_KEY = apiKey;
        const parsedHistory = JSON.parse(chatHistory);

        const { response } = await chatWithCode({
            prompt,
            code,
            chatHistory: parsedHistory
        });
        return { message: 'success', response };
    } catch (e) {
        console.error(e);
        return { message: 'An error occurred.', error: (e as Error).message };
    }
}
