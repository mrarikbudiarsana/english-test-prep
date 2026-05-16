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

export async function generateReadingQuestions(sectionId: string) {
  const section = await SectionModel.findById(sectionId);
  if (!section || section.sectionType !== 'reading') {
    throw new Error('Valid reading section with passage text is required');
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `
    You are an expert TOEFL ITP test creator.
    Based on the following reading passage, generate 10 high-quality multiple-choice questions in TOEFL ITP style.
    
    Reading Passage:
    ${section.passageText}
    
    Requirements:
    1. Questions should vary in type: Main Idea, Vocabulary in Context, Factual Information, Negative Factual, and Inference.
    2. Each question must have exactly 4 options (A, B, C, D).
    3. The correct answer must be clearly indicated.
    4. Provide a brief explanation for each question.
    5. Ensure the language level is appropriate for TOEFL ITP.
    
    Output Format (JSON):
    {
      "questions": [
        {
          "questionText": "...",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "explanation": "..."
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const data = JSON.parse(response.text());
    return data.questions;
  } catch (error: any) {
    logger.error('Error generating AI questions', { error: error.message, sectionId });
    throw new Error('Failed to generate AI questions');
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
