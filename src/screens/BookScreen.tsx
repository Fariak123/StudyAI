import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Book, type Chapter } from '../types';

interface Props {
  book: Book;
  onBack: () => void;
  onSelectChapter?: (chapter: Chapter) => void;
}

export const BookScreen = ({ book, onBack, onSelectChapter }: Props) => {
  const weakChapters = book.chapters.filter((c) => c.weakArea);

  const renderChapter = ({ item, index }: { item: Chapter; index: number }) => (
    <TouchableOpacity
      style={styles.chapterCard}
      onPress={() => onSelectChapter?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.chapterNumber}>
        <Text style={styles.chapterNumberText}>{index + 1}</Text>
      </View>

      <View style={styles.chapterInfo}>
        <View style={styles.chapterTitleRow}>
          <Text style={styles.chapterTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.weakArea && (
            <Text style={styles.weakBadge}>⚠️ Weak</Text>
          )}
        </View>

        <Text style={styles.chapterMeta}>
          {item.concepts.length} concepts · {item.exercises.length} exercises
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${item.progress}%` }]}
          />
        </View>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>

        {/* overall progress */}
        <View style={styles.overallProgress}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={styles.progressValue}>{book.totalProgress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${book.totalProgress}%` }]}
            />
          </View>
        </View>

        {/* stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{book.chapters.length}</Text>
            <Text style={styles.statLabel}>Chapters</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {book.chapters.reduce((acc, c) => acc + c.exercises.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{weakChapters.length}</Text>
            <Text style={styles.statLabel}>Weak Areas</Text>
          </View>
        </View>
      </View>

      {/* chapter list */}
      <FlatList
        data={book.chapters}
        keyExtractor={(item) => item.id}
        renderItem={renderChapter}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Chapters</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No chapters found</Text>
          </View>
        }
      />
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
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
    gap: 12,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  overallProgress: {
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  progressValue: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#2d2d44',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#818cf8',
    borderRadius: 99,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2d2d44',
  },
  sectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  list: {
    padding: 24,
    gap: 10,
  },
  chapterCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  chapterNumber: {
    width: 36,
    height: 36,
    backgroundColor: '#2d2d44',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '800',
  },
  chapterInfo: {
    flex: 1,
    gap: 4,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  weakBadge: {
    fontSize: 11,
    color: '#f59e0b',
  },
  chapterMeta: {
    color: '#6b7280',
    fontSize: 12,
  },
  arrow: {
    color: '#6b7280',
    fontSize: 20,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
});