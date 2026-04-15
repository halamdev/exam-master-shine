/**
 * Test: MCQ Scoring Logic
 * Kiểm tra cách chấm điểm MCQ với đáp án chuẩn
 */

import { processMcqTask } from '@/lib/grading/workers';
import { generateCorrectAnswers, generateRandomAnswers } from '@/lib/grading/data-generator';
import type { Task } from '@/lib/grading/types';

// Test 1: Perfect score (100% correct)
function testPerfectScore() {
  console.log('\n=== Test 1: Perfect Score (100% correct) ===');
  const correctAnswers = generateCorrectAnswers(10);
  console.log('Correct answers:', correctAnswers);
  
  const task: Task = {
    id: 'test-1',
    submissionId: 'sub-1',
    type: 'mcq',
    status: 'completed',
    retryCount: 0,
    maxRetries: 3,
    createdAt: Date.now(),
    data: {
      answers: correctAnswers,
      correctAnswers,
      _processingTimeMs: 150,
    },
  };

  const result = processMcqTask(task);
  console.log('Result:', result);
  console.log('Expected: 10.0 (perfect score)\n');
}

// Test 2: Partial score (70% correct)
function testPartialScore() {
  console.log('=== Test 2: Partial Score (70% correct) ===');
  const correctAnswers = generateCorrectAnswers(10);
  console.log('Correct answers:', correctAnswers);
  
  // 7 correct, 3 wrong
  const studentAnswers = [
    correctAnswers[0], // ✓
    correctAnswers[1], // ✓
    correctAnswers[2], // ✓
    correctAnswers[3], // ✓
    correctAnswers[4], // ✓
    correctAnswers[5], // ✓
    correctAnswers[6], // ✓
    'X', // ✗ wrong
    'X', // ✗ wrong
    'X', // ✗ wrong
  ];
  console.log('Student answers:', studentAnswers);
  
  const task: Task = {
    id: 'test-2',
    submissionId: 'sub-2',
    type: 'mcq',
    status: 'completed',
    retryCount: 0,
    maxRetries: 3,
    createdAt: Date.now(),
    data: {
      answers: studentAnswers,
      correctAnswers,
      _processingTimeMs: 150,
    },
  };

  const result = processMcqTask(task);
  console.log('Result:', result);
  // Formula: (7/10 - 0.25 * 3/10) * 10 = (0.7 - 0.075) * 10 = 6.25
  console.log('Expected: ~6.25\n');
}

// Test 3: Zero score (0% correct)
function testZeroScore() {
  console.log('=== Test 3: Zero Score (0% correct) ===');
  const correctAnswers = generateCorrectAnswers(10);
  console.log('Correct answers:', correctAnswers);
  
  // All wrong
  const studentAnswers = Array(10).fill('X');
  console.log('Student answers:', studentAnswers);
  
  const task: Task = {
    id: 'test-3',
    submissionId: 'sub-3',
    type: 'mcq',
    status: 'completed',
    retryCount: 0,
    maxRetries: 3,
    createdAt: Date.now(),
    data: {
      answers: studentAnswers,
      correctAnswers,
      _processingTimeMs: 150,
    },
  };

  const result = processMcqTask(task);
  console.log('Result:', result);
  // Formula: (0/10 - 0.25 * 10/10) * 10 = (0 - 0.25) * 10 = -2.5 → 0 (clamped)
  console.log('Expected: 0 (clamped)\n');
}

// Test 4: Generated random answers (realistic)
function testRealisticAnswers() {
  console.log('=== Test 4: Realistic Answers (Generated) ===');
  const correctAnswers = generateCorrectAnswers(50);
  console.log('Correct answers generated (50 questions)');
  
  // Student scores: 65% correctness rate
  const studentAnswers = generateRandomAnswers(50, correctAnswers, 0.65);
  const correctCount = studentAnswers.filter((a, i) => a === correctAnswers[i]).length;
  console.log(`Student answers: ${correctCount}/50 correct`);
  
  const task: Task = {
    id: 'test-4',
    submissionId: 'sub-4',
    type: 'mcq',
    status: 'completed',
    retryCount: 0,
    maxRetries: 3,
    createdAt: Date.now(),
    data: {
      answers: studentAnswers,
      correctAnswers,
      _processingTimeMs: 150,
    },
  };

  const result = processMcqTask(task);
  console.log('Result:', result);
  console.log('Expected: Score between 5-7 range\n');
}

// Run all tests
console.log('\nMCQ Scoring Tests');
console.log('==================\n');
testPerfectScore();
testPartialScore();
testZeroScore();
testRealisticAnswers();
console.log('✅ All tests completed');
