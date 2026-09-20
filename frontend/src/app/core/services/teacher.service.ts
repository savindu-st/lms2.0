import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Assignment,
  AssignmentSubmission,
  Course,
  CourseDetail,
  CourseModule,
  Enrollment,
  Lesson,
  Payment,
  QuizQuestion,
  TeacherAnalytics
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/teacher';

  // Analytics
  getAnalytics(): Observable<TeacherAnalytics> {
    return this.http.get<TeacherAnalytics>(`${this.apiUrl}/teachermanagement/analytics`);
  }

  // Student Roster
  getStudentRoster(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.apiUrl}/teachermanagement/students`);
  }

  extendAccess(enrollmentId: string, additionalDays: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/teachermanagement/students/${enrollmentId}/extend`, { additionalDays });
  }

  // Bank Transfer Approval Desk
  getPendingBankTransfers(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/teachermanagement/payments/pending`);
  }

  verifyBankTransfer(paymentId: string, approve: boolean, teacherNotes?: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/teachermanagement/payments/${paymentId}/verify`, { approve, teacherNotes });
  }

  // Gradebook Submissions
  getSubmissions(): Observable<AssignmentSubmission[]> {
    return this.http.get<AssignmentSubmission[]>(`${this.apiUrl}/teachermanagement/submissions`);
  }

  gradeSubmission(submissionId: string, score: number, teacherFeedback?: string): Observable<AssignmentSubmission> {
    return this.http.post<AssignmentSubmission>(`${this.apiUrl}/teachermanagement/submissions/${submissionId}/grade`, { score, teacherFeedback });
  }

  // Courses CRUD
  getTeacherCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/teachercourses`);
  }

  getTeacherCourseDetails(courseId: string): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.apiUrl}/teachercourses/${courseId}`);
  }

  createCourse(data: {
    title: string;
    courseCode: string;
    description: string;
    monthYear: string;
    price: number;
    accessDurationDays: number;
    thumbnailUrl?: string;
    isPublished: boolean;
  }): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/teachercourses`, data);
  }

  updateCourse(courseId: string, data: any): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/teachercourses/${courseId}`, data);
  }

  deleteCourse(courseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teachercourses/${courseId}`);
  }

  // Modules & Lessons
  addModule(courseId: string, title: string, orderIndex?: number): Observable<CourseModule> {
    return this.http.post<CourseModule>(`${this.apiUrl}/teachercourses/${courseId}/modules`, { title, orderIndex });
  }

  deleteModule(moduleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teachercourses/modules/${moduleId}`);
  }

  addLesson(moduleId: string, lessonData: any): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/teachercourses/modules/${moduleId}/lessons`, lessonData);
  }

  updateLesson(lessonId: string, lessonData: any): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/teachercourses/lessons/${lessonId}`, lessonData);
  }

  deleteLesson(lessonId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teachercourses/lessons/${lessonId}`);
  }

  // Assessments
  addQuizQuestion(lessonId: string, questionData: any): Observable<QuizQuestion> {
    return this.http.post<QuizQuestion>(`${this.apiUrl}/teachercourses/lessons/${lessonId}/quiz-questions`, questionData);
  }

  deleteQuizQuestion(questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teachercourses/quiz-questions/${questionId}`);
  }

  createAssignment(lessonId: string, assignmentData: any): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.apiUrl}/teachercourses/lessons/${lessonId}/assignments`, assignmentData);
  }
}
