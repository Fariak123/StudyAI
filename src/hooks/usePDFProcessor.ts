import * as DocumentPicker from 'expo-document-picker';
import { useBookStore } from '../stores/bookStore';
import { type Book, type Chapter } from '../types';
import { File } from 'expo-file-system/next';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { readAsStringAsync } from 'expo-file-system/legacy';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl ?? '';

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

      // 1 — read file as blob and upload to storage
      const base64 = await readAsStringAsync(file.uri, {
        encoding: 'base64',
      });
      // console.log('Base64 length:', base64.length);

      // convert base64 to Uint8Array for upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // console.log('Bytes length:', bytes.length);

      const fileName = `${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, bytes, {
          contentType: 'application/pdf',
          upsert: false,
        });

      // console.log('Upload error:', uploadError);
      // console.log('Upload data:', uploadData);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // old code
      // const fileUri = file.uri;
      // const fileName = `${Date.now()}_${file.name}`;

      // const response = await fetch(fileUri);
      // const blob = await response.blob();

      // const { data: uploadData, error: uploadError } = await supabase.storage
      //   .from('pdfs')
      //   .upload(fileName, blob, {
      //     contentType: 'application/pdf',
      //   });

      // if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      setProcessingProgress(20);
      setProcessingStatus('Analysing with AI...');

      // 2 — get signed URL so edge function can download it
      const { data: signedData } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(fileName, 300); // 5 min expiry

      if (!signedData?.signedUrl) throw new Error('Could not get signed URL');

      // 3 — call edge function with URL instead of base64
      const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl ?? '';

      // console.log('Signed URL:', signedData.signedUrl);
      // console.log('Calling pdf-processor...');

      const processorResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/pdf-processor`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfUrl: signedData.signedUrl,
            fileName: file.name,
          }),
        }
      );

      const data = await processorResponse.json();
      console.log('Response:', JSON.stringify(data, null, 2));

      // 4 — clean up storage after processing
      await supabase.storage.from('pdfs').remove([fileName]);

      const rawChapters = data.chapters ?? [];

      setProcessingProgress(75);
      setProcessingStatus(
        data.totalChunks > 1
        ? `Processed ${data.totalChunks} sections. Building study guide...`
        : 'Building your study guide...'
      );

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