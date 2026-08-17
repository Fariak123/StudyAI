import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  score: number;
  totalQuestions: number;
  chapterTitle: string;
  onRetry: () => void;
  onBack: () => void;
}

export const ResultScreen = ({
  score,
  totalQuestions,
  chapterTitle,
  onRetry,
  onBack,
}: Props) => {
  const percentage = score;
  const isPassing = percentage >= 60;

  const getEmoji = () => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 70) return '🎉';
    if (percentage >= 60) return '👍';
    return '📚';
  };

  const getMessage = () => {
    if (percentage >= 90) return 'Outstanding!';
    if (percentage >= 70) return 'Great job!';
    if (percentage >= 60) return 'Good effort!';
    return 'Keep studying!';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{getEmoji()}</Text>
        <Text style={styles.message}>{getMessage()}</Text>
        <Text style={styles.chapter} numberOfLines={2}>
          {chapterTitle}
        </Text>

        {/* score circle */}
        <View style={[
          styles.scoreCircle,
          isPassing ? styles.scoreCirclePassing : styles.scoreCircleFailing,
        ]}>
          <Text style={styles.scoreNumber}>{percentage}%</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>

        {/* weak area warning */}
        {!isPassing && (
          <View style={styles.weakWarning}>
            <Text style={styles.weakWarningText}>
              ⚠️ This chapter has been marked as a weak area — it will be flagged for review
            </Text>
          </View>
        )}

        {/* actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
          >
            <Text style={styles.retryBtnText}>🔄 Retry Exercises</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
          >
            <Text style={styles.backBtnText}>← Back to Chapter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  emoji: {
    fontSize: 72,
  },
  message: {
    color: 'white',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chapter: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    gap: 4,
  },
  scoreCirclePassing: {
    borderColor: '#22c55e',
    backgroundColor: '#052e16',
  },
  scoreCircleFailing: {
    borderColor: '#818cf8',
    backgroundColor: '#1a1a2e',
  },
  scoreNumber: {
    color: 'white',
    fontSize: 36,
    fontWeight: '800',
  },
  scoreLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  weakWarning: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  weakWarningText: {
    color: '#f59e0b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  retryBtn: {
    backgroundColor: '#818cf8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d2d44',
  },
  backBtnText: {
    color: '#818cf8',
    fontSize: 15,
    fontWeight: '600',
  },
});