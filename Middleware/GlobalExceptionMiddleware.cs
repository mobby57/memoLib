using System.Net;
using System.Text.Json;
using MemoLib.Api.Exceptions;

namespace MemoLib.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = Guid.NewGuid().ToString();
        context.Response.Headers.Append("X-Correlation-ID", correlationId);

        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{CorrelationId}] Unhandled exception: {Message}", correlationId, ex.Message);
            await HandleExceptionAsync(context, ex, correlationId);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception, string correlationId)
    {
        context.Response.ContentType = "application/json";

        object response;
        int statusCode;

        switch (exception)
        {
            case MemoLibException memoEx:
                statusCode = memoEx.StatusCode;
                response = new
                {
                    errorCode = memoEx.ErrorCode,
                    message = memoEx.Message,
                    correlationId,
                    errors = (memoEx as ValidationException)?.Errors
                };
                break;

            case UnauthorizedAccessException:
                statusCode = (int)HttpStatusCode.Unauthorized;
                response = new
                {
                    errorCode = "UNAUTHORIZED",
                    message = "Unauthorized access",
                    correlationId
                };
                break;

            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                response = new
                {
                    errorCode = "INTERNAL_ERROR",
                    message = "An error occurred processing your request.",
                    correlationId,
                    detail = _env.IsDevelopment() ? exception.Message : null,
                    stackTrace = _env.IsDevelopment() ? exception.StackTrace : null
                };
                break;
        }

        context.Response.StatusCode = statusCode;
        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
