using System.Text;
using Lms.Core.Interfaces;
using Lms.Infrastructure.Data;
using Lms.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. PostgreSQL Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=lms_accounting;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("Lms.Infrastructure"));
});

// 2. Register Application Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IAssessmentService, AssessmentService>();

// 3. JWT Bearer Authentication
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? "AccountingLmsSuperSecretKey2026!WithHighEntropyForSecurityAndCompliance";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AccountingLms";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AccountingLmsApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

builder.Services.AddAuthorization();

// CORS is managed exclusively at the Lms.Gateway edge layer to prevent duplicate headers

// 5. Controllers with JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// 6. Swagger with Bearer Token documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Accounting LMS API",
        Version = "v1",
        Description = "Learning Management System for Accounting Education"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Forwarded headers from Lms.Gateway
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// Ensure wwwroot and upload folders exist
var uploadsPath = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
Directory.CreateDirectory(Path.Combine(uploadsPath, "slips"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "materials"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "submissions"));

// One-time database table wipe if invoked with --wipe-database
if (args.Contains("--wipe-database"))
{
    using var wipeScope = app.Services.CreateScope();
    var wipeContext = wipeScope.ServiceProvider.GetRequiredService<AppDbContext>();
    var wipeLogger = wipeScope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    wipeLogger.LogWarning("Executing database table wipe per --wipe-database flag...");
    await wipeContext.Database.ExecuteSqlRawAsync(@"
        TRUNCATE TABLE 
            ""Invoices"",
            ""Payments"",
            ""Enrollments"",
            ""AssignmentSubmissions"",
            ""Assignments"",
            ""QuizAttempts"",
            ""QuizQuestions"",
            ""LessonCompletions"",
            ""Lessons"",
            ""CourseModules"",
            ""Courses"",
            ""Users""
        CASCADE;
    ");
    wipeLogger.LogInformation("All application tables truncated successfully.");
    var configuration = wipeScope.ServiceProvider.GetRequiredService<IConfiguration>();
    await DbInitializer.InitializeAsync(wipeContext, configuration);
    wipeLogger.LogInformation("Database reset and initial teacher account provisioned successfully. Exiting.");
    return;
}

// Database initialization and teacher provisioning at startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var configuration = services.GetRequiredService<IConfiguration>();
        logger.LogInformation("Attempting database initialization and teacher provisioning...");
        await DbInitializer.InitializeAsync(context, configuration);
        logger.LogInformation("Database initialized successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Note: Database initialization could not connect to PostgreSQL. Verify that PostgreSQL is running and update 'ConnectionStrings:DefaultConnection' in appsettings.json.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Accounting LMS API v1"));
}

app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
