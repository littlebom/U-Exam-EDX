// Mock Analytics Data for U-Exam Platform
// Includes exam stats, item analysis, score distribution, and trend data

// --- Exam Statistics ---

export type MockExamStats = {
  examId: string;
  examName: string;
  totalCandidates: number;
  completedCount: number;
  passCount: number;
  failCount: number;
  passRate: number; // percentage
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  standardDeviation: number;
  averageDuration: number; // minutes
};

export const MOCK_EXAM_STATS: MockExamStats[] = [
  {
    examId: "exam_004",
    examName: "ทดสอบความรู้ Cybersecurity Essentials",
    totalCandidates: 156,
    completedCount: 148,
    passCount: 104,
    failCount: 44,
    passRate: 70.3,
    averageScore: 58.4,
    medianScore: 60,
    highestScore: 78,
    lowestScore: 24,
    standardDeviation: 12.5,
    averageDuration: 82,
  },
  {
    examId: "exam_005",
    examName: "Software Engineering Principles",
    totalCandidates: 98,
    completedCount: 92,
    passCount: 69,
    failCount: 23,
    passRate: 75.0,
    averageScore: 63.9,
    medianScore: 65,
    highestScore: 88,
    lowestScore: 28,
    standardDeviation: 14.2,
    averageDuration: 105,
  },
  {
    examId: "exam_006",
    examName: "TechCorp Internal - Q1 2026 Assessment",
    totalCandidates: 45,
    completedCount: 28,
    passCount: 22,
    failCount: 6,
    passRate: 78.6,
    averageScore: 39.6,
    medianScore: 40,
    highestScore: 55,
    lowestScore: 18,
    standardDeviation: 9.8,
    averageDuration: 48,
  },
  {
    examId: "exam_009",
    examName: "TechCorp Onboarding - Technical Skills",
    totalCandidates: 12,
    completedCount: 8,
    passCount: 6,
    failCount: 2,
    passRate: 75.0,
    averageScore: 38.5,
    medianScore: 40,
    highestScore: 48,
    lowestScore: 22,
    standardDeviation: 8.3,
    averageDuration: 36,
  },
];

// --- Score Distribution ---

export type MockScoreDistribution = {
  examId: string;
  examName: string;
  distribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
};

export const MOCK_SCORE_DISTRIBUTIONS: MockScoreDistribution[] = [
  {
    examId: "exam_004",
    examName: "ทดสอบความรู้ Cybersecurity Essentials",
    distribution: [
      { range: "0-10%", count: 2, percentage: 1.4 },
      { range: "11-20%", count: 3, percentage: 2.0 },
      { range: "21-30%", count: 5, percentage: 3.4 },
      { range: "31-40%", count: 8, percentage: 5.4 },
      { range: "41-50%", count: 12, percentage: 8.1 },
      { range: "51-60%", count: 18, percentage: 12.2 },
      { range: "61-70%", count: 32, percentage: 21.6 },
      { range: "71-80%", count: 38, percentage: 25.7 },
      { range: "81-90%", count: 22, percentage: 14.9 },
      { range: "91-100%", count: 8, percentage: 5.4 },
    ],
  },
  {
    examId: "exam_005",
    examName: "Software Engineering Principles",
    distribution: [
      { range: "0-10%", count: 1, percentage: 1.1 },
      { range: "11-20%", count: 2, percentage: 2.2 },
      { range: "21-30%", count: 4, percentage: 4.3 },
      { range: "31-40%", count: 6, percentage: 6.5 },
      { range: "41-50%", count: 10, percentage: 10.9 },
      { range: "51-60%", count: 14, percentage: 15.2 },
      { range: "61-70%", count: 20, percentage: 21.7 },
      { range: "71-80%", count: 18, percentage: 19.6 },
      { range: "81-90%", count: 12, percentage: 13.0 },
      { range: "91-100%", count: 5, percentage: 5.4 },
    ],
  },
];

// --- Item Analysis ---

export type MockItemAnalysis = {
  questionId: string;
  questionTitle: string;
  examId: string;
  totalResponses: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  difficultyIndex: number; // 0-1 (proportion correct, higher = easier)
  discriminationIndex: number; // -1 to 1 (higher = better discrimination)
  optionAnalysis: {
    option: string;
    selectedCount: number;
    selectedPercentage: number;
    isCorrect: boolean;
  }[] | null;
};

export const MOCK_ITEM_ANALYSIS: MockItemAnalysis[] = [
  {
    questionId: "q_001",
    questionTitle: "โปรโตคอล HTTP",
    examId: "exam_004",
    totalResponses: 148,
    correctCount: 126,
    incorrectCount: 20,
    skippedCount: 2,
    difficultyIndex: 0.85,
    discriminationIndex: 0.32,
    optionAnalysis: [
      { option: "พอร์ต 21", selectedCount: 8, selectedPercentage: 5.4, isCorrect: false },
      { option: "พอร์ต 25", selectedCount: 5, selectedPercentage: 3.4, isCorrect: false },
      { option: "พอร์ต 80", selectedCount: 126, selectedPercentage: 85.1, isCorrect: true },
      { option: "พอร์ต 443", selectedCount: 7, selectedPercentage: 4.7, isCorrect: false },
    ],
  },
  {
    questionId: "q_002",
    questionTitle: "Data Structure - Stack",
    examId: "exam_004",
    totalResponses: 148,
    correctCount: 118,
    incorrectCount: 28,
    skippedCount: 2,
    difficultyIndex: 0.80,
    discriminationIndex: 0.45,
    optionAnalysis: [
      { option: "FIFO", selectedCount: 20, selectedPercentage: 13.5, isCorrect: false },
      { option: "LIFO", selectedCount: 118, selectedPercentage: 79.7, isCorrect: true },
      { option: "Priority", selectedCount: 5, selectedPercentage: 3.4, isCorrect: false },
      { option: "Random Access", selectedCount: 3, selectedPercentage: 2.0, isCorrect: false },
    ],
  },
  {
    questionId: "q_003",
    questionTitle: "SQL JOIN",
    examId: "exam_004",
    totalResponses: 148,
    correctCount: 89,
    incorrectCount: 55,
    skippedCount: 4,
    difficultyIndex: 0.60,
    discriminationIndex: 0.52,
    optionAnalysis: [
      { option: "LEFT JOIN", selectedCount: 22, selectedPercentage: 14.9, isCorrect: false },
      { option: "RIGHT JOIN", selectedCount: 8, selectedPercentage: 5.4, isCorrect: false },
      { option: "INNER JOIN", selectedCount: 89, selectedPercentage: 60.1, isCorrect: true },
      { option: "FULL OUTER JOIN", selectedCount: 25, selectedPercentage: 16.9, isCorrect: false },
    ],
  },
  {
    questionId: "q_004",
    questionTitle: "Design Pattern - Singleton",
    examId: "exam_005",
    totalResponses: 92,
    correctCount: 62,
    incorrectCount: 28,
    skippedCount: 2,
    difficultyIndex: 0.67,
    discriminationIndex: 0.48,
    optionAnalysis: [
      {
        option: "สร้าง object ได้หลาย instance พร้อมกัน",
        selectedCount: 8,
        selectedPercentage: 8.7,
        isCorrect: false,
      },
      {
        option: "จำกัดให้สร้าง object ได้เพียง instance เดียว",
        selectedCount: 62,
        selectedPercentage: 67.4,
        isCorrect: true,
      },
      {
        option: "แยก interface ออกจาก implementation",
        selectedCount: 12,
        selectedPercentage: 13.0,
        isCorrect: false,
      },
      {
        option: "ห่อหุ้ม algorithm ไว้ภายใน class",
        selectedCount: 8,
        selectedPercentage: 8.7,
        isCorrect: false,
      },
    ],
  },
  {
    questionId: "q_005",
    questionTitle: "TCP vs UDP",
    examId: "exam_004",
    totalResponses: 148,
    correctCount: 130,
    incorrectCount: 16,
    skippedCount: 2,
    difficultyIndex: 0.88,
    discriminationIndex: 0.25,
    optionAnalysis: [
      { option: "ถูก", selectedCount: 130, selectedPercentage: 87.8, isCorrect: true },
      { option: "ผิด", selectedCount: 16, selectedPercentage: 10.8, isCorrect: false },
    ],
  },
  {
    questionId: "q_006",
    questionTitle: "JavaScript Hoisting",
    examId: "exam_005",
    totalResponses: 92,
    correctCount: 48,
    incorrectCount: 42,
    skippedCount: 2,
    difficultyIndex: 0.52,
    discriminationIndex: 0.61,
    optionAnalysis: [
      { option: "ถูก", selectedCount: 42, selectedPercentage: 45.7, isCorrect: false },
      { option: "ผิด", selectedCount: 48, selectedPercentage: 52.2, isCorrect: true },
    ],
  },
  {
    questionId: "q_010",
    questionTitle: "Microservices vs Monolith",
    examId: "exam_005",
    totalResponses: 92,
    correctCount: 0,
    incorrectCount: 0,
    skippedCount: 5,
    difficultyIndex: 0.58,
    discriminationIndex: 0.55,
    optionAnalysis: null,
  },
  {
    questionId: "q_014",
    questionTitle: "HTTP Status Codes",
    examId: "exam_004",
    totalResponses: 148,
    correctCount: 95,
    incorrectCount: 48,
    skippedCount: 5,
    difficultyIndex: 0.64,
    discriminationIndex: 0.42,
    optionAnalysis: null,
  },
];

// --- Monthly Trend Data (12 months) ---

export type MockMonthlyTrend = {
  month: string; // YYYY-MM
  label: string;
  totalExams: number;
  totalCandidates: number;
  averagePassRate: number;
  averageScore: number;
  revenue: number; // THB
};

export const MOCK_MONTHLY_TRENDS: MockMonthlyTrend[] = [
  {
    month: "2025-04",
    label: "เม.ย. 2025",
    totalExams: 3,
    totalCandidates: 120,
    averagePassRate: 68.5,
    averageScore: 62.3,
    revenue: 240000,
  },
  {
    month: "2025-05",
    label: "พ.ค. 2025",
    totalExams: 4,
    totalCandidates: 145,
    averagePassRate: 71.2,
    averageScore: 64.8,
    revenue: 310000,
  },
  {
    month: "2025-06",
    label: "มิ.ย. 2025",
    totalExams: 5,
    totalCandidates: 180,
    averagePassRate: 69.8,
    averageScore: 63.1,
    revenue: 405000,
  },
  {
    month: "2025-07",
    label: "ก.ค. 2025",
    totalExams: 4,
    totalCandidates: 160,
    averagePassRate: 72.5,
    averageScore: 66.2,
    revenue: 360000,
  },
  {
    month: "2025-08",
    label: "ส.ค. 2025",
    totalExams: 6,
    totalCandidates: 210,
    averagePassRate: 74.1,
    averageScore: 67.5,
    revenue: 525000,
  },
  {
    month: "2025-09",
    label: "ก.ย. 2025",
    totalExams: 5,
    totalCandidates: 195,
    averagePassRate: 70.8,
    averageScore: 65.0,
    revenue: 480000,
  },
  {
    month: "2025-10",
    label: "ต.ค. 2025",
    totalExams: 7,
    totalCandidates: 250,
    averagePassRate: 73.6,
    averageScore: 67.8,
    revenue: 625000,
  },
  {
    month: "2025-11",
    label: "พ.ย. 2025",
    totalExams: 6,
    totalCandidates: 220,
    averagePassRate: 75.0,
    averageScore: 68.4,
    revenue: 550000,
  },
  {
    month: "2025-12",
    label: "ธ.ค. 2025",
    totalExams: 8,
    totalCandidates: 280,
    averagePassRate: 71.4,
    averageScore: 65.9,
    revenue: 700000,
  },
  {
    month: "2026-01",
    label: "ม.ค. 2026",
    totalExams: 7,
    totalCandidates: 260,
    averagePassRate: 76.2,
    averageScore: 69.1,
    revenue: 680000,
  },
  {
    month: "2026-02",
    label: "ก.พ. 2026",
    totalExams: 5,
    totalCandidates: 200,
    averagePassRate: 74.5,
    averageScore: 68.0,
    revenue: 520000,
  },
  {
    month: "2026-03",
    label: "มี.ค. 2026",
    totalExams: 9,
    totalCandidates: 310,
    averagePassRate: 77.3,
    averageScore: 70.2,
    revenue: 820000,
  },
];

// --- Platform Summary ---

export type MockPlatformSummary = {
  totalUsers: number;
  totalCandidates: number;
  totalExams: number;
  totalQuestions: number;
  totalTestCenters: number;
  totalCertificatesIssued: number;
  totalRevenue: number;
  activeTenants: number;
  upcomingExams: number;
  pendingGrading: number;
};

export const MOCK_PLATFORM_SUMMARY: MockPlatformSummary = {
  totalUsers: 2456,
  totalCandidates: 2180,
  totalExams: 69,
  totalQuestions: 1520,
  totalTestCenters: 5,
  totalCertificatesIssued: 845,
  totalRevenue: 6215000,
  activeTenants: 12,
  upcomingExams: 4,
  pendingGrading: 18,
};
