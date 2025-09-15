import { config } from 'dotenv';
config();

import '@/ai/flows/generate-comments-for-python-code.ts';
import '@/ai/flows/generate-test-cases-from-code.ts';
import '@/ai/flows/chat-with-code.ts';
import '@/ai/flows/suggest-code.ts';
