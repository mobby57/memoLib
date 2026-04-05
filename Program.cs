using System.Security;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Middleware;
using MemoLib.Api.Authorization;
using MemoLib.Api.Services.Integration;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;
using Microsoft.OpenApi.Models;
using MemoLib.Api.Contracts;

var builder = WebApplication.CreateBuilder(args);

// Configuration Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Filter.ByExcluding(logEvent =>
        logEvent.MessageTemplate.Text.Contains("Token validated") ||
        logEvent.MessageTemplate.Text.Contains("Claims:") ||
        logEvent.MessageTemplate.Text.Contains("Bearer ") ||
        logEvent.MessageTemplate.Text.Contains("Authorization"))
    .Destructure.ByTransforming<Exception>(e => new { e.Message, e.Source })
    .WriteTo.Console()
    .WriteTo.File("logs/memolib-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

Log.Information("🚀 Démarrage MemoLib API...");
Log.Information("📁 Répertoire de travail: {WorkingDirectory}", Directory.GetCurrentDirectory());
Log.Information("🌍 Environnement: {Environment}", builder.Environment.EnvironmentName);

// Configurer JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
{
    throw new InvalidOperationException("JwtSettings:Issuer et JwtSettings:Audience doivent être définis.");
}

if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey doit être défini avec une valeur forte (>= 32 caractères).");
}

// SECURITY: Bloquer secrets par défaut en production
if (builder.Environment.IsProduction() &&
    (secretKey.Contains("VotreCle") || secretKey.Contains("default") || secretKey.Contains("Secret")))
{
    throw new SecurityException("CRITICAL: Default JWT secret detected in production! Use Azure KeyVault or User Secrets.");
}

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = key,
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Error("JWT Authentication failed: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var safeClaims = context.Principal?.Claims
                .Where(c => c.Type is "userId" or "role" or "email")
                .Select(c => $"{c.Type}={c.Value}");
            Log.Information("JWT Token validated. User: {Claims}", string.Join(", ", safeClaims ?? []));
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthorization(options =>
{
    // Dossiers/Cas - Hiérarchie progressive
    options.AddPolicy(Policies.ViewCases, policy => policy.RequireAuthenticatedUser());
    options.AddPolicy(Policies.CreateCases, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.EditCases, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.AssignCases, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.CloseCases, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.DeleteCases, policy => policy.RequireRole(Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ExportCases, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));

    // Contacts/Clients
    options.AddPolicy(Policies.ViewContacts, policy => policy.RequireRole(Roles.User, Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.CreateContacts, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.EditContacts, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.DeleteContacts, policy => policy.RequireRole(Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ExportContacts, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));

    // Communication
    options.AddPolicy(Policies.ViewMessages, policy => policy.RequireRole(Roles.User, Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.SendMessages, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.DeleteMessages, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.UseTemplates, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ManageTemplates, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));

    // Documents
    options.AddPolicy(Policies.ViewDocuments, policy => policy.RequireRole(Roles.User, Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.UploadDocuments, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.DeleteDocuments, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ShareDocuments, policy => policy.RequireRole(Roles.Agent, Roles.Manager, Roles.Admin, Roles.Owner));

    // Analytics & Rapports
    options.AddPolicy(Policies.ViewAnalytics, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ViewReports, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ExportReports, policy => policy.RequireRole(Roles.Manager, Roles.Admin, Roles.Owner));

    // Administration
    options.AddPolicy(Policies.ManageUsers, policy => policy.RequireRole(Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ManageRoles, policy => policy.RequireRole(Roles.Owner));
    options.AddPolicy(Policies.ManageSettings, policy => policy.RequireRole(Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ViewAuditLogs, policy => policy.RequireRole(Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ManageIntegrations, policy => policy.RequireRole(Roles.Admin, Roles.Owner));
    options.AddPolicy(Policies.ManageBilling, policy => policy.RequireRole(Roles.Owner));
});
builder.Services.AddControllers();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MemoLib API",
        Version = "v1",
        Description = "API de gestion d'emails et dossiers pour cabinets d'avocats"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Exemple: 'Bearer {token}'",
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new HeaderApiVersionReader("X-Api-Version"),
        new QueryStringApiVersionReader("api-version"));
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Limite globale taille requetes (10 Mo)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
});
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddMemoryCache();

// Cache distribué: Redis si configuré, sinon mémoire
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "MemoLib:";
    });
    Log.Information("✅ Cache distribué: Redis ({Connection})", redisConnection.Split(',')[0]);
}
else
{
    builder.Services.AddDistributedMemoryCache();
    Log.Information("✅ Cache distribué: Mémoire (Redis non configuré)");
}
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});
builder.Services.AddScoped<EmbeddingService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<ClientInfoExtractor>();
builder.Services.AddScoped<UrlValidationService>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddScoped<BruteForceProtectionService>();
builder.Services.AddScoped<EmailValidationService>();
builder.Services.AddScoped<EmailVerificationService>();
builder.Services.AddScoped<QuestionnaireService>();
builder.Services.AddScoped<PushNotificationService>();
builder.Services.AddScoped<AnalyticsService>();
builder.Services.AddScoped<TemplateEngineService>();
builder.Services.AddScoped<SatisfactionSurveyService>();
builder.Services.AddScoped<ReversibleAnonymizationService>();
builder.Services.AddScoped<LegalSectorSecurityService>();
builder.Services.AddScoped<GdprAnonymizationService>();
builder.Services.AddScoped<IntelligentEmailAdapterService>();
builder.Services.AddScoped<EmailSchemaValidationService>();
builder.Services.AddScoped<IntelligentWorkspaceOrganizerService>();
builder.Services.AddScoped<TeamManagementService>();
builder.Services.AddScoped<BillingService>();
builder.Services.AddScoped<DocumentGenerationService>();
builder.Services.AddScoped<CalendarService>();
builder.Services.AddScoped<SectorAdapterService>();
builder.Services.AddScoped<RoleBasedNotificationService>();
builder.Services.AddScoped<CaseNotesService>();
builder.Services.AddScoped<CaseTasksService>();
builder.Services.AddScoped<CaseDocumentsService>();
builder.Services.AddScoped<SmsIntegrationService>();
builder.Services.AddScoped<WhatsAppIntegrationService>();
builder.Services.AddScoped<TelegramIntegrationService>();
builder.Services.AddScoped<MessengerIntegrationService>();
builder.Services.AddScoped<UniversalGatewayService>();
builder.Services.AddScoped<SignalCommandCenterService>();
builder.Services.AddScoped<WorkflowAutomationService>();
builder.Services.AddScoped<AdvancedSearchService>();
builder.Services.AddScoped<ExportService>();
builder.Services.AddScoped<RealtimeNotificationService>();
builder.Services.AddScoped<FullTextSearchService>();
builder.Services.AddScoped<MemoLib.Api.Services.WebhookService>();
builder.Services.AddScoped<AdvancedTemplateService>();
builder.Services.AddScoped<SignatureService>();
builder.Services.AddScoped<DynamicFormService>();
builder.Services.AddScoped<ClientIntakeService>();
builder.Services.AddScoped<SharedWorkspaceService>();
builder.Services.AddScoped<TransactionService>();
builder.Services.AddScoped<VaultService>();
builder.Services.AddScoped<PdfExportService>();
builder.Services.AddScoped<ExcelExportService>();
builder.Services.AddScoped<EmailClassificationService>();
builder.Services.AddScoped<IPipelineWorkflowStore, PipelineWorkflowStore>();
builder.Services.AddScoped<CustomReportBuilderService>();
builder.Services.AddScoped<RedisCacheService>();
builder.Services.AddScoped<IEmailAdapter, MailKitEmailAdapter>();
builder.Services.AddScoped<IDocuSignService, DocuSignService>();
builder.Services.AddScoped<ILegalDatabaseService, LegalDatabaseService>();
builder.Services.AddScoped<IOpenAIService, OpenAIService>();
builder.Services.AddScoped<ISemanticKernelService, SemanticKernelService>();
builder.Services.AddScoped<INotificationChannelService, NotificationChannelService>();
builder.Services.AddScoped<LegalDeadlineService>();
builder.Services.AddScoped<HearingService>();
builder.Services.AddScoped<IIntegrationMonitorService, IntegrationMonitorService>();
builder.Services.AddHttpClient();
builder.Services.AddSignalR(options =>
{
    options.MaximumParallelInvocationsPerClient = 5;
    options.MaximumReceiveMessageSize = 64 * 1024; // 64 Ko
    options.StreamBufferCapacity = 10;
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
});

// Avertissement si EmailMonitor n'est pas configuré
var emailUsername = builder.Configuration["EmailMonitor:Username"];
if (string.IsNullOrWhiteSpace(emailUsername))
{
    Console.WriteLine("⚠️  EmailMonitor:Username non configuré. Le monitoring email sera inactif. Exécutez configure-secrets.ps1.");
}
builder.Services.AddHostedService<EmailMonitorService>();
builder.Services.AddHostedService<ConnectionMonitorService>();
builder.Services.AddHostedService<AutomationEngineService>();
builder.Services.AddHostedService<DeadlineAlertService>();

// Configuration base de données (SQLite dev / SQL Server prod)
var connectionString = builder.Configuration.GetConnectionString("Default");
var useSqlServer = builder.Configuration.GetValue<bool>("UseSqlServer");

builder.Services.AddDbContext<MemoLibDbContext>(options =>
{
    if (useSqlServer)
    {
        options.UseSqlServer(connectionString, sqlServerOptions =>
        {
            sqlServerOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
            sqlServerOptions.CommandTimeout(30);
            sqlServerOptions.MigrationsAssembly("MemoLib.Api");
        });
        Log.Information("✅ Base de données: SQL Server");
    }
    else
    {
        options.UseSqlite(connectionString, sqliteOptions =>
        {
            sqliteOptions.CommandTimeout(30);
        });
        Log.Information("✅ Base de données: SQLite");

        // R1: Chiffrement SQLite au repos via PRAGMA
        var sqliteCipherKey = builder.Configuration["SqliteCipherKey"];
        if (!string.IsNullOrWhiteSpace(sqliteCipherKey))
        {
            options.AddInterceptors(new MemoLib.Api.Data.SqliteCipherInterceptor(sqliteCipherKey));
            Log.Information("🔒 Chiffrement SQLite activé (PRAGMA key)");
        }
    }

    // Enhanced logging in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
}, ServiceLifetime.Scoped);

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5078" };

var allowTunnelOrigins = builder.Configuration.GetValue<bool>("Cors:AllowTunnelOrigins");

if (builder.Environment.IsProduction() && !allowTunnelOrigins)
{
    corsOrigins = corsOrigins
        .Where(origin => Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            && uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
            && !uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            && !uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();

    if (corsOrigins.Length == 0)
    {
        throw new InvalidOperationException(
            "En production, Cors:AllowedOrigins doit contenir au moins une origine HTTPS explicite.");
    }
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (allowTunnelOrigins || builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(_ => true)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(corsOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    });
});

// Health checks with DB verification
builder.Services.AddHealthChecks()
    .AddDbContextCheck<MemoLibDbContext>("database", tags: new[] { "ready" });

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor
        | ForwardedHeaders.XForwardedProto
        | ForwardedHeaders.XForwardedHost;

    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();
var disableHttpsRedirection = builder.Configuration.GetValue<bool>("DisableHttpsRedirection");
var skipDatabaseInitialization = builder.Configuration.GetValue<bool>("SkipDatabaseInitialization");

if (!skipDatabaseInitialization)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();

    if (useSqlServer)
    {
        try { db.Database.Migrate(); }
        catch
        {
            Log.Warning("⚠️ Migrations échouées, création directe du schéma...");
            db.Database.EnsureCreated();
        }
        Log.Information("✅ Migrations SQL Server appliquées");
    }
    else
    {
        try { db.Database.Migrate(); }
        catch { db.Database.EnsureCreated(); }
        Log.Information("✅ Base SQLite prête");
    }

    if (app.Environment.IsDevelopment() && !db.Sources.Any())
    {
        var passwordService = scope.ServiceProvider.GetRequiredService<PasswordService>();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@memolib.local",
            Role = Roles.Owner,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);

        db.Sources.Add(new Source
        {
            Id = Guid.NewGuid(),
            Type = "email",
            UserId = user.Id
        });

        // Créer utilisateur avec mot de passe
        var userWithPassword = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@memolib.local",
            Password = passwordService.HashPassword("Admin123!"),
            Role = Roles.Owner,
            Name = "Admin",
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(userWithPassword);

        db.Sources.Add(new Source
        {
            Id = Guid.NewGuid(),
            Type = "email",
            UserId = userWithPassword.Id
        });

        db.SaveChanges();

        Log.Information("✅ Utilisateurs créés:");
        Log.Information("   - admin@memolib.local (sans mot de passe)");
        Log.Information("   - admin@memolib.local (mot de passe: Admin123!)");
    }

    // Seed questionnaires par défaut
    try
    {
        await QuestionnaireSeeder.SeedDefaultQuestionnaires(db);
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "⚠️ Seed questionnaires ignoré (tables potentiellement absentes)");
    }
}
else
{
    Log.Warning("⚠️ SkipDatabaseInitialization=true: DB bootstrap skipped");
}

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MemoLib API v1");
    c.RoutePrefix = "swagger";
});

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<ConnectionValidationMiddleware>();
app.UseMiddleware<CacheMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseForwardedHeaders();

if (!disableHttpsRedirection)
{
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }

    app.UseHttpsRedirection();
}

app.UseCors("FrontendPolicy");
app.UseSession();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

// Redirection racine vers demo.html
app.MapGet("/", () => Results.Redirect("/demo.html"));

app.MapGet("/api", () => Results.Ok(new { app = "MemoLib.Api", status = "ok", docs = "Utilisez les endpoints /api/*" }));
app.MapGet("/api/_routes", (IEnumerable<EndpointDataSource> endpointSources) =>
{
    var routes = endpointSources
        .SelectMany(source => source.Endpoints)
        .OfType<RouteEndpoint>()
        .Select(endpoint => endpoint.RoutePattern.RawText)
        .Where(route => !string.IsNullOrWhiteSpace(route))
        .Distinct()
        .OrderBy(route => route)
        .ToList();

    return Results.Ok(routes);
});
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false // Always healthy if app is running
});
app.MapPost("/api/system/stop", (HttpContext http, IHostApplicationLifetime lifetime) =>
{
    if (!app.Environment.IsDevelopment())
    {
        return Results.Forbid();
    }

    var remoteIp = http.Connection.RemoteIpAddress;
    var isLoopback = remoteIp is not null && System.Net.IPAddress.IsLoopback(remoteIp);

    if (!isLoopback)
    {
        return Results.StatusCode(StatusCodes.Status403Forbidden);
    }

    _ = Task.Run(async () =>
    {
        await Task.Delay(300);
        lifetime.StopApplication();
    });

    return Results.Ok(new { message = "Arrêt demandé" });
});

var pipeline = app.MapGroup("/api/pipeline").WithTags("Pipeline");

pipeline.MapPost("/analyze", async (
    AnalyzeEmailRequest request,
    ISemanticKernelService semanticKernelService,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.TenantId) ||
        string.IsNullOrWhiteSpace(request.EmailId) ||
        string.IsNullOrWhiteSpace(request.Subject))
    {
        return Results.BadRequest(new { error = "tenantId, emailId et subject sont requis" });
    }

    var combined = $"{request.Subject} {request.Body}".ToLowerInvariant();
    var fallbackCategory = combined.Contains("oqtf") ? "CONTENTIEUX_OQTF"
        : combined.Contains("naturalisation") ? "NATURALISATION"
        : combined.Contains("titre de séjour") || combined.Contains("titre de sejour") ? "TITRE_SEJOUR"
        : "GENERAL";

    var fallbackUrgency = combined.Contains("urgent") || combined.Contains("délai") || combined.Contains("delai")
        ? "high"
        : "medium";

    var category = fallbackCategory;
    var urgency = fallbackUrgency;
    var confidence = fallbackCategory == "GENERAL" ? 0.62m : 0.84m;
    List<string> suggestedActions = ["ouvrir_dossier", "assigner_reviewer"];
    string? summaryFromSK = null;

    if (await semanticKernelService.IsAvailableAsync(cancellationToken))
    {
        var skAnalysis = await semanticKernelService.AnalyzeEmailAsync(
            request.Subject,
            request.Body,
            cancellationToken);

        if (skAnalysis is not null)
        {
            category = string.IsNullOrWhiteSpace(skAnalysis.TypeDossier)
                ? fallbackCategory
                : skAnalysis.TypeDossier;
            urgency = string.IsNullOrWhiteSpace(skAnalysis.Urgency)
                ? fallbackUrgency
                : skAnalysis.Urgency;
            confidence = skAnalysis.Confidence <= 0 ? confidence : skAnalysis.Confidence;
            summaryFromSK = skAnalysis.Summary;

            if (skAnalysis.SuggestedActions.Count > 0)
            {
                suggestedActions = skAnalysis.SuggestedActions;
            }
        }
        else
        {
            logger.LogDebug("Semantic Kernel unavailable for analysis, using local fallback");
        }
    }

    var response = new AnalyzeEmailResponse
    {
        EmailId = request.EmailId,
        Category = category,
        Urgency = urgency,
        Confidence = confidence,
        Summary = !string.IsNullOrWhiteSpace(summaryFromSK)
            ? summaryFromSK
            : string.IsNullOrWhiteSpace(request.Body)
            ? request.Subject
            : request.Body.Length > 160 ? request.Body[..160] + "..." : request.Body,
        SuggestedActions = suggestedActions,
        RequiresHumanReview = true,
    };

    return Results.Ok(response);
});

pipeline.MapPost("/workflows/start", async (
    StartWorkflowRequest request,
    IPipelineWorkflowStore workflowStore,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.TenantId) || string.IsNullOrWhiteSpace(request.EmailId))
    {
        return Results.BadRequest(new { error = "tenantId et emailId sont requis" });
    }

    var execution = await workflowStore.StartExecutionAsync(
        request.TenantId,
        request.EmailId,
        request.WorkflowName,
        cancellationToken);

    return Results.Ok(new StartWorkflowResponse
    {
        ExecutionId = execution.ExecutionId,
        State = execution.State,
        StartedAtUtc = execution.StartedAtUtc,
    });
});

pipeline.MapPost("/reviews", async (
    ReviewDecisionRequest request,
    IPipelineWorkflowStore workflowStore,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.TenantId) ||
        string.IsNullOrWhiteSpace(request.ExecutionId) ||
        string.IsNullOrWhiteSpace(request.Decision) ||
        string.IsNullOrWhiteSpace(request.ReviewedByUserId))
    {
        return Results.BadRequest(new { error = "tenantId, executionId, decision et reviewedByUserId sont requis" });
    }

    var normalizedDecision = request.Decision.Trim().ToUpperInvariant();
    if (normalizedDecision is not ("APPROVE" or "REJECT"))
    {
        return Results.BadRequest(new { error = "decision doit être APPROVE ou REJECT" });
    }

    var result = await workflowStore.ApplyReviewAsync(
        request.TenantId,
        request.ExecutionId,
        normalizedDecision,
        request.ReviewedByUserId,
        request.Notes,
        cancellationToken);

    if (result is null)
    {
        return Results.NotFound(new { error = "execution introuvable" });
    }

    if (!result.Applied)
    {
        return Results.Conflict(new
        {
            error = "execution deja finalisee",
            reason = result.ConflictReason,
            currentState = result.NewState,
        });
    }

    return Results.Ok(new ReviewDecisionResponse
    {
        ExecutionId = result.ExecutionId,
        PreviousState = result.PreviousState,
        NewState = result.NewState,
        DossierUpdated = result.DossierUpdated,
        DossierId = result.DossierId,
    });
});

pipeline.MapGet("/workflows/{executionId}", async (
    string executionId,
    string tenantId,
    IPipelineWorkflowStore workflowStore,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(tenantId))
    {
        return Results.BadRequest(new { error = "tenantId est requis" });
    }

    var execution = await workflowStore.GetExecutionAsync(tenantId, executionId, cancellationToken);
    if (execution is null)
    {
        return Results.NotFound(new { error = "execution introuvable" });
    }

    var transitions = await workflowStore.GetTransitionsAsync(tenantId, executionId, cancellationToken);

    return Results.Ok(new WorkflowExecutionDetailsResponse
    {
        ExecutionId = execution.ExecutionId,
        TenantId = execution.TenantId,
        EmailId = execution.EmailId,
        WorkflowName = execution.WorkflowName,
        State = execution.State,
        StartedAtUtc = execution.StartedAtUtc,
        EndedAtUtc = execution.EndedAtUtc,
        DossierId = execution.RelatedCaseId,
        Transitions = transitions.Select(t => new WorkflowTransitionItem
        {
            TransitionId = t.TransitionId,
            FromState = t.FromState,
            ToState = t.ToState,
            Reason = t.Reason,
            ActorType = t.ActorType,
            ActorId = t.ActorId,
            Notes = t.Notes,
            CreatedAtUtc = t.CreatedAtUtc,
        }).ToList(),
    });
});

pipeline.MapGet("/workflows", async (
    string tenantId,
    int? limit,
    int? offset,
    IPipelineWorkflowStore workflowStore,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(tenantId))
    {
        return Results.BadRequest(new { error = "tenantId est requis" });
    }

    var take = limit.GetValueOrDefault(20);
    if (take <= 0)
    {
        take = 20;
    }
    if (take > 100)
    {
        take = 100;
    }

    var skip = offset.GetValueOrDefault(0);
    if (skip < 0)
    {
        skip = 0;
    }

    var executions = await workflowStore.ListExecutionsAsync(tenantId, take + 1, skip, cancellationToken);
    var hasMore = executions.Count > take;
    var page = hasMore ? executions.Take(take).ToList() : executions.ToList();

    return Results.Ok(new WorkflowExecutionListResponse
    {
        Count = page.Count,
        HasMore = hasMore,
        Items = page.Select(execution => new WorkflowExecutionSummaryItem
        {
            ExecutionId = execution.ExecutionId,
            EmailId = execution.EmailId,
            WorkflowName = execution.WorkflowName,
            State = execution.State,
            StartedAtUtc = execution.StartedAtUtc,
            EndedAtUtc = execution.EndedAtUtc,
            DossierId = execution.RelatedCaseId,
        }).ToList(),
    });
});

pipeline.MapGet("/metrics", async (
    string tenantId,
    int? days,
    IPipelineWorkflowStore workflowStore,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(tenantId))
    {
        return Results.BadRequest(new { error = "tenantId est requis" });
    }

    var metrics = await workflowStore.GetMetricsAsync(tenantId, days.GetValueOrDefault(30), cancellationToken);

    return Results.Ok(new PipelineMetricsResponse
    {
        TenantId = metrics.TenantId,
        Days = metrics.Days,
        WindowStartUtc = metrics.WindowStartUtc,
        TotalExecutions = metrics.TotalExecutions,
        PendingExecutions = metrics.PendingExecutions,
        ApprovedExecutions = metrics.ApprovedExecutions,
        RejectedExecutions = metrics.RejectedExecutions,
        ApprovalRate = metrics.ApprovalRate,
        AverageDecisionSeconds = metrics.AverageDecisionSeconds,
    });
});

pipeline.MapPost("/search", (SearchGlobalRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.TenantId) || string.IsNullOrWhiteSpace(request.Query))
    {
        return Results.BadRequest(new { error = "tenantId et query sont requis" });
    }

    var items = new List<SearchResultItem>
    {
        new()
        {
            SourceType = "email",
            SourceId = Guid.NewGuid().ToString("N"),
            Title = "Email: " + request.Query,
            Snippet = "Résultat simulé pour démarrer l'intégration search.",
            Score = 0.88m,
        },
        new()
        {
            SourceType = "dossier",
            SourceId = Guid.NewGuid().ToString("N"),
            Title = "Dossier lié à " + request.Query,
            Snippet = "Résultat simulé de dossier pour le tenant demandé.",
            Score = 0.79m,
        },
    };

    var limit = request.Limit <= 0 ? 20 : Math.Min(request.Limit, 100);
    var sliced = items.Take(limit).ToList();

    return Results.Ok(new SearchGlobalResponse
    {
        Items = sliced,
        Count = sliced.Count,
    });
});

app.MapControllers();
app.MapHub<MemoLib.Api.Hubs.NotificationHub>("/notificationHub");
app.MapHub<MemoLib.Api.Hubs.RealtimeHub>("/realtimeHub");

Log.Information("✅ MemoLib API démarrée avec succès!");
Log.Information("🌐 Interface: http://localhost:5078/demo.html");
Log.Information("🔌 API: http://localhost:5078/api");
Log.Information("❤️ Santé: http://localhost:5078/health");
Log.Information("📖 Swagger: http://localhost:5078/swagger");

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

public partial class Program { }


