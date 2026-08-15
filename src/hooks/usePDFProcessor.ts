import * as DocumentPicker from 'expo-document-picker';
// import * as FileSystem from 'expo-file-system';
import { useBookStore } from '../stores/bookStore';
import { type Book, type Chapter } from '../types';
import { File } from 'expo-file-system/next';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.anthropicApiKey ?? '';

const SYSTEM_PROMPT = `You are an expert educator extracting knowledge from a textbook.
Your job is to create a structured, detailed study guide.

CRITICAL RULES:
- Extract ALL important concepts — do not oversimplify or skip nuance
- Each concept needs: clear definition, why it matters, real world example
- Keep full technical depth — do not dumb down the content
- Summary must be meaty and informative — minimum 150 words per chapter
- Generate minimum 5 exercises per chapter
- Exercises must test DEEP UNDERSTANDING not just memorisation
- Every exercise needs a detailed explanation of the correct answer
- Vary exercise types: mix mcq, true_false, and open questions
- If a concept has nuance or exceptions, preserve them

Return ONLY valid JSON, no markdown, no backticks, no explanation.`;

const chunkText = (text: string, chunkSize: number = 12000): string[] => {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return chunks;
};

const callClaude = async (prompt: string): Promise<string> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
};

const parseChapter = (raw: string, index: number): Chapter => {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      id: `chapter-${index}-${Date.now()}`,
      title: parsed.title ?? `Chapter ${index + 1}`,
      summary: parsed.summary ?? '',
      concepts: parsed.concepts ?? [],
      keyPoints: parsed.keyPoints ?? [],
      exercises: (parsed.exercises ?? []).map((ex: any, i: number) => ({
        ...ex,
        id: `ex-${index}-${i}-${Date.now()}`,
      })),
      progress: 0,
      weakArea: false,
    };
  } catch {
    return {
      id: `chapter-${index}-${Date.now()}`,
      title: `Chapter ${index + 1}`,
      summary: 'Could not parse this section.',
      concepts: [],
      keyPoints: [],
      exercises: [],
      progress: 0,
      weakArea: false,
    };
  }
};

export const usePDFProcessor = () => {
  const {
    addBook,
    setProcessing,
    setProcessingProgress,
    setProcessingStatus,
  } = useBookStore();

  const pickAndProcess = async () => {
    try {
      // 1 — pick PDF
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setProcessing(true);
      setProcessingProgress(5);
      setProcessingStatus('Reading PDF...');

      // 2 — read file as base64
      const fileObj = new File(file.uri);
      const base64 = await fileObj.bytes()
        .then(bytes => {
          let binary = '';
          bytes.forEach(b => binary += String.fromCharCode(b));
          return btoa(binary);
        });

      setProcessingProgress(15);
      setProcessingStatus('Extracting text...');

      // 3 — send to Claude as document
      const extractPrompt = `This is a PDF textbook. First, identify how many logical chapters or major sections it contains. Then extract and structure the content.

Return a JSON array of chapters, each with this exact structure:
{
  "title": "Chapter title",
  "summary": "Detailed summary minimum 150 words",
  "concepts": [
    {
      "title": "Concept name",
      "definition": "Clear detailed definition",
      "whyItMatters": "Why this concept is important",
      "example": "Real world example"
    }
  ],
  "keyPoints": ["Key point 1", "Key point 2"],
  "exercises": [
    {
      "question": "Question text",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct answer",
      "explanation": "Detailed explanation of why this is correct"
    },
    {
      "question": "Question text",
      "type": "true_false",
      "answer": "true or false",
      "explanation": "Detailed explanation"
    },
    {
      "question": "Question text",
      "type": "open",
      "answer": "Model answer",
      "explanation": "What a good answer should cover"
    }
  ]
}`;

      setProcessingProgress(25);
      setProcessingStatus('Analysing content with AI...');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: extractPrompt,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const rawText = data.content?.[0]?.text ?? '[]';
      console.log('Claude response:', rawText);
      console.log('API response status:', data);

      setProcessingProgress(75);
      setProcessingStatus('Building your study guide...');

      // 4 — parse chapters
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      let rawChapters: any[] = [];

      try {
        rawChapters = JSON.parse(cleaned);
      } catch {
        rawChapters = [{ title: 'Full Content', summary: rawText }];
      }

      const chapters: Chapter[] = rawChapters.map((ch: any, i: number) =>
        parseChapter(JSON.stringify(ch), i)
      );

      setProcessingProgress(90);
      setProcessingStatus('Saving your book...');

      // 5 — save book
      const book: Book = {
        id: `book-${Date.now()}`,
        title: file.name.replace('.pdf', ''),
        fileName: file.name,
        chapters,
        createdAt: new Date().toISOString(),
        totalProgress: 0,
      };

      addBook(book);

      setProcessingProgress(100);
      setProcessingStatus('Done!');

      setTimeout(() => {
        setProcessing(false);
        setProcessingProgress(0);
        setProcessingStatus('');
      }, 1000);

      return book;

    } catch (error) {
      setProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
      console.error('PDF processing error:', error);
      throw error;
    }
  };

  return { pickAndProcess };
};