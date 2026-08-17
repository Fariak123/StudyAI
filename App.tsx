import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { BookScreen } from './src/screens/BookScreen';
import { ChapterScreen } from './src/screens/ChapterScreen';
import { ExerciseScreen } from './src/screens/ExerciseScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { type Book, type Chapter } from './src/types';

type Screen = 'home' | 'book' | 'chapter' | 'exercise' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [lastScore, setLastScore] = useState(0);

  return (
    <SafeAreaProvider>
      {screen === 'home' && (
        <HomeScreen
          onSelectBook={(book) => {
            setCurrentBook(book);
            setScreen('book');
          }}
        />
      )}

      {screen === 'book' && currentBook && (
        <BookScreen
          book={currentBook}
          onBack={() => setScreen('home')}
          onSelectChapter={(chapter) => {
            setCurrentChapter(chapter);
            setScreen('chapter');
          }}
        />
      )}

      {screen === 'chapter' && currentChapter && (
        <ChapterScreen
          chapter={currentChapter}
          onBack={() => setScreen('book')}
          onStartExercises={() => setScreen('exercise')}
        />
      )}

      {screen === 'exercise' && currentChapter && currentBook && (
        <ExerciseScreen
          chapter={currentChapter}
          bookId={currentBook.id}
          onBack={() => setScreen('chapter')}
          onFinish={(score) => {
            setLastScore(score);
            setScreen('result');
          }}
        />
      )}

      {screen === 'result' && currentChapter && (
        <ResultScreen
          score={lastScore}
          totalQuestions={currentChapter.exercises.length}
          chapterTitle={currentChapter.title}
          onRetry={() => setScreen('exercise')}
          onBack={() => setScreen('chapter')}
        />
      )}
    </SafeAreaProvider>
  );
}