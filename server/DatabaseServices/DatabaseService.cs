using DatabaseServices.Repsonses;
using Microsoft.Extensions.Options;
using MySql.Data.MySqlClient;
using System.Data;

namespace DatabaseServices;

public class DatabaseService : IDisposable
{
    private readonly MySqlConnection _connection;
    private MySqlTransaction? _transaction;

    public DatabaseService(IOptions<DatabaseSettings> settings)
    {
        _connection = new MySqlConnection(settings.Value.ConnectionString);
        _connection.Open();
    }

    void IDisposable.Dispose()
    {
        _transaction?.Dispose();
        _connection.Dispose();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _connection.BeginTransactionAsync().ConfigureAwait(false);
    }

    public async Task CommitAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync().ConfigureAwait(false);
            _transaction = null;
        }
    }

    public async Task RollbackAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync().ConfigureAwait(false);
            _transaction = null;
        }
    }

    public async Task<ExecuteResponse> ExecuteAsync(string sql, Dictionary<string, object>? parameters = null)
    {
        using var cmd = new MySqlCommand(sql, _connection, _transaction);
        if (parameters != null)
            AddParameters(cmd, parameters);

        var result = await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);

        return new ExecuteResponse {
            RowsAffected = result,
            LastInsertedId = cmd.LastInsertedId
        };
    }

    public async Task<object?> ExecuteScalarAsync(string sql, Dictionary<string, object>? parameters = null)
    {
        using var cmd = new MySqlCommand(sql, _connection, _transaction);
        if (parameters != null)
            AddParameters(cmd, parameters);

        return await cmd.ExecuteScalarAsync().ConfigureAwait(false);
    }

    public async Task<DataTable> QueryAsync(string sql, Dictionary<string, object>? parameters = null)
    {
        using var cmd = new MySqlCommand(sql, _connection, _transaction);
        if (parameters != null)
            AddParameters(cmd, parameters);

        using var reader = await cmd.ExecuteReaderAsync().ConfigureAwait(false);
        var table = new DataTable();
        table.Load(reader);

        return table;
    }

    private void AddParameters(MySqlCommand cmd, Dictionary<string, object> parameters)
    {
        foreach (var param in parameters)
        {
            cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
        }
    }
}
