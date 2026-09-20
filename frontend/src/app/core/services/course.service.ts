import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, CourseDetail, Enrollment, QuizResult } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api';

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  getCourseDetails(courseId: string): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.apiUrl}/courses/${courseId}`);
  }

  getMyCourses(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.apiUrl}/student/my-courses`);
  }

  getCourseClassroom(courseId: string): Observable<CourseDetail> {
    return this.http.get<CourseDetail>(`${this.apiUrl}/student/courses/${courseId}/learn`);
  }

  markLessonComplete(lessonId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/student/lessons/${lessonId}/complete`, {});
  }

  submitQuiz(data: { lessonId: string; answers: Record<string, number> }): Observable<QuizResult> {
    return this.http.post<QuizResult>(`${this.apiUrl}/student/quizzes/submit`, data);
  }

  submitAssignment(assignmentId: string, data: { fileUrl: string; originalFileName: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/student/assignments/${assignmentId}/submit`, data);
  }
}
