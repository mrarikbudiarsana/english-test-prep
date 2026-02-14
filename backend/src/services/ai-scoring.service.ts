import { openai } from '../config/openai';
import { query } from '../config/database';
import * as attemptModel from '../models/attempt.model';
import * as sectionModel from '../models/section.model';
import * as responseModel from '../models/response.model';
import * as userModel from '../models/user.model';
import { calculateOverallBand } from './scoring.service';
import * as emailService from './email.service';
import { NotFoundError } from '../middleware/errorHandler';

// ---------------------------------------------------------------------------
// IELTS AI scoring (Writing + Speaking)
// - Criterion bands MUST be whole numbers (0–9). No half bands per criterion.
// - Overall band is computed server-side as the mean of the 4 criteria,
//   rounded to the nearest 0.5 (IELTS style).
// Rubrics are based on the official IELTS Band Descriptors (Writing updated May
// 2023; Speaking descriptors as published on IELTS.org). See PDFs in repo.
// ---------------------------------------------------------------------------

type Band = number; // expected integer 0..9
type BandFeedback = { band: Band; feedback: string };

type WritingTaskFeedback = {
  taskNumber: number;
  wordCount: number;
  taskAchievement?: BandFeedback; // Task 1
  taskResponse?: BandFeedback; // Task 2
  coherenceCohesion: BandFeedback;
  lexicalResource: BandFeedback;
  grammaticalRangeAccuracy: BandFeedback;
  overallBand: number; // computed
  generalFeedback: string;
};

type WritingFeedbackResponse = {
  tasks: WritingTaskFeedback[];
  overallWritingBand: number; // computed
  summary: string;
};

type SpeakingPartFeedback = {
  partNumber: number;
  fluencyCoherence: BandFeedback;
  lexicalResource: BandFeedback;
  grammaticalRangeAccuracy: BandFeedback;
  pronunciation: BandFeedback;
  partFeedback: string;
};

type SpeakingFeedbackResponse = {
  parts: SpeakingPartFeedback[];
  overallSpeakingBand: number; // computed
  fluencyCoherence: BandFeedback; // overall across parts
  lexicalResource: BandFeedback;
  grammaticalRangeAccuracy: BandFeedback;
  pronunciation: BandFeedback;
  summary: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Enforce: whole band per criterion (0..9).
 * We use rounding to nearest whole number to handle model slips.
 * If you prefer stricter examiner behavior, swap Math.round -> Math.floor.
 */
function toWholeBand(value: unknown): Band {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(Math.round(n), 0, 9);
}

/** IELTS overall rounding: nearest 0.5 */
function roundToHalfBand(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 2) / 2;
}

/** Safe JSON parse (OpenAI can occasionally wrap JSON in text). */
function safeJsonParse<T = any>(raw: string): T {
  const trimmed = raw.trim();

  // Fast path
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Try to extract the first {...} block
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
      const slice = trimmed.slice(first, last + 1);
      return JSON.parse(slice) as T;
    }
    throw new Error('Unable to parse JSON response from AI');
  }
}

function computeOverallFromCriteria(criteriaBands: number[]): number {
  const valid = criteriaBands.filter((b) => Number.isFinite(b));
  if (valid.length === 0) return 0;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return roundToHalfBand(avg);
}

// ---------------------------------------------------------------------------
// System prompts (rubrics paraphrased from official descriptors)
// ---------------------------------------------------------------------------

/**
 * IMPORTANT:
 * We paraphrase descriptor text to avoid copying large verbatim passages.
 * The intent is to preserve the full set of levels and distinguishing features.
 */
const WRITING_SYSTEM_PROMPT = `
You are an IELTS examiner. Score IELTS Writing using the official IELTS Writing Band Descriptors (updated May 2023) across FOUR criteria:

Task 1 criteria: Task Achievement (TA), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA).
Task 2 criteria: Task Response (TR), Coherence & Cohesion (CC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA).

CRITICAL RULES
- Give WHOLE bands only (integers 0–9) for EACH criterion. Do NOT use half bands for criteria.
- Select the band that the script best fits overall, and it must fully meet the positive features at that level.
- If a response is 20 words or fewer, treat it as Band 1 across criteria (and discount any copied rubric).
- Consider word count minimums:
  * Task 1: at least 150 words
  * Task 2: at least 250 words
  Underlength responses are penalised (usually Task Achievement/Task Response and can affect others).

RUBRIC — WRITING TASK 1 (TA / CC / LR / GRA)
Band 9: fully satisfies task; effortless message; cohesive devices invisible; flawless paragraphing; wide precise vocab; rare spelling slips; wide structures fully controlled; rare grammar slips.
Band 8: covers requirements sufficiently; (Academic) key features expertly selected and clearly highlighted; (GT) all bullet points well developed; logical sequencing; cohesion well managed; wide vocab with skilled uncommon/idiomatic use (minor collocation slips); mostly error-free sentences; punctuation well managed.
Band 7: covers requirements; relevant accurate content with minor omissions; appropriate format; clear overview (Academic) or clear purpose + appropriate tone (GT); clear progression; range of cohesive devices with minor issues; enough vocab for flexibility; some less common/idiomatic use with occasional inappropriacies; variety of complex structures; frequent error-free sentences; a few persistent grammar errors not impeding communication.
Band 6: focuses on requirements; appropriate format; key features/bullets covered and adequately highlighted; overview attempted (Academic) / purpose generally clear (GT); some irrelevant/inaccurate detail may appear; generally coherent progression; cohesion sometimes faulty/mechanical; vocab generally adequate but limited precision; some spelling/word-formation errors not impeding; mix of simple+complex with limited flexibility; errors occur but rarely impede.
Band 5: generally addresses task but may be inappropriate format; (Academic) key features insufficiently covered and detail may be mechanical; (GT) bullet points presented but one+ underdeveloped, purpose sometimes unclear, tone variable; limited extension/illustration; organisation not fully logical; weak sentence linking; limited/overused cohesive devices; repetitive referencing; limited vocab; frequent simplification/repetition; noticeable spelling/word-formation errors may cause difficulty; limited repetitive structures; complex attempts faulty; frequent grammar/punctuation errors may cause difficulty.
Band 4: minimal attempt; (Academic) few key features; (GT) missing bullets; purpose unclear/confused and tone may be inappropriate; inappropriate format; key features may be irrelevant/repetitive/inaccurate; no clear progression; basic cohesive devices but inaccurate/repetitive; weak referencing/substitution; vocab basic/limited, may rely on memorised chunks; errors can impede meaning; very limited structures, mostly simple; frequent grammar errors can impede; punctuation often faulty.
Band 3: fails to address requirements (often misunderstanding); key features largely irrelevant; limited repetitive info; no logical organisation; minimal sequencers/cohesion; referencing hard to identify; vocab inadequate/underlength or memorised; spelling/word choice control very limited and errors may severely impede; grammar/punctuation errors predominate and prevent meaning.
Band 2: barely related/off-topic; little control of organisation; extremely limited strings; no control of word formation/spelling; little/no sentence form evidence.
Band 1: 20 words or fewer; content unrelated; effectively non-writer; no rateable language beyond isolated words.
Band 0: did not attempt / non-English / wholly memorised.

RUBRIC — WRITING TASK 2 (TR / CC / LR / GRA)
Band 9: addresses prompt in depth; clear fully developed position; ideas fully extended and supported; effortless progression/cohesion; skilled paragraphing; wide sophisticated vocab with rare slips; wide structures fully controlled.
Band 8: sufficiently addresses prompt; clear well-developed position; ideas relevant, extended, supported; logical sequencing and well-managed cohesion; wide vocab with skilled uncommon/idiomatic use (minor slips); wide structures with majority error-free sentences.
Band 7: main parts addressed; clear developed position; main ideas supported but may overgeneralise or lack focus/precision; clear progression with minor lapses; flexible cohesive devices with some over/underuse; generally effective paragraphing; sufficient vocab with some less common/idiomatic use and occasional inappropriacy; variety of complex structures; frequent error-free sentences; a few persistent grammar errors not impeding.
Band 6: main parts addressed though uneven; position relevant but conclusions may be unclear/justified/repetitive; main ideas relevant but some unclear or insufficiently developed; generally coherent progression; cohesion sometimes faulty/mechanical; referencing/repetition issues; paragraphing sometimes illogical; vocab adequate but limited precision; some spelling/word formation errors not impeding; mix of simple+complex with limited flexibility; errors occur but rarely impede.
Band 5: prompt incompletely addressed; format may be inappropriate; position stated but development unclear; ideas limited/insufficiently developed with possible irrelevant detail and repetition; organisation partially logical but weak progression; limited/overused cohesion; sentence linking not fluent; paragraphing weak/missing; vocab limited with frequent inappropriate choices and repetition; spelling/word formation errors noticeable and may cause difficulty; limited repetitive structures; faulty complex attempts; frequent grammar errors may cause difficulty; punctuation faulty.
Band 4: minimal/tangential response (misunderstanding possible); position hard to find; ideas hard to identify and lack relevance/clarity/support; large repetition; no clear progression; basic cohesion inaccurate/repetitive; poor referencing; paragraphing absent/unclear; vocab basic/limited or memorised chunks; errors can impede; very limited structures, mainly simple; frequent grammar errors can impede; punctuation often faulty.
Band 3: no part addressed adequately / misunderstood; no relevant position; few irrelevant/undeveloped ideas; no logical organisation; minimal cohesive devices; referencing difficult; paragraphing unhelpful; vocab inadequate/underlength or memorised; errors predominate and may severely impede; grammar/punctuation errors predominate and prevent meaning.
Band 2: barely related; no position; only glimpses of ideas; little organisation control; extremely limited strings; no spelling/word-formation control; little/no sentence evidence.
Band 1: 20 words or fewer; unrelated; no communication; no resource; no rateable language.
Band 0: did not attempt / non-English / wholly memorised.

OUTPUT FORMAT (VALID JSON ONLY)
{
  "tasks": [
    {
      "taskNumber": 1,
      "wordCount": 0,
      "taskAchievement": {"band": 0, "feedback": ""},
      "coherenceCohesion": {"band": 0, "feedback": ""},
      "lexicalResource": {"band": 0, "feedback": ""},
      "grammaticalRangeAccuracy": {"band": 0, "feedback": ""},
      "generalFeedback": ""
    }
  ],
  "summary": ""
}
Notes:
- For Task 2, use "taskResponse" instead of "taskAchievement".
- Do NOT include overallBand fields; they are computed server-side.
`;

const SPEAKING_SYSTEM_PROMPT = `
You are an IELTS examiner. Score IELTS Speaking using the official Speaking Band Descriptors across FOUR criteria:
Fluency & Coherence (FC), Lexical Resource (LR), Grammatical Range & Accuracy (GRA), Pronunciation (P).

CRITICAL RULES
- Give WHOLE bands only (integers 0–9) for EACH criterion. Do NOT use half bands for criteria.
- Use the band level that best fits overall performance. A candidate must fully fit the positive features at that level.
- This is transcript-based scoring: for Pronunciation, only comment on what can be inferred (e.g., noted mispronunciations, hesitations marked, repeated reformulation). Do not invent accent details.

RUBRIC (Paraphrased)
Band 9: FC—virtually no repetition/self-correction; hesitation is content planning; fully coherent and extended. LR—total flexibility + idiomatic accuracy. GRA—precise/accurate at all times except native-like slips. P—full phonological range, connected speech sustained, effortless intelligibility.
Band 8: FC—fluent; occasional repetition/self-correction; mostly content-related hesitation; coherent topic development. LR—wide, flexible; less common/idiomatic used skilfully with minor slips; paraphrase effective. GRA—wide range; most sentences error-free; occasional non-systematic/basic errors. P—wide phonological range; rhythm/stress/intonation sustained with occasional lapses; easy to understand; accent minimally affects intelligibility.
Band 7: FC—long turns without noticeable effort; some mid-sentence language-search hesitation but coherence maintained; flexible discourse markers/connectives. LR—flexible for many topics; some less common/idiomatic; style/collocation awareness though inappropriacies. GRA—range used flexibly; frequent error-free sentences; some errors persist. P—shows all Band 6 positives and some Band 8 positives (not all).
Band 6: FC—willing to speak at length; coherence sometimes lost due to hesitation/repetition/self-correction; uses range of discourse markers not always appropriately. LR—enough to discuss at length; occasional inappropriate word choice but meaning clear; generally paraphrases successfully. GRA—mix of short+complex forms; limited flexibility; errors frequent in complex but rarely impede. P—range of features with variable control; chunking generally ok but rhythm may be affected; some effective stress/intonation not sustained; occasional mispronunciation reduces clarity; generally understandable.
Band 5: FC—can keep going but relies on repetition/self-correction/slow rate; hesitations often mid-sentence for basic lexis/grammar; overuse of markers; complex speech causes disfluency. LR—sufficient but limited flexibility; paraphrase attempts mixed. GRA—basic forms fairly controlled; limited complex range; complex errors often require reformulation. P—some acceptable features but limited range/control; frequent mispronunciation and reduced clarity; sometimes difficult to understand.
Band 4: FC—noticeable pauses; slow with repetition; can link simple sentences but repetitious connectives; breakdowns in coherence. LR—enough for familiar topics only; basic meaning on unfamiliar; frequent inappropriacies; rarely paraphrases. GRA—basic forms; short turns; repetitive structures; frequent errors. P—limited range; frequent rhythm/chunking lapses; limited stress/intonation; frequent mispronunciation; requires effort to understand; patches unintelligible.
Band 3: FC—frequent/long pauses; limited ability beyond simple responses; often fails to convey basic message. LR—limited simple vocab for personal info; inadequate for unfamiliar. GRA—many errors except memorised utterances; limited evidence. P—limited evidence; overall delivery problems impair connected speech; often unintelligible.
Band 2: FC—lengthy pauses before nearly every word; isolated words/memorised; little communicative value. LR—very limited; isolated words/memorised; needs mime/gesture. GRA—no evidence of basic sentence forms. P—few acceptable features; mispronunciation dominates; little meaning.
Band 1: FC—essentially none; totally incoherent. LR—no resource beyond isolated words. GRA—no rateable language unless memorised. P—occasional recognisable sounds/words but no overall meaning; unintelligible.
Band 0: does not attend.

OUTPUT FORMAT (VALID JSON ONLY)
{
  "parts": [
    {
      "partNumber": 1,
      "fluencyCoherence": {"band": 0, "feedback": ""},
      "lexicalResource": {"band": 0, "feedback": ""},
      "grammaticalRangeAccuracy": {"band": 0, "feedback": ""},
      "pronunciation": {"band": 0, "feedback": ""},
      "partFeedback": ""
    }
  ],
  "fluencyCoherence": {"band": 0, "feedback": ""},
  "lexicalResource": {"band": 0, "feedback": ""},
  "grammaticalRangeAccuracy": {"band": 0, "feedback": ""},
  "pronunciation": {"band": 0, "feedback": ""},
  "summary": ""
}
`;

// ---------------------------------------------------------------------------
// AI scoring functions
// ---------------------------------------------------------------------------

/**
 * Score the writing section of an attempt using OpenAI.
 * - Pulls all writing tasks and candidate responses
 * - Sends rubric + prompt
 * - Normalizes criterion bands to whole numbers
 * - Computes task overall band (nearest 0.5) server-side
 * - Computes overall writing band across tasks server-side
 */
export async function scoreWriting(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');

  const writingSections = await sectionModel.findByTestIdAndType(attempt.testId, 'writing');
  if (writingSections.length === 0) return;

  const taskPrompts: string[] = [];

  for (const section of writingSections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);

    const taskDesc = section.taskDescription || section.instructions || 'No task description provided.';
    const taskNum = section.taskNumber || section.sectionOrder;

    const writingTexts = responses
      .filter((r: any) => r.writingText)
      .map((r: any) => r.writingText)
      .join('\n\n');

    const minWords = section.minWords || (taskNum === 1 ? 150 : 250);

    if (!writingTexts) {
      taskPrompts.push(
        `## Writing Task ${taskNum}\n**Task:** ${taskDesc}\n**Minimum Words:** ${minWords}\n**Candidate Response:** [No response submitted]\n`,
      );
      continue;
    }

    const wordCount = writingTexts.split(/\s+/).filter(Boolean).length;
    taskPrompts.push(
      `## Writing Task ${taskNum}\n**Task:** ${taskDesc}\n**Minimum Words:** ${minWords}\n**Candidate Response (${wordCount} words):**\n${writingTexts}\n`,
    );
  }

  const userPrompt = `Evaluate this IELTS Writing submission.\n\n${taskPrompts.join('\n---\n\n')}`;

  const ai = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: WRITING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_completion_tokens: 3500,
  });

  const raw = ai.choices[0]?.message?.content;
  if (!raw) {
    console.error('Empty response from OpenAI for writing scoring');
    return;
  }

  const parsed = safeJsonParse<{ tasks?: any[]; summary?: string }>(raw);

  const normalizedTasks: WritingTaskFeedback[] = (parsed.tasks || []).map((t: any) => {
    const taskNumber = Number(t.taskNumber) || 1;
    const wordCount = Number(t.wordCount) || 0;

    // Task 1 uses Task Achievement; Task 2 uses Task Response.
    const taskAchievement = t.taskAchievement
      ? { band: toWholeBand(t.taskAchievement.band), feedback: String(t.taskAchievement.feedback || '') }
      : undefined;

    const taskResponse = t.taskResponse
      ? { band: toWholeBand(t.taskResponse.band), feedback: String(t.taskResponse.feedback || '') }
      : undefined;

    const coherenceCohesion: BandFeedback = {
      band: toWholeBand(t.coherenceCohesion?.band),
      feedback: String(t.coherenceCohesion?.feedback || ''),
    };

    const lexicalResource: BandFeedback = {
      band: toWholeBand(t.lexicalResource?.band),
      feedback: String(t.lexicalResource?.feedback || ''),
    };

    const grammaticalRangeAccuracy: BandFeedback = {
      band: toWholeBand(t.grammaticalRangeAccuracy?.band),
      feedback: String(t.grammaticalRangeAccuracy?.feedback || ''),
    };

    const generalFeedback = String(t.generalFeedback || '');

    // Compute overall per task
    const taskCriterionBands: number[] = [];

    if (taskNumber === 1) {
      taskCriterionBands.push(taskAchievement?.band ?? 0);
    } else {
      taskCriterionBands.push(taskResponse?.band ?? 0);
    }
    taskCriterionBands.push(coherenceCohesion.band, lexicalResource.band, grammaticalRangeAccuracy.band);

    const overallBand = computeOverallFromCriteria(taskCriterionBands);

    return {
      taskNumber,
      wordCount,
      taskAchievement,
      taskResponse,
      coherenceCohesion,
      lexicalResource,
      grammaticalRangeAccuracy,
      overallBand,
      generalFeedback,
    };
  });

  // Overall writing band: average of task overall bands (if multiple tasks)
  const overallWritingBand = computeOverallFromCriteria(normalizedTasks.map((t) => t.overallBand));

  const feedback: WritingFeedbackResponse = {
    tasks: normalizedTasks,
    overallWritingBand,
    summary: String(parsed.summary || ''),
  };

  // Persist per-response feedback
  for (const section of writingSections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
    const taskNum = section.taskNumber || section.sectionOrder;
    const taskFeedback = feedback.tasks.find((t) => t.taskNumber === taskNum);

    for (const resp of responses) {
      if (!taskFeedback) continue;
      if (!resp.writingText) continue;

      await responseModel.updateScore(resp.id, {
        isCorrect: false,
        score: taskFeedback.overallBand || 0,
        aiFeedback: taskFeedback,
      });
    }
  }

  await attemptModel.updateScores(attemptId, {
    writingBand: feedback.overallWritingBand,
    writingFeedback: feedback,
  });
}

/**
 * Score the speaking section of an attempt using Whisper + OpenAI.
 * - Transcribes audio where available
 * - Scores each part
 * - Normalizes criterion bands to whole numbers
 * - Computes overall speaking band server-side (nearest 0.5)
 */
export async function scoreSpeaking(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) throw new NotFoundError('Attempt not found');

  const speakingSections = await sectionModel.findByTestIdAndType(attempt.testId, 'speaking');
  if (speakingSections.length === 0) return;

  const partTranscripts: string[] = [];

  for (const section of speakingSections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
    const partNum = section.partNumber || section.sectionOrder;

    const prompts = section.speakingPrompts || {};
    const promptText = typeof prompts === 'string' ? prompts : JSON.stringify(prompts, null, 2);

    const transcriptions: string[] = [];

    for (const resp of responses) {
      // Collect all audio URLs: from answerData.recordings (multi-prompt) or audioUrl (single)
      const audioUrls: string[] = [];

      const recordingsMap = resp.answerData?.recordings as Record<string, { url: string; duration: number }> | undefined;
      if (recordingsMap && typeof recordingsMap === 'object') {
        // Multiple prompt recordings stored in answerData
        const sorted = Object.keys(recordingsMap)
          .map(Number)
          .sort((a, b) => a - b);
        for (const idx of sorted) {
          if (recordingsMap[idx]?.url) audioUrls.push(recordingsMap[idx].url);
        }
      } else if (resp.audioUrl) {
        audioUrls.push(resp.audioUrl);
      }

      for (const url of audioUrls) {
        try {
          // Add timeout to prevent hanging on unreachable audio URLs
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const audioResponse = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          const audioBlob = await audioResponse.blob();
          // eslint-disable-next-line no-undef
          const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

          const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: audioFile,
            language: 'en',
          });

          transcriptions.push(transcription.text);
        } catch (err) {
          console.error(`Error transcribing audio for response ${resp.id}:`, err);
        }
      }

      // Fallback: plain-text answerData
      if (audioUrls.length === 0 && resp.answerData && typeof resp.answerData === 'string') {
        transcriptions.push(resp.answerData);
      }
    }

    const combinedTranscript = transcriptions.join('\n\n');

    if (combinedTranscript) {
      partTranscripts.push(
        `## Speaking Part ${partNum}\n**Examiner Prompts/Questions:**\n${promptText}\n\n**Candidate Response (Transcription):**\n${combinedTranscript}\n`,
      );
    } else {
      partTranscripts.push(
        `## Speaking Part ${partNum}\n**Examiner Prompts/Questions:**\n${promptText}\n\n**Candidate Response:** [No response recorded]\n`,
      );
    }
  }

  const userPrompt = `Evaluate this IELTS Speaking test transcription.\n\n${partTranscripts.join('\n---\n\n')}`;

  const ai = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      { role: 'system', content: SPEAKING_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_completion_tokens: 3500,
  });

  const raw = ai.choices[0]?.message?.content;
  if (!raw) {
    console.error('Empty response from OpenAI for speaking scoring');
    return;
  }

  const parsed = safeJsonParse<any>(raw);

  const normalizedParts: SpeakingPartFeedback[] = (parsed.parts || []).map((p: any) => {
    const partNumber = Number(p.partNumber) || 1;

    const fluencyCoherence: BandFeedback = {
      band: toWholeBand(p.fluencyCoherence?.band),
      feedback: String(p.fluencyCoherence?.feedback || ''),
    };
    const lexicalResource: BandFeedback = {
      band: toWholeBand(p.lexicalResource?.band),
      feedback: String(p.lexicalResource?.feedback || ''),
    };
    const grammaticalRangeAccuracy: BandFeedback = {
      band: toWholeBand(p.grammaticalRangeAccuracy?.band),
      feedback: String(p.grammaticalRangeAccuracy?.feedback || ''),
    };
    const pronunciation: BandFeedback = {
      band: toWholeBand(p.pronunciation?.band),
      feedback: String(p.pronunciation?.feedback || ''),
    };

    return {
      partNumber,
      fluencyCoherence,
      lexicalResource,
      grammaticalRangeAccuracy,
      pronunciation,
      partFeedback: String(p.partFeedback || ''),
    };
  });

  // Overall criterion feedback (across parts)
  const overallFluency: BandFeedback = {
    band: toWholeBand(parsed.fluencyCoherence?.band),
    feedback: String(parsed.fluencyCoherence?.feedback || ''),
  };
  const overallLexical: BandFeedback = {
    band: toWholeBand(parsed.lexicalResource?.band),
    feedback: String(parsed.lexicalResource?.feedback || ''),
  };
  const overallGRA: BandFeedback = {
    band: toWholeBand(parsed.grammaticalRangeAccuracy?.band),
    feedback: String(parsed.grammaticalRangeAccuracy?.feedback || ''),
  };
  const overallPron: BandFeedback = {
    band: toWholeBand(parsed.pronunciation?.band),
    feedback: String(parsed.pronunciation?.feedback || ''),
  };

  const overallSpeakingBand = computeOverallFromCriteria([
    overallFluency.band,
    overallLexical.band,
    overallGRA.band,
    overallPron.band,
  ]);

  const feedback: SpeakingFeedbackResponse = {
    parts: normalizedParts,
    overallSpeakingBand,
    fluencyCoherence: overallFluency,
    lexicalResource: overallLexical,
    grammaticalRangeAccuracy: overallGRA,
    pronunciation: overallPron,
    summary: String(parsed.summary || ''),
  };

  for (const section of speakingSections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
    const partNum = section.partNumber || section.sectionOrder;
    const partFeedback = feedback.parts.find((p) => p.partNumber === partNum);

    for (const resp of responses) {
      if (!partFeedback) continue;
      if (!(resp.audioUrl || resp.answerData)) continue;

      await responseModel.updateScore(resp.id, {
        isCorrect: false,
        score: feedback.overallSpeakingBand || 0,
        aiFeedback: partFeedback,
      });
    }
  }

  await attemptModel.updateScores(attemptId, {
    speakingBand: feedback.overallSpeakingBand,
    speakingFeedback: feedback,
  });
}

/**
 * Finalize scoring after all sections have been scored.
 * Calculates the overall band score and marks the attempt as completed.
 */
export async function finalizeScoring(attemptId: string) {
  // 1. Get attempt to see test type
  const attemptResult = await query(
    `SELECT a.*, t.test_type
     FROM attempts a
     JOIN tests t ON t.id = a.test_id
     WHERE a.id = $1`,
    [attemptId]
  );
  const attempt = attemptResult.rows[0];
  if (!attempt) throw new Error('Attempt not found');

  const testType = attempt.test_type;

  // 2. Calculate overall score based on test type
  let overall = 0;

  if (testType === 'toefl_itp') {
    // For TOEFL iTP, we need to ensure all sections are scored.
    // Structure is objective, so it should have been scored by scoreObjectiveSection.
    // Listening and Reading are also objective.
    overall = calculateOverallBand(
      attempt.listening_score,
      attempt.reading_score,
      0, 0,
      attempt.structure_score,
      testType
    );
  } else {
    // IELTS default
    overall = calculateOverallBand(
      attempt.listening_band,
      attempt.reading_band,
      attempt.writing_band,
      attempt.speaking_band,
      null,
      testType
    );
  }

  // 3. Update attempt with overall score
  await query(
    `UPDATE attempts SET overall_band = $1, status = 'completed' WHERE id = $2`,
    [overall, attemptId]
  );

  await attemptModel.updateScores(attemptId, { overallBand: overall });
  await attemptModel.complete(attemptId);

  // Send results-ready email (fire-and-forget)
  if (attempt.userId) {
    userModel.findById(attempt.userId).then((user) => {
      if (user?.email) {
        emailService.sendResultsReady({
          to: user.email,
          displayName: user.displayName || 'there',
          attemptId,
          overallBand: overall,
        }).catch((err) => console.error('Failed to send results email:', err));
      }
    }).catch(() => { });
  }
}
