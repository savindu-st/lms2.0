-- ==============================================================================
-- LMS 2.0: Database Purge & Clean Slate Script
-- ==============================================================================
-- CAUTION: This script truncates all application tables to remove mock data.
-- Run this in your Supabase SQL Editor or execute via psql.
-- ==============================================================================

BEGIN;

-- Truncate all dependent and parent tables in one cascade
TRUNCATE TABLE 
    "Invoices",
    "Payments",
    "Enrollments",
    "AssignmentSubmissions",
    "Assignments",
    "QuizAttempts",
    "QuizQuestions",
    "LessonCompletions",
    "Lessons",
    "CourseModules",
    "Courses",
    "Users"
CASCADE;

COMMIT;

-- Verification Query: Confirm all tables are empty
SELECT 
    'Users' as table_name, count(*) as row_count FROM "Users"
UNION ALL
SELECT 'Courses', count(*) FROM "Courses"
UNION ALL
SELECT 'CourseModules', count(*) FROM "CourseModules"
UNION ALL
SELECT 'Lessons', count(*) FROM "Lessons"
UNION ALL
SELECT 'QuizQuestions', count(*) FROM "QuizQuestions"
UNION ALL
SELECT 'Assignments', count(*) FROM "Assignments"
UNION ALL
SELECT 'Enrollments', count(*) FROM "Enrollments"
UNION ALL
SELECT 'Payments', count(*) FROM "Payments"
UNION ALL
SELECT 'Invoices', count(*) FROM "Invoices";
