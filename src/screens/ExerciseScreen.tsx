import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Chapter, type Exercise } from '../types';
import { useBookStore } from '../stores/bookStore';

interface Props {
  chapter: Chapter;
  bookId: string;
  onBack: () => void;
  onFinish: (score: number) => void;
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

export const ExerciseScreen = ({ chapter, bookId, onBack, onFinish }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [openAnswer, setOpenAnswer] = useState('');

  const { updateChapterProgress, markWeakArea } = useBookStore();

  const exercise = chapter.exercises[currentIndex];
  const isLast = currentIndex === chapter.exercises.length - 1;
  const progress = ((currentIndex) / chapter.exercises.length) * 100;

  const handleAnswer = (answer: string) => {
    if (answerState !== 'unanswered') return;

    setSelectedOption(answer);
    const correct = answer.toLowerCase().trim() ===
      exercise.answer.toLowerCase().trim();

    if (correct) {
      setScore((s) => s + 1);
      setAnswerState('correct');
    } else {
      setAnswerState('incorrect');
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLast) {
      const finalScore = Math.round(
        ((score + (answerState === 'correct' ? 1 : 0)) /
          chapter.exercises.length) * 100
      );

      updateChapterProgress(bookId, chapter.id, finalScore);
      markWeakArea(bookId, chapter.id, finalScore < 60);
      onFinish(finalScore);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setAnswerState('unanswered');
    setShowExplanation(false);
    setOpenAnswer('');
  };

  const getOptionStyle = (option: string) => {
    if (answerState === 'unanswered') return styles.option;
    if (option === exercise.answer) return [styles.option, styles.optionCorrect];
    if (option === selectedOption) return [styles.option, styles.optionIncorrect];
    return [styles.option, styles.optionDimmed];
  };

  const getOptionTextStyle = (option: string) => {
    if (answerState === 'unanswered') return styles.optionText;
    if (option === exercise.answer) return [styles.optionText, styles.optionTextCorrect];
    if (option === selectedOption) return [styles.optionText, styles.optionTextIncorrect];
    return [styles.optionText, styles.optionTextDimmed];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.counter}>
            {currentIndex + 1} / {chapter.exercises.length}
          </Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        {/* progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* question type badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {exercise.type === 'mcq' && '🔵 Multiple Choice'}
            {exercise.type === 'true_false' && '🟡 True or False'}
            {exercise.type === 'open' && '🟢 Open Question'}
          </Text>
        </View>

        {/* question */}
        <Text style={styles.question}>{exercise.question}</Text>

        {/* MCQ options */}
        {exercise.type === 'mcq' && exercise.options && (
          <View style={styles.options}>
            {exercise.options.map((option, i) => (
              <TouchableOpacity
                key={i}
                style={getOptionStyle(option)}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.7}
                disabled={answerState !== 'unanswered'}
              >
                <Text style={styles.optionLetter}>
                  {['A', 'B', 'C', 'D'][i]}
                </Text>
                <Text style={getOptionTextStyle(option)}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* True/False */}
        {exercise.type === 'true_false' && (
          <View style={styles.tfOptions}>
            {['true', 'false'].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.tfOption,
                  answerState !== 'unanswered' && val === exercise.answer.toLowerCase()
                    && styles.optionCorrect,
                  answerState !== 'unanswered' && val === selectedOption
                    && val !== exercise.answer.toLowerCase()
                    && styles.optionIncorrect,
                ]}
                onPress={() => handleAnswer(val)}
                activeOpacity={0.7}
                disabled={answerState !== 'unanswered'}
              >
                <Text style={styles.tfText}>
                  {val === 'true' ? '✓ True' : '✗ False'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Open question */}
        {exercise.type === 'open' && (
          <View style={styles.openSection}>
            {answerState === 'unanswered' ? (
              <TouchableOpacity
                style={styles.revealBtn}
                onPress={() => handleAnswer('open_revealed')}
              >
                <Text style={styles.revealBtnText}>
                  Reveal Model Answer
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* explanation */}
        {showExplanation && (
          <View style={[
            styles.explanationCard,
            answerState === 'correct'
              ? styles.explanationCorrect
              : styles.explanationIncorrect,
          ]}>
            <Text style={styles.explanationTitle}>
              {exercise.type === 'open'
                ? '📝 Model Answer'
                : answerState === 'correct'
                ? '✅ Correct!'
                : `❌ Incorrect — Answer: ${exercise.answer}`}
            </Text>
            <Text style={styles.explanationText}>{exercise.explanation}</Text>
            {exercise.type !== 'open' && (
              <Text style={styles.modelAnswer}>
                Correct answer: {exercise.answer}
              </Text>
            )}
          </View>
        )}

        {/* next button */}
        {answerState !== 'unanswered' && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {isLast ? 'Finish & See Results →' : 'Next Question →'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    gap: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreText: {
    color: '#818cf8',
    fontSize: 14,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  typeBadgeText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  question: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 28,
  },
  options: {
    gap: 10,
  },
  option: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#2d2d44',
  },
  optionCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#052e16',
  },
  optionIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#2d0a0a',
  },
  optionDimmed: {
    opacity: 0.4,
  },
  optionLetter: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '800',
    width: 20,
  },
  optionText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  optionTextCorrect: {
    color: '#22c55e',
  },
  optionTextIncorrect: {
    color: '#ef4444',
  },
  optionTextDimmed: {
    color: '#6b7280',
  },
  tfOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  tfOption: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2d2d44',
  },
  tfText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  openSection: {
    gap: 12,
  },
  revealBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#818cf8',
  },
  revealBtnText: {
    color: '#818cf8',
    fontSize: 15,
    fontWeight: '700',
  },
  explanationCard: {
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 1.5,
  },
  explanationCorrect: {
    backgroundColor: '#052e16',
    borderColor: '#22c55e',
  },
  explanationIncorrect: {
    backgroundColor: '#1a0a2e',
    borderColor: '#818cf8',
  },
  explanationTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  explanationText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 22,
  },
  modelAnswer: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  nextBtn: {
    backgroundColor: '#818cf8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});