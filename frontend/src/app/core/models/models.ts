export enum UserRole {
  Student = 1,
  Teacher = 2
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  createdAt: string;
}

export interface AuthResponse {
  token?: string;
  user: User;
}

export enum LessonContentType {
  Video = 1,
  Document = 2,
  Quiz = 3,
  Assignment = 4
}

export enum EnrollmentStatus {
  Active = 1,
  Expired = 2,
  Revoked = 3
}

export enum PaymentMethod {
  InstantGateway = 1,
  BankTransfer = 2
}

export enum PaymentStatus {
  PendingVerification = 1,
  Completed = 2,
  Rejected = 3
}

export enum SubmissionStatus {
  Submitted = 1,
  Graded = 2
}

export interface Course {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  monthYear: string;
  price: number;
  accessDurationDays: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  createdAt: string;
  modulesCount: number;
  lessonsCount: number;
  activeStudentsCount: number;
  isEnrolled: boolean;
  daysRemaining?: number | null;
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  contentType: LessonContentType;
  videoUrl?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  contentText?: string;
  durationMinutes?: number;
  orderIndex: number;
  isCompleted: boolean;
  questionsCount: number;
  hasAssignment: boolean;
  assignment?: Assignment;
  quizQuestions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  lessonId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
  orderIndex: number;
}

export interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  questionReviews: QuestionReview[];
}

export interface QuestionReview {
  questionId: string;
  questionText: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string;
  templateFileUrl?: string;
  templateFileName?: string;
  maxPoints: number;
  dueDate?: string;
  mySubmission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedFileUrl: string;
  originalFileName: string;
  studentNotes?: string;
  score?: number;
  maxPoints: number;
  teacherFeedback?: string;
  status: SubmissionStatus;
  submittedAt: string;
  gradedAt?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  monthYear: string;
  enrolledAt: string;
  expiresAt: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  daysRemaining: number;
  isExpired: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  slipFileUrl?: string;
  originalSlipFileName?: string;
  transferDate?: string;
  teacherNotes?: string;
  verifiedAt?: string;
  createdAt: string;
  invoice?: Invoice;
}

export interface Invoice {
  id: string;
  paymentId: string;
  invoiceNumber: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingOrSwift: string;
  branchName: string;
  transferInstructions: string;
  isConfigured?: boolean;
}

export interface Branding {
  academyName: string;
  instructorName: string;
  instructorTitle: string;
  bankDetails: BankDetails;
}

export interface TeacherAnalytics {
  totalRevenue: number;
  currentMonthRevenue: number;
  activeStudentsCount: number;
  totalCoursesCount: number;
  pendingBankTransfersCount: number;
  pendingSubmissionsCount: number;
  recentPayments: Payment[];
}
