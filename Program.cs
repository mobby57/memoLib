using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Middleware;
using MemoLib.Api.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configuration Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
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
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddMemoryCache();
builder.Services.AddDistributedMemoryCache();
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
builder.Services.AddScoped<WebhookService>();
builder.Services.AddScoped<AdvancedTemplateService>();
builder.Services.AddScoped<SignatureService>();
builder.Services.AddScoped<DynamicFormService>();
builder.Services.AddHttpClient();
builder.Services.AddSignalR();
builder.Services.AddHostedService<EmailMonitorService>();
builder.Services.AddDbContext<MemoLibDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5078" };

if (builder.Environment.IsProduction())
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
        policy.WithOrigins(corsOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

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

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();

    try
    {
        db.Database.Migrate();
    }
    catch (InvalidOperationException ex) when (ex.Message.Contains("PendingModelChangesWarning"))
    {
        Console.WriteLine("⚠️ Migrations en attente détectées. Démarrage poursuivi en mode développement sans application auto des migrations.");
    }

    if (app.Environment.IsDevelopment() && !db.Sources.Any())
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@memolib.local",
            Role = Roles.Owner,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);

        db.Sources.Add(new Source
        {
            Id = Guid.NewGuid(),
            Type = "email",
            UserId = user.Id
        });

        db.SaveChanges();
    }

    // Seed questionnaires par défaut
    await QuestionnaireSeeder.SeedDefaultQuestionnaires(db);
}

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();
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
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
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
app.MapControllers();
app.MapHub<MemoLib.Api.Hubs.NotificationHub>("/notificationHub");
app.MapHub<MemoLib.Api.Hubs.RealtimeHub>("/realtimeHub");

Log.Information("✅ MemoLib API démarrée avec succès!");
Log.Information("🌐 Interface: http://localhost:5078/demo.html");
Log.Information("🔌 API: http://localhost:5078/api");
Log.Information("❤️ Santé: http://localhost:5078/health");

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


