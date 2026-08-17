import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Chapter } from '../types';

interface Props {
  chapter: Chapter;
  onBack: () => void;
  onStartExercises: () => void;
}

type Tab = 'lecture' | 'exercises';

export const ChapterScreen = ({ chapter, onBack, onStartExercises }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>('lecture');

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>
          {chapter.title}
        </Text>

        {/* tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'lecture' && styles.tabActive]}
            onPress={() => setActiveTab('lecture')}
          >
            <Text style={[styles.tabText, activeTab === 'lecture' && styles.tabTextActive]}>
              📖 Lecture
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'exercises' && styles.tabActive]}
            onPress={() => setActiveTab('exercises')}
          >
            <Text style={[styles.tabText, activeTab === 'exercises' && styles.tabTextActive]}>
              ✏️ Exercises ({chapter.exercises.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'lecture' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SUMMARY</Text>
            <Text style={styles.summaryText}>{chapter.summary}</Text>
          </View>

          {/* key points */}
          {chapter.keyPoints.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>KEY POINTS</Text>
              {chapter.keyPoints.map((point, i) => (
                <View key={i} style={styles.keyPointRow}>
                  <Text style={styles.keyPointDot}>•</Text>
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* concepts */}
          {chapter.concepts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONCEPTS</Text>
              {chapter.concepts.map((concept, i) => (
                <View key={i} style={styles.conceptCard}>
                  <Text style={styles.conceptTitle}>{concept.title}</Text>

                  <View style={styles.conceptBlock}>
                    <Text style={styles.conceptBlockLabel}>Definition</Text>
                    <Text style={styles.conceptBlockText}>{concept.definition}</Text>
                  </View>

                  <View style={styles.conceptBlock}>
                    <Text style={styles.conceptBlockLabel}>Why it matters</Text>
                    <Text style={styles.conceptBlockText}>{concept.whyItMatters}</Text>
                  </View>

                  <View style={styles.conceptBlock}>
                    <Text style={styles.conceptBlockLabel}>Example</Text>
                    <Text style={styles.conceptBlockText}>{concept.example}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* start exercises button */}
          <TouchableOpacity
            style={styles.exercisesBtn}
            onPress={onStartExercises}
          >
            <Text style={styles.exercisesBtnText}>
              Start Exercises ({chapter.exercises.length}) →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.exercisesHint}>
            Tap "Start Exercises" to begin the quiz mode
          </Text>
          {chapter.exercises.map((ex, i) => (
            <View key={ex.id} style={styles.exercisePreview}>
              <Text style={styles.exerciseNumber}>Q{i + 1}</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseQuestion} numberOfLines={2}>
                  {ex.question}
                </Text>
                <Text style={styles.exerciseType}>{ex.type.toUpperCase()}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.exercisesBtn}
            onPress={onStartExercises}
          >
            <Text style={styles.exercisesBtnText}>
              Start Exercises ({chapter.exercises.length}) →
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 0,
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
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#818cf8',
  },
  tabText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#818cf8',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  summaryText: {
    color: '#d1d5db',
    fontSize: 15,
    lineHeight: 24,
  },
  keyPointRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyPointDot: {
    color: '#818cf8',
    fontSize: 15,
    marginTop: 2,
  },
  keyPointText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  conceptCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  conceptTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  conceptBlock: {
    gap: 4,
  },
  conceptBlockLabel: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  conceptBlockText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 22,
  },
  exercisesBtn: {
    backgroundColor: '#818cf8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  exercisesBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  exercisesHint: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  exercisePreview: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  exerciseNumber: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '800',
    width: 28,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseQuestion: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseType: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});