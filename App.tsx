import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { type Book } from './src/types';
import { BookScreen } from './src/screens/BookScreen';

export default function App() {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);

  return (
    <SafeAreaProvider>
      {currentBook ? (
        <BookScreen
          book={currentBook}
          onBack={() => setCurrentBook(null)}
        />
      ) : (
        <HomeScreen onSelectBook={setCurrentBook} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
});