import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog';
import { LoginComponent } from './features/auth/login';
import { RegisterComponent } from './features/auth/register';
import { MyCoursesComponent } from './features/student/my-courses/my-courses';
import { ClassroomPlayerComponent } from './features/student/player/player';
import { StudentInvoicesComponent } from './features/student/invoices/invoices';
import { TeacherCoursesComponent } from './features/teacher/courses/teacher-courses';
import { BankVerificationComponent } from './features/teacher/payments/bank-verification';
import { StudentRosterComponent } from './features/teacher/students/student-roster';
import { GradebookComponent } from './features/teacher/gradebook/gradebook';
import { authGuard, teacherGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Student portal routes
  { path: 'student/my-courses', component: MyCoursesComponent, canActivate: [authGuard] },
  { path: 'student/learn/:id', component: ClassroomPlayerComponent, canActivate: [authGuard] },
  { path: 'student/invoices', component: StudentInvoicesComponent, canActivate: [authGuard] },

  // Teacher portal routes
  { path: 'teacher/courses', component: TeacherCoursesComponent, canActivate: [teacherGuard] },
  { path: 'teacher/payments', component: BankVerificationComponent, canActivate: [teacherGuard] },
  { path: 'teacher/students', component: StudentRosterComponent, canActivate: [teacherGuard] },
  { path: 'teacher/gradebook', component: GradebookComponent, canActivate: [teacherGuard] },

  { path: '**', redirectTo: '' }
];
