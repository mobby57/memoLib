using IaPosteManager.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuration Redis Cloud
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") 
    ?? Environment.GetEnvironmentVariable("REDIS_CONNECTION_STRING");
var prometheusEndpoint = Environment.GetEnvironmentVariable("REDIS_PROMETHEUS_ENDPOINT");

// Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton(new RedisCloudService(redisConnectionString, prometheusEndpoint));

// CORS pour développement
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

// Route de test
app.MapGet("/", () => new
{
    name = "IA Poste Manager - Edition Avocat",
    version = "3.1.0-csharp",
    technology = "ASP.NET Core + Redis Cloud",
    features = new[] { "IA CESEDA", "Cache Redis", "Monitoring Prometheus" }
});

app.Run();