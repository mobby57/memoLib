namespace MemoLib.Api.Services;

public class Result<T>
{
    public bool Success { get; }
    public T? Data { get; }
    public string? ErrorMessage { get; }
    public string? ErrorCode { get; }

    private Result(bool success, T? data, string? errorMessage, string? errorCode)
    {
        Success = success;
        Data = data;
        ErrorMessage = errorMessage;
        ErrorCode = errorCode;
    }

    public static Result<T> Ok(T data) => new(true, data, null, null);
    public static Result<T> Fail(string errorMessage, string errorCode = "ERROR") => new(false, default, errorMessage, errorCode);
}

public class Result
{
    public bool Success { get; }
    public string? ErrorMessage { get; }
    public string? ErrorCode { get; }

    private Result(bool success, string? errorMessage, string? errorCode)
    {
        Success = success;
        ErrorMessage = errorMessage;
        ErrorCode = errorCode;
    }

    public static Result Ok() => new(true, null, null);
    public static Result Fail(string errorMessage, string errorCode = "ERROR") => new(false, errorMessage, errorCode);
}
