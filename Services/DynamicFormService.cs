using System.Text.RegularExpressions;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class DynamicFormService
{
    private readonly MemoLibDbContext _context;

    public DynamicFormService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<DynamicForm> CreateForm(Guid userId, string name, string description, List<FormField> fields, bool isPublic)
    {
        var form = new DynamicForm
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name,
            Description = description,
            Fields = fields,
            IsPublic = isPublic,
            PublicUrl = isPublic ? $"/public/forms/{Guid.NewGuid():N}" : null
        };

        _context.DynamicForms.Add(form);
        await _context.SaveChangesAsync();

        return form;
    }

    public Task<(bool IsValid, List<string> Errors)> ValidateSubmission(DynamicForm form, Dictionary<string, object> data)
    {
        var errors = new List<string>();

        foreach (var field in form.Fields)
        {
            // Check required
            if (field.IsRequired && (!data.ContainsKey(field.Name) || string.IsNullOrWhiteSpace(data[field.Name]?.ToString())))
            {
                errors.Add($"{field.Label} is required");
                continue;
            }

            if (!data.ContainsKey(field.Name)) continue;

            var value = data[field.Name]?.ToString() ?? "";

            // Validate based on type
            if (field.Type == FieldType.EMAIL && !IsValidEmail(value))
                errors.Add($"{field.Label} must be a valid email");

            if (field.Type == FieldType.PHONE && !IsValidPhone(value))
                errors.Add($"{field.Label} must be a valid phone number");

            // Custom validation
            if (field.Validation != null)
            {
                if (field.Validation.MinLength.HasValue && value.Length < field.Validation.MinLength)
                    errors.Add($"{field.Label} must be at least {field.Validation.MinLength} characters");

                if (field.Validation.MaxLength.HasValue && value.Length > field.Validation.MaxLength)
                    errors.Add($"{field.Label} must be at most {field.Validation.MaxLength} characters");

                if (!string.IsNullOrEmpty(field.Validation.Pattern) && !Regex.IsMatch(value, field.Validation.Pattern))
                    errors.Add(field.Validation.CustomMessage ?? $"{field.Label} format is invalid");
            }
        }

        return Task.FromResult((errors.Count == 0, errors));
    }

    public async Task<FormSubmission> SubmitForm(Guid formId, Dictionary<string, object> data, Guid? userId, string? email, string? name, string? ipAddress)
    {
        var submission = new FormSubmission
        {
            Id = Guid.NewGuid(),
            FormId = formId,
            UserId = userId,
            Data = data,
            SubmitterEmail = email ?? string.Empty,
            SubmitterName = name ?? string.Empty,
            IpAddress = ipAddress
        };

        _context.FormSubmissions.Add(submission);
        await _context.SaveChangesAsync();

        return submission;
    }

    private bool IsValidEmail(string email) => 
        Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");

    private bool IsValidPhone(string phone) => 
        Regex.IsMatch(phone, @"^[\d\s\+\-\(\)]+$");
}
