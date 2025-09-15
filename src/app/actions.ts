'use server';

import { z } from 'zod';
import { generateCommentsForPythonCode } from '@/ai/flows/generate-comments-for-python-code';
import { generateTestCasesFromCode } from '@/ai/flows/generate-test-cases-from-code';

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
