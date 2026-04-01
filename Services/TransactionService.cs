using System.Data;
using MemoLib.Api.Data;

namespace MemoLib.Api.Services;

public class TransactionService
{
    private readonly MemoLibDbContext _context;

    public TransactionService(MemoLibDbContext context)
    {
        _context = context;
    }

    public async Task<TResult> ExecuteAsync<TResult>(
        Func<Task<TResult>> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var result = await operation();
            await transaction.CommitAsync();
            return result;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task ExecuteAsync(
        Func<Task> operation,
        IsolationLevel isolationLevel = IsolationLevel.ReadCommitted)
    {
        await ExecuteAsync(async () =>
        {
            await operation();
            return true;
        }, isolationLevel);
    }
}
