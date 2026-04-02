using Microsoft.AspNetCore.Http;

namespace MemoLib.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Protection contre le clickjacking
        context.Response.Headers["X-Frame-Options"] = "DENY";
        
        // Protection contre le MIME sniffing
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        
        // Protection XSS
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        
        // Référer policy pour éviter les fuites d'informations
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        
        // Content Security Policy strict
        var csp = "default-src 'self'; " +
                  "script-src 'self' 'unsafe-inline'; " +
                  "style-src 'self' 'unsafe-inline'; " +
                  "img-src 'self' data:; " +
                  "font-src 'self'; " +
                  "connect-src 'self'; " +
                  "frame-ancestors 'none'; " +
                  "base-uri 'self'; " +
                  "form-action 'self'";
        context.Response.Headers["Content-Security-Policy"] = csp;
        
        // HTTPS strict transport security (si HTTPS)
        if (context.Request.IsHttps)
        {
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }
        
        // Permissions policy
        context.Response.Headers["Permissions-Policy"] =
            "geolocation=(), microphone=(), camera=(), payment=(), usb=()";

        await _next(context);
    }
}