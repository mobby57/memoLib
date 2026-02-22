using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using MemoLib.Api.Services;
using MemoLib.Api.Middleware;
using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddScoped<EmbeddingService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<ClientInfoExtractor>();
builder.Services.AddHostedService<EmailMonitorService>();
builder.Services.AddDbContext<MemoLibDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5078" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
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
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

if (!disableHttpsRedirection)
{
    app.UseHttpsRedirection();
}

app.UseCors("FrontendPolicy");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/api", () => Results.Ok(new { app = "MemoLib.Api", status = "ok", docs = "Utilisez les endpoints /api/*" }));
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

app.Run();

