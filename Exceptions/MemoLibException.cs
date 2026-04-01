namespace MemoLib.Api.Exceptions;

public abstract class MemoLibException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }

    protected MemoLibException(string message, int statusCode, string errorCode) 
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}

public class NotFoundException : MemoLibException
{
    public NotFoundException(string resource) 
        : base($"{resource} not found", 404, "NOT_FOUND") { }
}

public class UnauthorizedException : MemoLibException
{
    public UnauthorizedException(string message = "Unauthorized") 
        : base(message, 401, "UNAUTHORIZED") { }
}

public class ForbiddenException : MemoLibException
{
    public ForbiddenException(string message = "Access denied") 
        : base(message, 403, "FORBIDDEN") { }
}

public class ValidationException : MemoLibException
{
    public Dictionary<string, string[]> Errors { get; }

    public ValidationException(Dictionary<string, string[]> errors) 
        : base("Validation failed", 400, "VALIDATION_ERROR")
    {
        Errors = errors;
    }
}

public class DuplicateException : MemoLibException
{
    public DuplicateException(string resource) 
        : base($"{resource} already exists", 409, "DUPLICATE") { }
}
