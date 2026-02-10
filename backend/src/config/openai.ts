import OpenAI from 'openai';
import { env } from './env';

export const openai = new OpenAI({
  apiKey: env.openaiApiKey || 'skipped-for-now', // Prevent crash if key is missing
});
