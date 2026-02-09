import { openai } from '../config/openai';
import * as attemptModel from '../models/attempt.model';
import * as sectionModel from '../models/section.model';
import * as questionModel from '../models/question.model';
import * as responseModel from '../models/response.model';
import { calculateOverallBand } from './scoring.service';
import { NotFoundError } from '../middleware/errorHandler';

// ---------------------------------------------------------------------------
// System prompts for IELTS AI scoring
// ---------------------------------------------------------------------------

const WRITING_SYSTEM_PROMPT = `You are an expert IELTS examiner with extensive experience scoring IELTS Writing tasks. You must evaluate the candidate's writing using the official IELTS Writing Band Descriptors across four criteria:

1. **Task Achievement (Task 1) / Task Response (Task 2)**
   - Band 9: Fully satisfies all requirements of the task; clearly presents a fully developed response.
   - Band 8: Sufficiently addresses all parts of the task; presents a well-developed response with relevant, extended, and supported ideas.
   - Band 7: Addresses all parts of the task; presents a clear position throughout the response; presents, extends, and supports main ideas (but may over-generalise or lack focus).
   - Band 6: Addresses all parts of the task although some parts may be more fully covered than others; presents a relevant position although conclusions may be unclear or repetitive.
   - Band 5: Addresses the task only partially; format may be inappropriate in places; expresses a position but development is not always clear.
   - Band 4: Responds to the task only in a minimal way or the answer is tangential; format may be inappropriate.
   - Band 3: Does not adequately address any part of the task; does not express a clear position.
   - Band 2: Barely responds to the task; no position can be identified.
   - Band 1: Answer is completely unrelated to the task.

2. **Coherence and Cohesion**
   - Band 9: Uses cohesion in such a way that it attracts no attention; skilfully manages paragraphing.
   - Band 8: Sequences information and ideas logically; manages all aspects of cohesion well; uses paragraphing sufficiently and appropriately.
   - Band 7: Logically organises information and ideas; there is clear progression throughout; uses a range of cohesive devices appropriately although there may be some under/over-use.
   - Band 6: Arranges information and ideas coherently; there is a clear overall progression; uses cohesive devices effectively but cohesion within and/or between sentences may be faulty or mechanical.
   - Band 5: Presents information with some organisation but there may be a lack of overall progression; makes inadequate, inaccurate, or over-use of cohesive devices.
   - Band 4: Presents information and ideas but these are not arranged coherently; uses some basic cohesive devices but these may be inaccurate or repetitive.
   - Band 3: Does not organise ideas logically; may use a very limited range of cohesive devices, and those used may not indicate a logical relationship between ideas.

3. **Lexical Resource**
   - Band 9: Uses a wide range of vocabulary with very natural and sophisticated control of lexical features; rare minor errors occur only as slips.
   - Band 8: Uses a wide range of vocabulary fluently and flexibly; skilfully uses uncommon lexical items; occasional inaccuracies in word choice and collocation; rare errors in spelling and/or word formation.
   - Band 7: Uses a sufficient range of vocabulary to allow some flexibility and precision; uses less common lexical items with some awareness of style and collocation; may produce occasional errors in word choice, spelling, and/or word formation.
   - Band 6: Uses an adequate range of vocabulary for the task; attempts to use less common vocabulary but with some inaccuracy; makes some errors in spelling and/or word formation but they do not impede communication.
   - Band 5: Uses a limited range of vocabulary, but this is minimally adequate for the task; may make noticeable errors in spelling and/or word formation that may cause some difficulty for the reader.

4. **Grammatical Range and Accuracy**
   - Band 9: Uses a wide range of structures with full flexibility and accuracy; rare minor errors occur only as slips.
   - Band 8: Uses a wide range of structures; the majority of sentences are error-free; makes only very occasional errors or inappropriacies.
   - Band 7: Uses a variety of complex structures; produces frequent error-free sentences; has good control of grammar and punctuation but may make a few errors.
   - Band 6: Uses a mix of simple and complex sentence forms; makes some errors in grammar and punctuation but they rarely reduce communication.
   - Band 5: Uses only a limited range of structures; attempts complex sentences but these tend to be less accurate than simple sentences; may make frequent grammatical errors.

**Instructions:**
- Evaluate each writing task separately if there are multiple tasks (Task 1 and Task 2).
- For each criterion, provide a band score (whole or half bands from 0 to 9).
- Provide the overall writing band as the average of the four criteria, rounded to the nearest 0.5.
- Include specific, constructive feedback for each criterion referencing examples from the candidate's writing.
- Note word count compliance (Task 1: minimum 150 words, Task 2: minimum 250 words).

You MUST respond with valid JSON in the following format:
{
  "tasks": [
    {
      "taskNumber": 1,
      "wordCount": <number>,
      "taskAchievement": { "band": <number>, "feedback": "<string>" },
      "coherenceCohesion": { "band": <number>, "feedback": "<string>" },
      "lexicalResource": { "band": <number>, "feedback": "<string>" },
      "grammaticalRange": { "band": <number>, "feedback": "<string>" },
      "overallBand": <number>,
      "generalFeedback": "<string>"
    }
  ],
  "overallWritingBand": <number>,
  "summary": "<string>"
}`;

const SPEAKING_SYSTEM_PROMPT = `You are an expert IELTS examiner with extensive experience scoring IELTS Speaking tests. You must evaluate the candidate's speaking performance using the official IELTS Speaking Band Descriptors across four criteria:

1. **Fluency and Coherence**
   - Band 9: Speaks fluently with only rare repetition or self-correction; any hesitation is content-related rather than to find words or grammar; speaks coherently with fully appropriate cohesive features; topic development is fully coherent and appropriate.
   - Band 8: Speaks fluently with only occasional repetition or self-correction; hesitation is usually content-related; develops topics coherently and appropriately.
   - Band 7: Speaks at length without noticeable effort or loss of coherence; may demonstrate language-related hesitation at times; uses a range of connectives and discourse markers with some flexibility.
   - Band 6: Is willing to speak at length though may lose coherence at times due to occasional repetition, self-correction, or hesitation; uses a range of connectives and discourse markers but not always appropriately.
   - Band 5: Usually maintains flow of speech but uses repetition, self-correction and/or slow speech to keep going; may over-use certain connectives and discourse markers.
   - Band 4: Cannot respond without noticeable pauses and may speak slowly; may self-correct or re-start sentences repeatedly.

2. **Lexical Resource**
   - Band 9: Uses vocabulary with full flexibility and precision in all topics; uses idiomatic language naturally and accurately.
   - Band 8: Uses a wide vocabulary resource readily and flexibly; uses less common and idiomatic vocabulary skilfully with occasional inaccuracies; uses paraphrase effectively as required.
   - Band 7: Uses vocabulary resource flexibly to discuss a variety of topics; uses some less common and idiomatic vocabulary; shows some awareness of style and collocation with some inappropriate choices.
   - Band 6: Has a wide enough vocabulary to discuss topics at length; generally paraphrases successfully; may use some vocabulary inaccurately.
   - Band 5: Manages to talk about familiar and unfamiliar topics but uses vocabulary with limited flexibility; attempts to use paraphrase but with mixed success.

3. **Grammatical Range and Accuracy**
   - Band 9: Uses a full range of structures naturally and appropriately; produces consistently accurate structures apart from slips characteristic of native speaker speech.
   - Band 8: Uses a wide range of structures flexibly; produces a majority of error-free sentences with only very occasional inappropriacies or basic/non-systematic errors.
   - Band 7: Uses a range of complex structures with some flexibility; frequently produces error-free sentences though some grammatical mistakes persist.
   - Band 6: Uses a mix of simple and complex structures but with limited flexibility; may make frequent mistakes with complex structures though these rarely cause comprehension problems.
   - Band 5: Produces basic sentence forms with reasonable accuracy; uses a limited range of more complex structures but these usually contain errors.

4. **Pronunciation**
   - Band 9: Uses a full range of pronunciation features with precision and subtlety; sustains flexible use of features throughout; is effortless to understand.
   - Band 8: Uses a wide range of pronunciation features; sustains flexible use of features with only occasional lapses; is easy to understand throughout; L1 accent has minimal effect on intelligibility.
   - Band 7: Shows all the positive features of Band 6 and some, but not all, of the positive features of Band 8; generally easy to understand; some mispronunciations may occur.
   - Band 6: Uses a range of pronunciation features with mixed control; shows some effective use of features but this is not sustained; can generally be understood throughout though mispronunciation of individual words or sounds reduces clarity at times.
   - Band 5: Shows some effective use of pronunciation features but this is not sustained; may be difficult to understand at times; mispronunciation is frequent.

**Instructions:**
- Evaluate the speaking transcription provided for each part (Part 1, Part 2, Part 3).
- For each criterion, provide a band score (whole or half bands from 0 to 9).
- Note: Since this is a transcription, pronunciation assessment should be based on observable features such as word stress patterns, sentence rhythm indicators, and any noted pronunciation issues in the transcription.
- Provide the overall speaking band as the average of the four criteria, rounded to the nearest 0.5.
- Include specific, constructive feedback for each criterion referencing examples from the candidate's responses.

You MUST respond with valid JSON in the following format:
{
  "parts": [
    {
      "partNumber": 1,
      "fluencyCoherence": { "band": <number>, "feedback": "<string>" },
      "lexicalResource": { "band": <number>, "feedback": "<string>" },
      "grammaticalRange": { "band": <number>, "feedback": "<string>" },
      "pronunciation": { "band": <number>, "feedback": "<string>" },
      "partFeedback": "<string>"
    }
  ],
  "overallSpeakingBand": <number>,
  "fluencyCoherence": { "band": <number>, "feedback": "<string>" },
  "lexicalResource": { "band": <number>, "feedback": "<string>" },
  "grammaticalRange": { "band": <number>, "feedback": "<string>" },
  "pronunciation": { "band": <number>, "feedback": "<string>" },
  "summary": "<string>"
}`;

// ---------------------------------------------------------------------------
// AI scoring functions
// ---------------------------------------------------------------------------

/**
 * Score the writing section of an attempt using OpenAI GPT-4.
 * Fetches writing responses, constructs the prompt with task descriptions,
 * and parses the structured JSON response.
 */
export async function scoreWriting(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  // Get all writing sections for this test
  const writingSections = await sectionModel.findByTestIdAndType(attempt.testId, 'writing');
  if (writingSections.length === 0) {
    // No writing sections; nothing to score
    return;
  }

  // Build the user prompt with all writing tasks and responses
  const taskPrompts: string[] = [];

  for (const section of writingSections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);

    // Get the task description from the section
    const taskDesc = section.taskDescription || section.instructions || 'No task description provided.';
    const taskNum = section.taskNumber || section.sectionOrder;

    // Collect writing texts from responses
    const writingTexts = responses
      .filter((r: any) => r.writingText)
      .map((r: any) => r.writingText)
      .join('\n\n');

    if (!writingTexts) {
      taskPrompts.push(
        `## Writing Task ${taskNum}\n**Task:** ${taskDesc}\n**Candidate Response:** [No response submitted]\n`,
      );
    } else {
      const wordCount = writingTexts.split(/\s+/).filter(Boolean).length;
      taskPrompts.push(
        `## Writing Task ${taskNum}\n**Task:** ${taskDesc}\n**Minimum Words:** ${section.minWords || (taskNum === 1 ? 150 : 250)}\n**Candidate Response (${wordCount} words):**\n${writingTexts}\n`,
      );
    }
  }

  const userPrompt = `Please evaluate the following IELTS Writing submission:\n\n${taskPrompts.join('\n---\n\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: WRITING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Empty response from OpenAI for writing scoring');
      return;
    }

    const feedback = JSON.parse(content);
    const writingBand = feedback.overallWritingBand;

    // Update individual response scores with AI feedback
    for (const section of writingSections) {
      const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
      const taskNum = section.taskNumber || section.sectionOrder;
      const taskFeedback = feedback.tasks?.find((t: any) => t.taskNumber === taskNum);

      for (const resp of responses) {
        if (resp.writingText && taskFeedback) {
          await responseModel.updateScore(resp.id, {
            isCorrect: false, // Writing is not binary correct/incorrect
            score: taskFeedback.overallBand || 0,
            aiFeedback: taskFeedback,
          });
        }
      }
    }

    // Update the attempt with writing band and feedback
    await attemptModel.updateScores(attemptId, {
      writingBand: typeof writingBand === 'number' ? writingBand : 0,
      writingFeedback: feedback,
    });
  } catch (error) {
    console.error('Error scoring writing with AI:', error);
    throw error;
  }
}

/**
 * Score the speaking section of an attempt using OpenAI Whisper + GPT-4.
 * Fetches speaking audio URLs, transcribes them with Whisper,
 * then evaluates the transcription with GPT-4.
 */
export async function scoreSpeaking(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  // Get all speaking sections for this test
  const speakingSections = await sectionModel.findByTestIdAndType(attempt.testId, 'speaking');
  if (speakingSections.length === 0) {
    // No speaking sections; nothing to score
    return;
  }

  // Build transcript parts from all speaking responses
  const partTranscripts: string[] = [];

  for (const section of speakingSections) {
    const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
    const partNum = section.partNumber || section.sectionOrder;

    // Get prompts for context
    const prompts = section.speakingPrompts || {};
    const promptText = typeof prompts === 'string'
      ? prompts
      : JSON.stringify(prompts, null, 2);

    // Collect transcriptions from audio responses
    const transcriptions: string[] = [];

    for (const resp of responses) {
      if (resp.audioUrl) {
        try {
          // Fetch the audio file and transcribe with Whisper
          const audioResponse = await fetch(resp.audioUrl);
          const audioBlob = await audioResponse.blob();
          const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

          const transcription = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: audioFile,
            language: 'en',
          });

          transcriptions.push(transcription.text);
        } catch (err) {
          console.error(`Error transcribing audio for response ${resp.id}:`, err);
          // Use any existing answer data as fallback
          if (resp.answerData && typeof resp.answerData === 'string') {
            transcriptions.push(resp.answerData);
          }
        }
      } else if (resp.answerData && typeof resp.answerData === 'string') {
        // Text-based speaking response (possibly pre-transcribed)
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

  const userPrompt = `Please evaluate the following IELTS Speaking test transcription:\n\n${partTranscripts.join('\n---\n\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SPEAKING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('Empty response from OpenAI for speaking scoring');
      return;
    }

    const feedback = JSON.parse(content);
    const speakingBand = feedback.overallSpeakingBand;

    // Update individual response scores with AI feedback
    for (const section of speakingSections) {
      const responses = await responseModel.findByAttemptAndSection(attemptId, section.id);
      const partNum = section.partNumber || section.sectionOrder;
      const partFeedback = feedback.parts?.find((p: any) => p.partNumber === partNum);

      for (const resp of responses) {
        if ((resp.audioUrl || resp.answerData) && partFeedback) {
          await responseModel.updateScore(resp.id, {
            isCorrect: false, // Speaking is not binary correct/incorrect
            score: speakingBand || 0,
            aiFeedback: partFeedback,
          });
        }
      }
    }

    // Update the attempt with speaking band and feedback
    await attemptModel.updateScores(attemptId, {
      speakingBand: typeof speakingBand === 'number' ? speakingBand : 0,
      speakingFeedback: feedback,
    });
  } catch (error) {
    console.error('Error scoring speaking with AI:', error);
    throw error;
  }
}

/**
 * Finalize scoring after all sections have been scored.
 * Calculates the overall band score and marks the attempt as completed.
 */
export async function finalizeScoring(attemptId: string): Promise<void> {
  const attempt = await attemptModel.findById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Attempt not found');
  }

  // Get the latest scores (they may have been updated since we started)
  const latestAttempt = await attemptModel.findById(attemptId);
  if (!latestAttempt) {
    throw new NotFoundError('Attempt not found');
  }

  const listeningBand = Number(latestAttempt.listeningBand) || 0;
  const readingBand = Number(latestAttempt.readingBand) || 0;
  const writingBand = Number(latestAttempt.writingBand) || 0;
  const speakingBand = Number(latestAttempt.speakingBand) || 0;

  // Calculate overall band
  const overallBand = calculateOverallBand(listeningBand, readingBand, writingBand, speakingBand);

  // Update attempt with overall band
  await attemptModel.updateScores(attemptId, { overallBand });

  // Mark as completed
  await attemptModel.complete(attemptId);
}
