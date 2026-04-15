// Worker processing logic (MCQ scoring, Essay plagiarism, Fraud detection)

import type { Task, TaskResult } from './types';
import { CORPUS_PHRASES } from './data-generator';
import { jaccardSimilarity } from './utils';

/**
 * MCQ Scoring Algorithm
 * Supports single and multi-answer questions with negative marking
 * Formula: score = weight × (S/C - α × W/(total_options - C))
 */
export function processMcqTask(task: Task): TaskResult {
  const answers = task.data.answers as string[];
  const correct = task.data.correctAnswers as string[];
  const processingTime = task.data._processingTimeMs as number || 0;

  if (!correct) {
    return { score: 0, processingTimeMs: processingTime, workerId: '' };
  }

  // Single-answer scoring: direct comparison
  let correctCount = 0;
  let wrongCount = 0;
  answers.forEach((a, i) => {
    if (i < correct.length) {
      if (a === correct[i]) correctCount++;
      else wrongCount++;
    }
  });

  // Apply scoring formula: score = (S/C - α × W/(options-C))
  const totalCorrect = correct.length;
  const alpha = 0.25; // negative marking coefficient
  const totalOptions = 4; // A, B, C, D
  const rawScore = (correctCount / totalCorrect) - alpha * (wrongCount / Math.max(totalOptions - 1, 1));
  const normalizedScore = Math.max(0, rawScore) * 10; // Scale to 10

  return {
    score: Math.round(normalizedScore * 100) / 100,
    processingTimeMs: processingTime,
    workerId: '',
  };
}

/**
 * Essay Plagiarism Detection
 * Uses Jaccard Similarity to compare text chunks against a reference corpus
 */
export function processEssayTask(task: Task): TaskResult {
  const chunk = (task.data.chunkContent as string).toLowerCase();
  const processingTime = task.data._processingTimeMs as number || 0;

  // Preprocess: normalize, remove special chars
  const normalized = chunk.replace(/[^a-z0-9\s]/g, '').trim();

  let maxSim = 0;
  let matched = '';
  for (const phrase of CORPUS_PHRASES) {
    const sim = jaccardSimilarity(normalized, phrase);
    if (sim > maxSim) {
      maxSim = sim;
      matched = phrase;
    }
  }

  return {
    plagiarismScore: Math.round(maxSim * 1000) / 1000,
    matchedSource: maxSim > 0.15 ? matched : undefined,
    processingTimeMs: processingTime,
    workerId: '',
  };
}

/**
 * Fraud Detection
 * Checks for suspicious answer patterns (e.g., identical sequences, timing anomalies)
 */
export function processFraudTask(task: Task): TaskResult {
  const processingTime = task.data._processingTimeMs as number || 0;

  // Simulated fraud detection heuristics
  const isFraud = Math.random() < 0.08;
  const fraudTypes = [
    'Mẫu câu trả lời giống hệt sinh viên khác',
    'Thời gian trả lời bất thường (quá nhanh)',
    'Đáp án thay đổi nhiều lần vào phút cuối',
    'IP trùng lặp với sinh viên khác',
  ];

  return {
    fraudFlag: isFraud,
    fraudDetail: isFraud ? fraudTypes[Math.floor(Math.random() * fraudTypes.length)] : undefined,
    processingTimeMs: processingTime,
    workerId: '',
  };
}
