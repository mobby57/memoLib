using FluentValidation;
using MemoLib.Api.Contracts;

namespace MemoLib.Api.Validators;

public class IngestEmailRequestValidator : AbstractValidator<IngestEmailRequest>
{
    public IngestEmailRequestValidator()
    {
        RuleFor(x => x.ExternalId)
            .NotEmpty().WithMessage("ExternalId is required")
            .MaximumLength(500);

        RuleFor(x => x.From)
            .NotEmpty().WithMessage("From is required")
            .EmailAddress().WithMessage("From must be a valid email")
            .MaximumLength(254);

        RuleFor(x => x.Subject)
            .NotEmpty().WithMessage("Subject is required")
            .MaximumLength(500);

        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Body is required")
            .MaximumLength(100_000);

        RuleFor(x => x.OccurredAt)
            .NotEmpty().WithMessage("OccurredAt is required")
            .LessThanOrEqualTo(DateTime.UtcNow.AddMinutes(5))
            .WithMessage("OccurredAt cannot be in the future");
    }
}

public class SearchEventsRequestValidator : AbstractValidator<SearchEventsRequest>
{
    public SearchEventsRequestValidator()
    {
        RuleFor(x => x.Text)
            .MaximumLength(200).When(x => x.Text != null);

        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 500).When(x => x.Limit.HasValue);

        RuleFor(x => x.To)
            .GreaterThan(x => x.From)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithMessage("To must be after From");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(254);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(1)
            .MaximumLength(100);
    }
}

public class RegisterRequestFluentValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestFluentValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(254);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .MaximumLength(100)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain a digit");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100);

        RuleFor(x => x.Phone)
            .MaximumLength(20).When(x => x.Phone != null);

        RuleFor(x => x.FirmName)
            .MaximumLength(200).When(x => x.FirmName != null);
    }
}
