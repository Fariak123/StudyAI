const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert educator extracting knowledge from a textbook. Be thorough but concise. Extract maximum knowledge in minimum tokens.

CRITICAL RULES:
- Extract ALL important concepts — do not oversimplify or skip nuance
- Each concept needs: clear definition, why it matters, real world example
- Keep full technical depth — do not dumb down the content
- Summary must be meaty and informative — minimum 150 words per chapter
- Generate minimum 5 exercises per chapter
- Exercises must test DEEP UNDERSTANDING not just memorisation
- Every exercise needs a detailed explanation of the correct answer
- Vary exercise types: mix mcq, true_false, and open questions

Return ONLY valid JSON array, no markdown, no backticks, no explanation.`;

const CHUNK_PROMPT = (start: number, end: number) => 
  `This is a PDF textbook. Focus ONLY on pages ${start} to ${end}.
Extract and structure content from those pages.

Return a JSON array:
[{
  "title": "Chapter/Section title",
  "summary": "Detailed summary minimum 150 words",
  "concepts": [{
    "title": "Concept name",
    "definition": "Clear detailed definition",
    "whyItMatters": "Why important",
    "example": "Real world example"
  }],
  "keyPoints": ["Key point 1"],
  "exercises": [
    {
      "question": "Question",
      "type": "mcq",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct answer",
      "explanation": "Detailed explanation"
    },
    {
      "question": "Question",
      "type": "true_false",
      "answer": "true",
      "explanation": "Detailed explanation"
    },
    {
      "question": "Question",
      "type": "open",
      "answer": "Model answer",
      "explanation": "What a good answer covers"
    }
  ]
}]`;

const parseChapters = (raw: string, offset: number): any[] => {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((ch: any, i: number) => ({
      ...ch,
      id: `chapter-${offset + i}-${Date.now()}`,
      progress: 0,
      weakArea: false,
      concepts: ch.concepts ?? [],
      keyPoints: ch.keyPoints ?? [],
      exercises: (ch.exercises ?? []).map((ex: any, j: number) => ({
        ...ex,
        id: `ex-${offset + i}-${j}-${Date.now()}`,
      })),
    }));
  } catch {
    return [];
  }
};

const callClaude = async (
  apiKey: string,
  pdfBase64: string,
  prompt: string,
  maxTokens: number,
) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  const data = await response.json();
  // console.log('Claude API status:', response.status);
  // console.log('Claude API response:', JSON.stringify(data).substring(0, 300));
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text ?? '[]';
};

const CHUNK_SIZE = 50;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // console.log('Received body keys:', Object.keys(body));
    // console.log('pdfUrl:', body.pdfUrl);
    // console.log('fileName:', body.fileName);
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
    const supabaseUrl = Deno.env.get('SB_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

    const { pdfUrl, fileName } = body;
    // extract file path from the signed URL
    const urlObj = new URL(pdfUrl);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/sign\/(.+?)(\?|$)/);
    const filePath = pathMatch?.[1] ?? '';

    // console.log('File path:', filePath);

    // download PDF from signed URL
    const pdfResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/authenticated/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      }
    );

    // console.log('Download status:', pdfResponse.status);
    // console.log('Content-Type:', pdfResponse.headers.get('content-type'));
    // console.log('Content-Length:', pdfResponse.headers.get('content-length'));

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      throw new Error(`Download failed: ${pdfResponse.status} — ${errText}`);
    }

    const responseText = await pdfResponse.clone().text();
    // console.log('Response text length:', responseText.length);
    // console.log('Response text preview:', responseText.substring(0, 100));

    const pdfBuffer = await pdfResponse.arrayBuffer();
    // console.log('Buffer byte length:', pdfBuffer.byteLength);

    if (pdfBuffer.byteLength === 0) {
      throw new Error('Downloaded PDF is empty');
    }

    const pdfBytes = new Uint8Array(pdfBuffer);

    // convert to base64 — chunked to avoid stack overflow on large files
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const pdfBase64 = btoa(binary);
    // console.log('Base64 length:', pdfBase64.length);

    if (!pdfBase64 || pdfBase64.length < 100) {
      throw new Error(`PDF base64 conversion failed — length: ${pdfBase64.length}`);
    }

    // console.log(`Base64 length: ${pdfBase64.length}`);
    // console.log(`First 50 chars: ${pdfBase64.substring(0, 50)}`);

    // estimate pages
    const fileSizeBytes = pdfBytes.length;
    // const estimatedPages = Math.ceil(fileSizeBytes / 51200);

    const fileSizeKB = fileSizeBytes/ 1024;
    // console.log(`File size: ${fileSizeKB}KB`);

    // rough estimate: assume 5KB per page for text PDFs, 50KB for image-heavy
    const estimatedPages = fileSizeKB < 500 
      ? Math.ceil(fileSizeKB / 5)      // text PDF
      : Math.ceil(fileSizeKB / 50);    // image PDF

    // console.log(`File: ${fileName}, Size: ${fileSizeBytes} bytes, Est pages: ${estimatedPages}`);

    const allChapters: any[] = [];

    if (estimatedPages <= CHUNK_SIZE) {
      // small PDF — process all at once
      const prompt = CHUNK_PROMPT(1, estimatedPages);
      const raw = await callClaude(apiKey, pdfBase64, prompt, 8000);
      // console.log('Claude raw response length:', raw.length);
      // console.log('Claude raw preview:', raw.substring(0, 200));
      const chapters = parseChapters(raw, 0);
      // console.log('Parsed chapters count:', chapters.length);
      allChapters.push(...chapters);
    } else {
      // for large docs, make multiple passes with different focus areas
      const numPasses = estimatedPages <= 50 ? 1 : Math.ceil(estimatedPages / 50);

      for (let i = 0; i < numPasses; i++) {
        const startPage = i * 50 + 1;
        const endPage = Math.min((i + 1) * 50, estimatedPages);
        
        const prompt = numPasses === 1 
          ? CHUNK_PROMPT(1, estimatedPages)
          : CHUNK_PROMPT(startPage, endPage);
          
        const raw = await callClaude(apiKey, pdfBase64, prompt, 3000);
        const chapters = parseChapters(raw, allChapters.length);
        allChapters.push(...chapters);
      }
    }

    return new Response(
      JSON.stringify({
        chapters: allChapters,
        totalChunks: Math.ceil(estimatedPages / CHUNK_SIZE),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: String(error), chapters: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});