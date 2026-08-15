import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Book, type Chapter } from '../types';

interface BookStore {
  books: Book[];
  currentBook: Book | null;
  currentChapter: Chapter | null;
  isProcessing: boolean;
  processingProgress: number;
  processingStatus: string;

  // actions
  addBook: (book: Book) => void;
  removeBook: (bookId: string) => void;
  setCurrentBook: (book: Book | null) => void;
  setCurrentChapter: (chapter: Chapter | null) => void;
  setProcessing: (val: boolean) => void;
  setProcessingProgress: (val: number) => void;
  setProcessingStatus: (val: string) => void;
  updateChapterProgress: (bookId: string, chapterId: string, progress: number) => void;
  markWeakArea: (bookId: string, chapterId: string, weak: boolean) => void;
}

export const useBookStore = create<BookStore>()(
  persist(
    (set) => ({
      books: [],
      currentBook: null,
      currentChapter: null,
      isProcessing: false,
      processingProgress: 0,
      processingStatus: '',

      addBook: (book) =>
        set((state) => ({ books: [...state.books, book] })),

      removeBook: (bookId) =>
        set((state) => ({
          books: state.books.filter((b) => b.id !== bookId),
          currentBook: state.currentBook?.id === bookId ? null : state.currentBook,
        })),

      setCurrentBook: (book) => set({ currentBook: book }),
      setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
      setProcessing: (val) => set({ isProcessing: val }),
      setProcessingProgress: (val) => set({ processingProgress: val }),
      setProcessingStatus: (val) => set({ processingStatus: val }),

      updateChapterProgress: (bookId, chapterId, progress) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.id !== bookId ? b : {
              ...b,
              totalProgress: Math.round(
                b.chapters.reduce((acc, ch) =>
                  acc + (ch.id === chapterId ? progress : ch.progress), 0
                ) / b.chapters.length
              ),
              chapters: b.chapters.map((ch) =>
                ch.id === chapterId ? { ...ch, progress } : ch
              ),
            }
          ),
        })),

      markWeakArea: (bookId, chapterId, weak) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.id !== bookId ? b : {
              ...b,
              chapters: b.chapters.map((ch) =>
                ch.id === chapterId ? { ...ch, weakArea: weak } : ch
              ),
            }
          ),
        })),
    }),
    {
      name: 'book-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);