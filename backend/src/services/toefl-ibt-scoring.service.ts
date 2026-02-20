import { openai } from '../config/openai';
import * as attemptModel from '../models/attempt.model';
import * as sectionModel from '../models/section.model';
import * as responseModel from '../models/response.model';
import {
  speakingRawToScaled,
  writingRawToScaled,
  score30ToBand1_6
} from '../config/toeflIbtScoreMappings';

// ---------------------------------------------------------------------------
// TOEFL iBT AI Scoring (Writing + Speaking)
// ---------------------------------------------------------------------------

type RawScore = number; // 0-5 for Writing, 0-4 for Speaking
type ScoreFeedback = { score: RawScore; feedback: string };

// --- Writing Interfaces ---

export interface ToeflWritingTaskFeedback {
  taskNumber: number;
  wordCount: number;
  rawScore: number; // 0-5
  development?: ScoreFeedback;
  organization?: ScoreFeedback;
  languageUse?: ScoreFeedback;
  generalFeedback: string;
}

export interface ToeflWritingFeedbackResponse {
  tasks: ToeflWritingTaskFeedback[];
  overallRawAverage: number; // 0-5
  scaledScore: number;       // 0-30
  bandScore: number;         // 1-6
  summary: string;
}

// --- Speaking Interfaces ---

export interface ToeflSpeakingTaskFeedback {
  taskNumber: number;
  rawScore: number; // 0-4
  delivery?: ScoreFeedback;
  languageUse?: ScoreFeedback;
  topicDevelopment?: ScoreFeedback;
  generalFeedback: string;
}

export interface ToeflSpeakingFeedbackResponse {
  tasks: ToeflSpeakingTaskFeedback[];
  overallRawAverage: number; // 0-4
  scaledScore: number;       // 0-30
  bandScore: number;         // 1-6
  summary: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeJsonParse<T = any>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      const slice = trimmed.slice(first, last + 1);
      return JSON.parse(slice) as T;
    }
    throw new Error('Unable to parse JSON response from AI');
  }
}

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------

const WRITING_SYSTEM_PROMPT = `
You are a highly trained TOEFL iBT Writing rater. Score the response using the OFFICIAL TOEFL iBT Writing Rubrics.

**Task 1: Integrated Writing Task**
Score on a scale of 0 to 5 (whole numbers only).
- **5 (Good):** Successfully selects the important information from the lecture and coherently and accurately presents this information in relation to the relevant information in the reading. Well organized, occasional language errors.
- **4 (Fair):** Generally good but with weakness: minor omission/inaccuracy, minor vagueness, or more frequent/obvious language errors.
- **3 (Limited):** Contains some important information but misses key details, or includes inaccurate/vague info. Limited organization or significant language errors.
- **2 (Very Limited):** Contains little relevant info, severe language errors, or mainly just copies text.
- **1 (Basic):** Little or no meaningful content.
- **0:** Writes nothing or off-topic.

**Task 2: Writing for an Academic Discussion**
Score on a scale of 0 to 5 (whole numbers only).
- **5 (Exemplary):** Relevant, clearly expressed, well-developed contribution. Effective use of language with variety and accuracy.
- **4 (Strong):** Relevant and clearly expressed but with some minor limitations in development or language use (minor errors).
- **3 (Moderate):** Relevant but missing some development. Language errors may be noticeable but do not impede understanding.
- **2 (Limited):** Attempt to contribute but limited development or significant language errors.
- **1 (Weak):** Very limited content or severe errors.
- **0:** Off-topic or copied.

**Output Format (JSON):**
{
  "tasks": [
    {
      "taskNumber": 1, 
      "wordCount": 200,
      "rawScore": 4,
      "development": { "score": 4, "feedback": "..." },
      "organization": { "score": 4, "feedback": "..." },
      "languageUse": { "score": 4, "feedback": "..." },
      "generalFeedback": "Evaluate synthesis of reading/listening..."
    },
    ...
  ],
  "summary": "Overall summary of performance..."
}
`;

const SPEAKING_SYSTEM_PROMPT = `
You are a highly trained TOEFL iBT Speaking rater. Score the response using the OFFICIAL TOEFL iBT Speaking Rubrics.

**All Tasks (Independent & Integrated)**
Score on a scale of 0 to 4 (whole numbers only).

- **4 (Good):** Clear, fluid, sustained delivery. Minor lapses in intonation/pronunciation. Good control of grammar/vocab (minor errors). Topic is fully developed with clear progression of ideas.
- **3 (Fair):** delivery is generally clear but with some pauses/hesitations. Some limitations in grammar/vocab range. Topic is developed but may lack some specificity or connection of ideas.
- **2 (Limited):** Delivery is choppy or slow. Limited range of grammar/vocab with frequent errors. Topic development is limited, basic, or vague.
- **1 (Weak):** Delivery is difficult to follow. Very limited vocabulary/grammar. Topic is minimally developed.
- **0:** No response or off-topic.

**Output Format (JSON):**
{
  "tasks": [
    {
      "taskNumber": 1,
      "rawScore": 3,
      "delivery": { "score": 3, "feedback": "..." },
      "languageUse": { "score": 3, "feedback": "..." },
      "topicDevelopment": { "score": 3, "feedback": "..." },
      "generalFeedback": "..."
    }
  ],
  "summary": "..."
}
`;

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

export async function scoreWriting(attemptId: string): Promise<ToeflWritingFeedbackResponse> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new Error('Attempt not found');

  const sections = await sectionModel.findByTestId(attempt.testId);
  const writingSection = sections.find(s => s.sectionType === 'writing');
  if (!writingSection) throw new Error('No writing section found');

  const responses = await responseModel.findByAttemptAndSection(attemptId, writingSection.id);
  if (!responses || responses.length === 0) {
    return {
      tasks: [],
      overallRawAverage: 0,
      scaledScore: 0,
      bandScore: 1,
      summary: 'No writing responses submitted.'
    };
  }

  let userPrompt = "Here are the candidate's writing responses:\n\n";
  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    userPrompt += `Task ${i + 1}:\n${r.writingText || "(No response)"}\n\n`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: WRITING_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" }
  });

  const result = safeJsonParse<any>(completion.choices[0].message.content || '{}');
  const tasks = result.tasks || [];

  let totalRaw = 0;
  let count = 0;
  for (const t of tasks) {
    if (typeof t.rawScore === 'number') {
      totalRaw += t.rawScore;
      count++;
    }
  }

  const overallRawAverage = count > 0 ? totalRaw / count : 0;
  const scaledScore = writingRawToScaled(overallRawAverage);
  const bandScore = score30ToBand1_6(scaledScore, 'writing');

  for (let i = 0; i < responses.length; i++) {
    if (i < tasks.length) {
      await responseModel.updateScore(responses[i].id, {
        score: tasks[i].rawScore, // Save raw 0-5
        aiFeedback: tasks[i],
        isCorrect: true
      });
    }
  }

  // Also update the Attempt with the new Band score for reporting
  await attemptModel.updateScores(attemptId, {
    writingRaw: overallRawAverage,
    writingScore30: scaledScore,
    writingBand: bandScore
  });

  return {
    tasks,
    overallRawAverage,
    scaledScore,
    bandScore,
    summary: result.summary || ''
  };
}

export async function scoreSpeaking(attemptId: string): Promise<ToeflSpeakingFeedbackResponse> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new Error('Attempt not found');

  const sections = await sectionModel.findByTestId(attempt.testId);
  const speakingSection = sections.find(s => s.sectionType === 'speaking');
  if (!speakingSection) throw new Error('No speaking section found');

  const responses = await responseModel.findByAttemptAndSection(attemptId, speakingSection.id);
  if (!responses || responses.length === 0) {
    return {
      tasks: [],
      overallRawAverage: 0,
      scaledScore: 0,
      bandScore: 1,
      summary: 'No speaking responses submitted.'
    };
  }

  let userPrompt = "Here are the candidate's speaking transcripts:\n\n";
  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    const text = r.writingText || r.answerData?.transcript || "(Audio not transcribed)";
    userPrompt += `Task ${i + 1}:\n${text}\n\n`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SPEAKING_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" }
  });

  const result = safeJsonParse<any>(completion.choices[0].message.content || '{}');
  const tasks = result.tasks || [];

  let totalRaw = 0;
  let count = 0;
  for (const t of tasks) {
    if (typeof t.rawScore === 'number') {
      totalRaw += t.rawScore;
      count++;
    }
  }

  const overallRawAverage = count > 0 ? totalRaw / count : 0;
  const scaledScore = speakingRawToScaled(overallRawAverage);
  const bandScore = score30ToBand1_6(scaledScore, 'speaking');

  for (let i = 0; i < responses.length; i++) {
    if (i < tasks.length) {
      await responseModel.updateScore(responses[i].id, {
        score: tasks[i].rawScore, // Save raw 0-4
        aiFeedback: tasks[i],
        isCorrect: true
      });
    }
  }

  // Also update the Attempt with the new Band score for reporting
  await attemptModel.updateScores(attemptId, {
    speakingRaw: overallRawAverage,
    speakingScore30: scaledScore,
    speakingBand: bandScore
  });

  return {
    tasks,
    overallRawAverage,
    scaledScore,
    bandScore,
    summary: result.summary || ''
  };
}
