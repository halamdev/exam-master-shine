// Fake data generators for exam submissions

import type { ExamType, Submission } from './types';
import { genId } from './utils';

const STUDENT_NAMES = [
  'Nguyễn Văn', 'Trần Thị', 'Lê Hoàng', 'Phạm Minh', 'Hoàng Đức',
  'Vũ Thị', 'Đặng Quốc', 'Bùi Thanh', 'Đỗ Hải', 'Ngô Phương',
  'Đinh Anh', 'Lý Quang', 'Hồ Nhật', 'Dương Thị', 'Mai Xuân',
];

export const CORPUS_PHRASES = [
  "machine learning algorithms are fundamental",
  "the quick brown fox jumps over the lazy dog",
  "software architecture patterns provide solutions",
  "database normalization reduces redundancy",
  "object oriented programming encapsulates data",
  "distributed systems require fault tolerance",
  "cloud computing enables scalable infrastructure",
  "neural networks learn from training data",
  "agile methodology promotes iterative development",
  "microservices architecture decomposes applications",
];

/**
 * Generate fixed correct answers based on seed (deterministic)
 * Same correct answers will always be generated for same numQuestions
 */
function getFixedCorrectAnswers(numQuestions: number): string[] {
  const options = ['A', 'B', 'C', 'D'];
  const answers: string[] = [];
  for (let i = 0; i < numQuestions; i++) {
    // Seed-based: use index modulo to generate deterministic answers
    answers.push(options[i % 4]);
  }
  return answers;
}

/**
 * Generate student answers: mix of correct (60-70%) and random (30-40%)
 * This simulates realistic exam performance
 */
export function generateRandomAnswers(
  numQuestions: number,
  correctAnswers: string[] | undefined,
  correctnessRate: number = 0.65 // 65% of answers are correct
): string[] {
  const options = ['A', 'B', 'C', 'D'];
  const answers: string[] = [];
  
  if (!correctAnswers) {
    // Fallback: 100% random if no correct answers provided
    return Array.from({ length: numQuestions }, () => options[Math.floor(Math.random() * 4)]);
  }

  for (let i = 0; i < numQuestions; i++) {
    if (Math.random() < correctnessRate) {
      // Match correct answer
      answers.push(correctAnswers[i] || options[Math.floor(Math.random() * 4)]);
    } else {
      // Wrong answer: pick different from correct
      const wrongOptions = options.filter(opt => opt !== correctAnswers[i]);
      answers.push(wrongOptions[Math.floor(Math.random() * wrongOptions.length)]);
    }
  }
  return answers;
}

/**
 * Get fixed correct answers for MCQ exam
 */
export function generateCorrectAnswers(numQuestions: number): string[] {
  return getFixedCorrectAnswers(numQuestions);
}

export function generateEssayContent(wordCount: number, plagiarismChance: number): string {
  const words = [
    "the", "system", "processes", "data", "efficiently", "using", "advanced",
    "algorithms", "to", "ensure", "quality", "results", "in", "a", "distributed", "environment",
    "with", "multiple", "nodes", "working", "together", "for", "optimal", "performance",
    "and", "reliability", "across", "different", "platforms", "computing",
  ];

  let text = '';
  if (Math.random() < plagiarismChance) {
    const phrase = CORPUS_PHRASES[Math.floor(Math.random() * CORPUS_PHRASES.length)];
    text = phrase + ' ';
    const remaining = wordCount - phrase.split(' ').length;
    for (let i = 0; i < remaining; i++) {
      text += words[Math.floor(Math.random() * words.length)] + ' ';
    }
  } else {
    for (let i = 0; i < wordCount; i++) {
      text += words[Math.floor(Math.random() * words.length)] + ' ';
    }
  }
  return text.trim();
}

export function generateSubmissions(
  count: number,
  examType: ExamType = 'MCQ',
  questionsPerExam = 50
): { submissions: Submission[]; correctAnswers: Map<string, string[]> } {
  const examId = genId('exam');
  const correctAnswersMap = new Map<string, string[]>();

  let correctAnswers: string[] | undefined;
  if (examType === 'MCQ' || examType === 'MIXED') {
    correctAnswers = generateCorrectAnswers(questionsPerExam);
    correctAnswersMap.set(examId, correctAnswers);
  }

  const submissions: Submission[] = [];
  for (let i = 0; i < count; i++) {
    let studentAnswers: string[] = [];
    
    if (examType === 'MCQ' || examType === 'MIXED') {
      const correctnessRate = 0.55 + Math.random() * 0.2; // 55% to 75% correct
      studentAnswers = generateRandomAnswers(questionsPerExam, correctAnswers, correctnessRate);
    }

    const sub: Submission = {
      id: genId('sub'),
      studentId: genId('student'),
      studentName: `${STUDENT_NAMES[i % STUDENT_NAMES.length]} ${String(i + 1).padStart(3, '0')}`,
      examId,
      type: examType,
      status: 'PENDING',
      content: examType === 'MCQ'
        ? { answers: studentAnswers }
        : examType === 'ESSAY'
        ? { text: generateEssayContent(500, 0.3) }
        : { answers: studentAnswers, text: generateEssayContent(300, 0.25) },
      submittedAt: Date.now(),
      taskIds: [],
    };
    submissions.push(sub);
  }
  return { submissions, correctAnswers: correctAnswersMap };
}
