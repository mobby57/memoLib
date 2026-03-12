using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace MemoLib.Api.Services.Integration;

public interface IDataValidationService
{
    Task<ValidationResult> ValidateEmailDataAsync(EmailMessage email);
    Task<ValidationResult> ValidateWebhookDataAsync(string source, string payload);
    Task<T> TransformDataAsync<T>(object input, string transformationRule) where T : class;
    Task<bool> SanitizeDataAsync<T>(T data) where T : class;
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class DataValidationService : IDataValidationService
{
    private readonly ILogger<DataValidationService> _logger;
    private readonly Dictionary<string, Func<string, bool>> _validators;

    public DataValidationService(ILogger<DataValidationService> logger)
    {
        _logger = logger;
        _validators = InitializeValidators();
    }

    public async Task<ValidationResult> ValidateEmailDataAsync(EmailMessage email)
    {
        var result = new ValidationResult { IsValid = true };

        // Email format validation
        if (!IsValidEmail(email.FromEmail))
        {
            result.Errors.Add($"Invalid sender email format: {email.FromEmail}");
            result.IsValid = false;
        }

        if (!IsValidEmail(email.ToEmail))
        {
            result.Errors.Add($"Invalid recipient email format: {email.ToEmail}");
            result.IsValid = false;
        }

        // Content validation
        if (string.IsNullOrWhiteSpace(email.Subject))
        {
            result.Warnings.Add("Email subject is empty");
        }

        if (string.IsNullOrWhiteSpace(email.Body))
        {
            result.Warnings.Add("Email body is empty");
        }

        // Security checks
        if (ContainsSuspiciousContent(email.Body))
        {
            result.Warnings.Add("Email contains potentially suspicious content");
            result.Metadata["suspiciousContent"] = true;
        }

        // Attachment validation
        foreach (var attachment in email.Attachments)
        {
            if (!IsAllowedFileType(attachment.FileName))
            {
                result.Errors.Add($"File type not allowed: {attachment.FileName}");
                result.IsValid = false;
            }

            if (attachment.Content.Length > 25 * 1024 * 1024) // 25MB limit
            {
                result.Errors.Add($"Attachment too large: {attachment.FileName}");
                result.IsValid = false;
            }
        }

        result.Metadata["validatedAt"] = DateTime.UtcNow;
        result.Metadata["attachmentCount"] = email.Attachments.Count;

        await Task.CompletedTask;
        return result;
    }

    public async Task<ValidationResult> ValidateWebhookDataAsync(string source, string payload)
    {
        var result = new ValidationResult { IsValid = true };

        // JSON validation
        try
        {
            JsonDocument.Parse(payload);
        }
        catch (JsonException ex)
        {
            result.Errors.Add($"Invalid JSON payload: {ex.Message}");
            result.IsValid = false;
            return result;
        }

        // Source-specific validation
        switch (source.ToLower())
        {
            case "docusign":
                result = await ValidateDocuSignWebhook(payload);
                break;
            case "gmail":
                result = await ValidateGmailWebhook(payload);
                break;
            case "payment":
                result = await ValidatePaymentWebhook(payload);
                break;
            default:
                result.Warnings.Add($"Unknown webhook source: {source}");
                break;
        }

        // Size validation
        if (payload.Length > 1024 * 1024) // 1MB limit
        {
            result.Errors.Add("Webhook payload too large");
            result.IsValid = false;
        }

        result.Metadata["source"] = source;
        result.Metadata["payloadSize"] = payload.Length;
        result.Metadata["validatedAt"] = DateTime.UtcNow;

        return result;
    }

    public async Task<T> TransformDataAsync<T>(object input, string transformationRule) where T : class
    {
        try
        {
            var inputJson = JsonSerializer.Serialize(input);
            var inputDoc = JsonDocument.Parse(inputJson);

            // Apply transformation rules (simplified implementation)
            var transformedData = ApplyTransformationRules(inputDoc, transformationRule);
            
            var result = JsonSerializer.Deserialize<T>(transformedData);
            return result ?? throw new InvalidOperationException("Transformation resulted in null");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Data transformation failed for rule: {Rule}", transformationRule);
            throw;
        }
    }

    public async Task<bool> SanitizeDataAsync<T>(T data) where T : class
    {
        try
        {
            var properties = typeof(T).GetProperties();
            
            foreach (var property in properties)
            {
                if (property.PropertyType == typeof(string))
                {
                    var value = property.GetValue(data) as string;
                    if (!string.IsNullOrEmpty(value))
                    {
                        var sanitized = SanitizeString(value);
                        property.SetValue(data, sanitized);
                    }
                }
            }

            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Data sanitization failed for type: {Type}", typeof(T).Name);
            return false;
        }
    }

    private Dictionary<string, Func<string, bool>> InitializeValidators()
    {
        return new Dictionary<string, Func<string, bool>>
        {
            ["email"] = IsValidEmail,
            ["phone"] = IsValidPhone,
            ["url"] = IsValidUrl,
            ["json"] = IsValidJson
        };
    }

    private bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        
        var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
        return emailRegex.IsMatch(email);
    }

    private bool IsValidPhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return false;
        
        var phoneRegex = new Regex(@"^\+?[\d\s\-\(\)]{10,}$");
        return phoneRegex.IsMatch(phone);
    }

    private bool IsValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out _);
    }

    private bool IsValidJson(string json)
    {
        try
        {
            JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private bool ContainsSuspiciousContent(string content)
    {
        var suspiciousPatterns = new[]
        {
            @"<script[^>]*>.*?</script>",
            @"javascript:",
            @"vbscript:",
            @"onload\s*=",
            @"onerror\s*="
        };

        return suspiciousPatterns.Any(pattern => 
            Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase));
    }

    private bool IsAllowedFileType(string fileName)
    {
        var allowedExtensions = new[] { ".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".zip" };
        var extension = Path.GetExtension(fileName).ToLower();
        return allowedExtensions.Contains(extension);
    }

    private string SanitizeString(string input)
    {
        // Remove potentially dangerous characters
        var sanitized = Regex.Replace(input, @"[<>""']", "");
        
        // Trim whitespace
        sanitized = sanitized.Trim();
        
        // Limit length
        if (sanitized.Length > 1000)
        {
            sanitized = sanitized.Substring(0, 1000);
        }

        return sanitized;
    }

    private string ApplyTransformationRules(JsonDocument input, string rule)
    {
        // Simplified transformation - in production, use a proper transformation engine
        switch (rule.ToLower())
        {
            case "normalize_email":
                return NormalizeEmailData(input);
            case "extract_legal_entities":
                return ExtractLegalEntities(input);
            default:
                return input.RootElement.GetRawText();
        }
    }

    private string NormalizeEmailData(JsonDocument input)
    {
        // Extract and normalize email data
        var root = input.RootElement;
        var normalized = new
        {
            from = root.TryGetProperty("from", out var from) ? from.GetString()?.ToLower() : "",
            to = root.TryGetProperty("to", out var to) ? to.GetString()?.ToLower() : "",
            subject = root.TryGetProperty("subject", out var subject) ? subject.GetString()?.Trim() : "",
            body = root.TryGetProperty("body", out var body) ? body.GetString()?.Trim() : "",
            receivedAt = DateTime.UtcNow
        };

        return JsonSerializer.Serialize(normalized);
    }

    private string ExtractLegalEntities(JsonDocument input)
    {
        // Extract legal entities from text content
        var content = input.RootElement.GetRawText();
        
        var entities = new
        {
            companies = ExtractCompanyNames(content),
            persons = ExtractPersonNames(content),
            dates = ExtractDates(content),
            amounts = ExtractAmounts(content)
        };

        return JsonSerializer.Serialize(entities);
    }

    private async Task<ValidationResult> ValidateDocuSignWebhook(string payload)
    {
        var result = new ValidationResult { IsValid = true };
        
        try
        {
            var doc = JsonDocument.Parse(payload);
            
            if (!doc.RootElement.TryGetProperty("event", out _))
            {
                result.Errors.Add("Missing 'event' property in DocuSign webhook");
                result.IsValid = false;
            }

            if (!doc.RootElement.TryGetProperty("data", out _))
            {
                result.Errors.Add("Missing 'data' property in DocuSign webhook");
                result.IsValid = false;
            }
        }
        catch (Exception ex)
        {
            result.Errors.Add($"DocuSign webhook validation failed: {ex.Message}");
            result.IsValid = false;
        }

        await Task.CompletedTask;
        return result;
    }

    private async Task<ValidationResult> ValidateGmailWebhook(string payload)
    {
        var result = new ValidationResult { IsValid = true };
        
        try
        {
            var doc = JsonDocument.Parse(payload);
            
            if (!doc.RootElement.TryGetProperty("message", out _))
            {
                result.Errors.Add("Missing 'message' property in Gmail webhook");
                result.IsValid = false;
            }
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Gmail webhook validation failed: {ex.Message}");
            result.IsValid = false;
        }

        await Task.CompletedTask;
        return result;
    }

    private async Task<ValidationResult> ValidatePaymentWebhook(string payload)
    {
        var result = new ValidationResult { IsValid = true };
        
        try
        {
            var doc = JsonDocument.Parse(payload);
            
            if (!doc.RootElement.TryGetProperty("amount", out _))
            {
                result.Errors.Add("Missing 'amount' property in payment webhook");
                result.IsValid = false;
            }

            if (!doc.RootElement.TryGetProperty("status", out _))
            {
                result.Errors.Add("Missing 'status' property in payment webhook");
                result.IsValid = false;
            }
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Payment webhook validation failed: {ex.Message}");
            result.IsValid = false;
        }

        await Task.CompletedTask;
        return result;
    }

    private List<string> ExtractCompanyNames(string content)
    {
        var companyRegex = new Regex(@"\b[A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|SA|SARL)\b");
        return companyRegex.Matches(content).Select(m => m.Value).Distinct().ToList();
    }

    private List<string> ExtractPersonNames(string content)
    {
        var nameRegex = new Regex(@"\b[A-Z][a-z]+\s+[A-Z][a-z]+\b");
        return nameRegex.Matches(content).Select(m => m.Value).Distinct().ToList();
    }

    private List<string> ExtractDates(string content)
    {
        var dateRegex = new Regex(@"\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b");
        return dateRegex.Matches(content).Select(m => m.Value).Distinct().ToList();
    }

    private List<string> ExtractAmounts(string content)
    {
        var amountRegex = new Regex(@"\b\d+[,.]?\d*\s*(?:€|EUR|$|USD)\b");
        return amountRegex.Matches(content).Select(m => m.Value).Distinct().ToList();
    }
}