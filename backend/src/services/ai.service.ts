import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import * as QuestionModel from '../models/question.model';
import * as SectionModel from '../models/section.model';
import { logger } from '../utils/logger';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export async function generateQuestionExplanation(questionId: string) {
  const question = await QuestionModel.findById(questionId);
  if (!question) throw new Error('Question not found');

  const section = await SectionModel.findById(question.sectionId);
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = buildPrompt(question, section);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Update question with AI explanation
    await QuestionModel.update(questionId, { explanationAi: text });
    
    return text;
  } catch (error: any) {
    logger.error('Error generating AI explanation', { error: error.message, questionId });
    throw new Error('Failed to generate AI explanation');
  }
}

function buildPrompt(question: any, section: any) {
  let context = '';
  
  if (section?.sectionType === 'reading' && section.passageText) {
    context = `Reading Passage:\n${section.passageText}\n\n`;
  } else if (section?.sectionType === 'listening') {
    context = `Context: This is a TOEFL ITP Listening question. (Note: Audio script is not available, please explain based on the logic of the question and options if possible).\n\n`;
  } else if (section?.sectionType === 'structure') {
    context = `Context: This is a TOEFL ITP Structure & Written Expression question. Analyze the grammar and sentence structure.\n\n`;
  }

  const questionInfo = `
Question Number: ${question.questionNumber}
Question Text: ${question.questionText}
Question Type: ${question.questionType}
Options/Data: ${JSON.stringify(question.questionData)}
Correct Answer: ${JSON.stringify(question.correctAnswer)}
  `;

  return `
You are an expert TOEFL ITP tutor. 
Your task is to provide a clear, professional, and educational explanation for the following question.

${context}
${questionInfo}

Instructions:
1. Explain why the correct answer is right.
2. If applicable, briefly explain why the other options are wrong.
3. Use a friendly but professional tone.
4. Keep it concise (max 150 words).
5. Format the output in clean text or simple markdown.
6. If it's a "Structure" question, focus on the specific grammar rule being tested.
7. If it's a "Reading" question, refer back to the logic of the passage.

Explanation:
  `.trim();
}
