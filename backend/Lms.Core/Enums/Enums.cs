namespace Lms.Core.Enums;

public enum UserRole
{
    Student = 1,
    Teacher = 2
}

public enum LessonContentType
{
    Video = 1,
    Document = 2,
    Quiz = 3,
    Assignment = 4
}

public enum EnrollmentStatus
{
    Active = 1,
    Expired = 2,
    Revoked = 3
}

public enum PaymentMethod
{
    InstantGateway = 1,
    BankTransfer = 2
}

public enum PaymentStatus
{
    PendingVerification = 1,
    Completed = 2,
    Rejected = 3
}

public enum SubmissionStatus
{
    Submitted = 1,
    Graded = 2
}
