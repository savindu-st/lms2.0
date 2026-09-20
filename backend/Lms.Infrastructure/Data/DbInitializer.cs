using Lms.Core.Entities;
using Lms.Core.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace Lms.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        var databaseCreator = context.Database.GetService<IDatabaseCreator>() as IRelationalDatabaseCreator;
        if (databaseCreator != null)
        {
            try
            {
                await databaseCreator.CreateTablesAsync();
            }
            catch
            {
                // Tables may already exist
            }
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        if (await context.Users.AnyAsync())
        {
            return; // Already seeded
        }

        // 1. Seed Teacher
        var teacher = new User
        {
            FullName = "Prof. Marcus Vance, CPA",
            Email = "teacher@accountingacademy.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher@123"),
            Role = UserRole.Teacher,
            PhoneNumber = "+1 (555) 234-8901",
            CreatedAt = DateTime.UtcNow
        };

        // 2. Seed Demo Student
        var student = new User
        {
            FullName = "Alex Reynolds",
            Email = "student@accountingacademy.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
            Role = UserRole.Student,
            PhoneNumber = "+1 (555) 987-6543",
            CreatedAt = DateTime.UtcNow
        };

        // 3. Seed Second Student (for bank transfer demo)
        var student2 = new User
        {
            FullName = "Sarah Jenkins",
            Email = "sarah.j@accountingacademy.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
            Role = UserRole.Student,
            PhoneNumber = "+1 (555) 456-7890",
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(teacher, student, student2);
        await context.SaveChangesAsync();

        // 4. Seed Monthly Accounting Courses
        var course1 = new Course
        {
            Title = "September 2026: Financial Accounting & Balance Sheet Analysis",
            CourseCode = "ACC-2026-09",
            Description = "Master the foundations of corporate financial accounting, double-entry bookkeeping principles, accrual vs cash adjustments, trial balances, and complete multi-step balance sheet construction under US GAAP & IFRS standards.",
            MonthYear = "September 2026",
            Price = 129.00m,
            AccessDurationDays = 45,
            ThumbnailUrl = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
            IsPublished = true,
            CreatedAt = DateTime.UtcNow.AddDays(-15)
        };

        var course2 = new Course
        {
            Title = "October 2026: Managerial Cost Accounting & Master Budgeting",
            CourseCode = "ACC-2026-10",
            Description = "Dive into internal financial decision-making: job order vs process costing, cost-volume-profit (CVP) analysis, break-even thresholds, direct material/labor variance analysis, and preparing quarterly operational master budgets in Excel.",
            MonthYear = "October 2026",
            Price = 149.00m,
            AccessDurationDays = 60,
            ThumbnailUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
            IsPublished = true,
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };

        var course3 = new Course
        {
            Title = "November 2026: Corporate Tax Strategies & Audit Verification",
            CourseCode = "ACC-2026-11",
            Description = "Comprehensive analysis of business entity tax compliance (Form 1120/1065), book-tax differences (Schedule M-1/M-3), working paper documentation, internal controls assessment, and audit risk matrix modeling.",
            MonthYear = "November 2026",
            Price = 179.00m,
            AccessDurationDays = 60,
            ThumbnailUrl = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
            IsPublished = true,
            CreatedAt = DateTime.UtcNow
        };

        context.Courses.AddRange(course1, course2, course3);
        await context.SaveChangesAsync();

        // 5. Seed Modules and Lessons for Course 1 (September 2026)
        var mod1 = new CourseModule
        {
            CourseId = course1.Id,
            Title = "Module 1: The Accounting Cycle & Accrual Foundations",
            OrderIndex = 1
        };

        var mod2 = new CourseModule
        {
            CourseId = course1.Id,
            Title = "Module 2: Adjusting Entries & Trial Balance Reconciliation",
            OrderIndex = 2
        };

        var mod3 = new CourseModule
        {
            CourseId = course1.Id,
            Title = "Module 3: Formal Financial Statement Construction & Evaluation",
            OrderIndex = 3
        };

        context.CourseModules.AddRange(mod1, mod2, mod3);
        await context.SaveChangesAsync();

        // Lessons for Module 1
        var lesson1 = new Lesson
        {
            ModuleId = mod1.Id,
            Title = "1.1 Introduction to Double-Entry & The Accounting Equation",
            ContentType = LessonContentType.Video,
            VideoUrl = "https://www.youtube.com/watch?v=yYX4bvQSqbo", // Standard accounting lecture demo
            DurationMinutes = 28,
            OrderIndex = 1,
            ContentText = "In this lecture, we review the fundamental accounting equation: Assets = Liabilities + Stockholders' Equity. We examine why every economic transaction affects at least two accounts and explore normal debit and credit balances."
        };

        var lesson2 = new Lesson
        {
            ModuleId = mod1.Id,
            Title = "1.2 Accrual Accounting vs Cash Basis Principles",
            ContentType = LessonContentType.Document,
            DurationMinutes = 15,
            OrderIndex = 2,
            ContentText = "Under the matching principle and revenue recognition standard (ASC 606), revenue is recognized when performance obligations are satisfied, and expenses are matched with related revenues. Download the reference sheet below for GAAP comparison."
        };

        // Lessons for Module 2
        var lesson3 = new Lesson
        {
            ModuleId = mod2.Id,
            Title = "2.1 Recording Adjusting Entries: Deferrals & Accruals",
            ContentType = LessonContentType.Video,
            VideoUrl = "https://www.youtube.com/watch?v=1F_47c2sFqE",
            DurationMinutes = 35,
            OrderIndex = 1,
            ContentText = "Learn how to record depreciation expense, unearned revenue earnouts, accrued salaries, and prepaid insurance adjustments before closing period ledgers."
        };

        var lesson4 = new Lesson
        {
            ModuleId = mod2.Id,
            Title = "2.2 Module Quiz: Accounting Adjustments & Trial Balance",
            ContentType = LessonContentType.Quiz,
            DurationMinutes = 20,
            OrderIndex = 2,
            ContentText = "Test your grasp on normal account balances, adjusting entries, and trial balance error detection."
        };

        // Lessons for Module 3
        var lesson5 = new Lesson
        {
            ModuleId = mod3.Id,
            Title = "3.1 Assignment: Balance Sheet Preparation in Excel",
            ContentType = LessonContentType.Assignment,
            DurationMinutes = 45,
            OrderIndex = 1,
            ContentText = "Download the provided unadjusted trial balance spreadsheet. Complete the adjusting journal entries column, calculate adjusted balances, and construct the classified balance sheet."
        };

        context.Lessons.AddRange(lesson1, lesson2, lesson3, lesson4, lesson5);
        await context.SaveChangesAsync();

        // 6. Seed Quiz Questions for Lesson 4
        var q1 = new QuizQuestion
        {
            LessonId = lesson4.Id,
            QuestionText = "Which of the following accounts typically carries a normal DEBIT balance?",
            OptionA = "Accounts Payable",
            OptionB = "Common Stock",
            OptionC = "Prepaid Insurance",
            OptionD = "Unearned Revenue",
            CorrectOptionIndex = 2, // Prepaid Insurance is an asset
            Explanation = "Prepaid Insurance is a current asset account and therefore possesses a normal debit balance. Payables, equity, and unearned revenues carry normal credit balances.",
            Points = 2,
            OrderIndex = 1
        };

        var q2 = new QuizQuestion
        {
            LessonId = lesson4.Id,
            QuestionText = "A company collected $12,000 cash in advance for an annual consulting retainer on Sep 1. Under accrual accounting, what adjusting entry is made on Sep 30?",
            OptionA = "Debit Consulting Revenue $1,000; Credit Cash $1,000",
            OptionB = "Debit Unearned Revenue $1,000; Credit Consulting Revenue $1,000",
            OptionC = "Debit Cash $12,000; Credit Consulting Revenue $12,000",
            OptionD = "No entry required until year-end",
            CorrectOptionIndex = 1,
            Explanation = "1 month of the 12-month retainer ($1,000) has been earned. The liability 'Unearned Revenue' is debited, and 'Consulting Revenue' is credited.",
            Points = 2,
            OrderIndex = 2
        };

        var q3 = new QuizQuestion
        {
            LessonId = lesson4.Id,
            QuestionText = "What is the effect on the accounting equation when equipment is purchased for $50,000 using $10,000 cash and a $40,000 note payable?",
            OptionA = "Total Assets increase by $40,000; Total Liabilities increase by $40,000",
            OptionB = "Total Assets increase by $50,000; Total Liabilities increase by $50,000",
            OptionC = "Total Assets decrease by $10,000; Total Equity decreases by $10,000",
            OptionD = "No net change to Total Assets",
            CorrectOptionIndex = 0,
            Explanation = "Equipment (+50k) and Cash (-10k) yield a net asset increase of +$40k, matched precisely by the Note Payable liability of +$40k.",
            Points = 2,
            OrderIndex = 3
        };

        context.QuizQuestions.AddRange(q1, q2, q3);

        // 7. Seed Assignment for Lesson 5
        var assignment1 = new Assignment
        {
            LessonId = lesson5.Id,
            Title = "Classified Balance Sheet Construction (Case: Apex Logistics Inc.)",
            Instructions = "Using the provided case information, classify all balance sheet items into Current Assets, Non-Current Assets, Current Liabilities, Long-Term Debt, and Stockholders' Equity. Verify that Total Assets = Total Liabilities + Equity.",
            MaxPoints = 100,
            DueDate = DateTime.UtcNow.AddDays(14)
        };

        context.Assignments.Add(assignment1);
        await context.SaveChangesAsync();

        // 8. Seed Sample Enrollment for Alex Reynolds (Enrolled in September course)
        var enrollment = new Enrollment
        {
            StudentId = student.Id,
            CourseId = course1.Id,
            EnrolledAt = DateTime.UtcNow.AddDays(-10),
            ExpiresAt = DateTime.UtcNow.AddDays(35), // 35 days remaining
            Status = EnrollmentStatus.Active,
            ProgressPercentage = 40.00m
        };

        context.Enrollments.Add(enrollment);

        // Mark first 2 lessons completed
        context.LessonCompletions.AddRange(
            new LessonCompletion { StudentId = student.Id, LessonId = lesson1.Id, CompletedAt = DateTime.UtcNow.AddDays(-8) },
            new LessonCompletion { StudentId = student.Id, LessonId = lesson2.Id, CompletedAt = DateTime.UtcNow.AddDays(-5) }
        );

        // Seed Paid Payment & Invoice for Alex
        var payment1 = new Payment
        {
            StudentId = student.Id,
            CourseId = course1.Id,
            Amount = 129.00m,
            Currency = "USD",
            Method = PaymentMethod.InstantGateway,
            Status = PaymentStatus.Completed,
            TransactionRef = "TXN-INST-20260901-7892",
            VerifiedAt = DateTime.UtcNow.AddDays(-10),
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };

        context.Payments.Add(payment1);
        await context.SaveChangesAsync();

        var invoice1 = new Invoice
        {
            PaymentId = payment1.Id,
            InvoiceNumber = "INV-202609-0001",
            StudentName = student.FullName,
            StudentEmail = student.Email,
            CourseTitle = course1.Title,
            Subtotal = 129.00m,
            TaxRate = 0.00m,
            TaxAmount = 0.00m,
            Total = 129.00m,
            IssuedAt = DateTime.UtcNow.AddDays(-10)
        };

        context.Invoices.Add(invoice1);

        // 9. Seed Pending Bank Transfer for Sarah Jenkins on Course 2 (Ready for teacher verification demo!)
        var pendingBankPayment = new Payment
        {
            StudentId = student2.Id,
            CourseId = course2.Id,
            Amount = 149.00m,
            Currency = "USD",
            Method = PaymentMethod.BankTransfer,
            Status = PaymentStatus.PendingVerification,
            TransactionRef = "WIRE-FED-9812401",
            OriginalSlipFileName = "bank_wire_receipt_september.pdf",
            SlipFileUrl = "/uploads/slips/sample_wire_receipt.png",
            TransferDate = DateTime.UtcNow.AddHours(-12),
            TeacherNotes = "Transferred via Chase Wire. Ref #WIRE-FED-9812401",
            CreatedAt = DateTime.UtcNow.AddHours(-12)
        };

        context.Payments.Add(pendingBankPayment);
        await context.SaveChangesAsync();
    }
}
