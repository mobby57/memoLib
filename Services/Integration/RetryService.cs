namespace MemoLib.Api.Services.Integration;

public interface IRetryService
{
    Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, RetryPolicy policy);
    Task ExecuteWithRetryAsync(Func<Task> operation, RetryPolicy policy);
}

public class RetryPolicy
{
    public int MaxAttempts { get; set; } = 3;
    public TimeSpan InitialDelay { get; set; } = TimeSpan.FromSeconds(1);
    public TimeSpan MaxDelay { get; set; } = TimeSpan.FromMinutes(1);
    public double BackoffMultiplier { get; set; } = 2.0;
    public Func<Exception, bool> ShouldRetry { get; set; } = ex => true;
}

public class CircuitBreakerState
{
    public CircuitState State { get; set; } = CircuitState.Closed;
    public int FailureCount { get; set; }
    public DateTime LastFailureTime { get; set; }
    public DateTime NextAttemptTime { get; set; }
}

public enum CircuitState
{
    Closed,
    Open,
    HalfOpen
}

public class RetryService : IRetryService
{
    private readonly ILogger<RetryService> _logger;
    private readonly Dictionary<string, CircuitBreakerState> _circuitStates = new();
    private readonly int _failureThreshold = 5;
    private readonly TimeSpan _timeout = TimeSpan.FromMinutes(1);

    public RetryService(ILogger<RetryService> logger)
    {
        _logger = logger;
    }

    public async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, RetryPolicy policy)
    {
        var operationKey = operation.Method.Name;
        
        if (!CanExecute(operationKey))
        {
            throw new InvalidOperationException("Circuit breaker is open");
        }

        Exception lastException = null!;
        var delay = policy.InitialDelay;

        for (int attempt = 1; attempt <= policy.MaxAttempts; attempt++)
        {
            try
            {
                var result = await operation();
                OnSuccess(operationKey);
                return result;
            }
            catch (Exception ex) when (policy.ShouldRetry(ex))
            {
                lastException = ex;
                OnFailure(operationKey, ex);

                _logger.LogWarning("Attempt {Attempt}/{MaxAttempts} failed: {Error}", 
                    attempt, policy.MaxAttempts, ex.Message);

                if (attempt < policy.MaxAttempts)
                {
                    await Task.Delay(delay);
                    delay = TimeSpan.FromMilliseconds(Math.Min(
                        delay.TotalMilliseconds * policy.BackoffMultiplier,
                        policy.MaxDelay.TotalMilliseconds));
                }
            }
        }

        throw new InvalidOperationException($"Operation failed after {policy.MaxAttempts} attempts", lastException);
    }

    public async Task ExecuteWithRetryAsync(Func<Task> operation, RetryPolicy policy)
    {
        await ExecuteWithRetryAsync(async () =>
        {
            await operation();
            return true;
        }, policy);
    }

    private bool CanExecute(string operationKey)
    {
        if (!_circuitStates.TryGetValue(operationKey, out var state))
        {
            _circuitStates[operationKey] = new CircuitBreakerState();
            return true;
        }

        var now = DateTime.UtcNow;

        return state.State switch
        {
            CircuitState.Closed => true,
            CircuitState.Open when now >= state.NextAttemptTime => 
                UpdateStateToHalfOpen(state, now),
            CircuitState.Open => false,
            CircuitState.HalfOpen => true,
            _ => true
        };
    }

    private bool UpdateStateToHalfOpen(CircuitBreakerState state, DateTime now)
    {
        state.State = CircuitState.HalfOpen;
        _logger.LogInformation("Circuit breaker transitioning to half-open");
        return true;
    }

    private void OnSuccess(string operationKey)
    {
        if (_circuitStates.TryGetValue(operationKey, out var state))
        {
            state.FailureCount = 0;
            if (state.State == CircuitState.HalfOpen)
            {
                state.State = CircuitState.Closed;
                _logger.LogInformation("Circuit breaker closed after successful operation");
            }
        }
    }

    private void OnFailure(string operationKey, Exception ex)
    {
        var state = _circuitStates.GetValueOrDefault(operationKey) ?? new CircuitBreakerState();
        _circuitStates[operationKey] = state;

        state.FailureCount++;
        state.LastFailureTime = DateTime.UtcNow;

        if (state.FailureCount >= _failureThreshold)
        {
            state.State = CircuitState.Open;
            state.NextAttemptTime = DateTime.UtcNow.Add(_timeout);
            _logger.LogWarning("Circuit breaker opened after {FailureCount} failures", state.FailureCount);
        }
    }
}