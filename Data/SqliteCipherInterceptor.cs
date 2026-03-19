using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace MemoLib.Api.Data;

public class SqliteCipherInterceptor : DbConnectionInterceptor
{
    private readonly string _key;

    public SqliteCipherInterceptor(string key) => _key = key;

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        using var cmd = connection.CreateCommand();
        cmd.CommandText = $"PRAGMA key = '{_key.Replace("'", "''")}';";
        cmd.ExecuteNonQuery();
    }

    public override async Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData, CancellationToken cancellationToken = default)
    {
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = $"PRAGMA key = '{_key.Replace("'", "''")}';";
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
