import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookStore } from '../stores/bookStore';
import { usePDFProcessor } from '../hooks/usePDFProcessor';
import { type Book } from '../types';

interface Props {
  onSelectBook: (book: Book) => void;
}

export const HomeScreen = ({ onSelectBook }: Props) => {
  const { books, isProcessing, processingProgress, processingStatus, removeBook } =
    useBookStore();
  const { pickAndProcess } = usePDFProcessor();

  const handleUpload = async () => {
    try {
      const book = await pickAndProcess();
      if (book) onSelectBook(book);
    } catch {
      Alert.alert('Error', 'Failed to process PDF. Please try again.');
    }
  };

  const handleDelete = (bookId: string) => {
    Alert.alert(
      'Delete Book',
      'Are you sure? This will remove all study progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeBook(bookId) },
      ]
    );
  };

  const renderBook = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => onSelectBook(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bookIcon}>
        <Text style={styles.bookEmoji}>📚</Text>
      </View>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookMeta}>
          {item.chapters.length} chapters
        </Text>

        {/* progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${item.totalProgress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{item.totalProgress}% complete</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>StudyAI</Text>
        <Text style={styles.subtitle}>Your AI-powered study companion</Text>
      </View>

      {/* processing overlay */}
      {isProcessing && (
        <View style={styles.processingCard}>
          <ActivityIndicator color="#818cf8" size="large" />
          <Text style={styles.processingStatus}>{processingStatus}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${processingProgress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{processingProgress}%</Text>
        </View>
      )}

      {/* book list */}
      {books.length === 0 && !isProcessing ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyTitle}>No books yet</Text>
          <Text style={styles.emptySubtitle}>
            Upload a PDF textbook and AI will generate{'\n'}
            a full study guide with exercises
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* upload button */}
      {!isProcessing && (
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
          <Text style={styles.uploadText}>+ Upload PDF</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  processingCard: {
    margin: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#818cf8',
  },
  processingStatus: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 24,
    gap: 12,
  },
  bookCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  bookIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookEmoji: {
    fontSize: 24,
  },
  bookInfo: {
    flex: 1,
    gap: 4,
  },
  bookTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  bookMeta: {
    color: '#6b7280',
    fontSize: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#2d2d44',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#818cf8',
    borderRadius: 99,
  },
  progressText: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  uploadBtn: {
    margin: 24,
    backgroundColor: '#818cf8',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});