using DatabaseServices;
using DatabaseServices.Models;
using System.Data;

namespace BuilderRepositories.UserRepository;

public class UserRepository
{
    private readonly DatabaseService _dbService;

    public UserRepository(DatabaseService dbService)
    {
        _dbService = dbService;
    }

    public async Task CheckUserExistsAsync(string email, string username)
    {
        var usernameCheckSql = "SELECT username FROM users WHERE username = @username";
        var usernameCheckParams = new Dictionary<string, object>()
        {
            { "@username", username }
        };
        if (await _dbService.ExecuteScalarAsync(usernameCheckSql, usernameCheckParams).ConfigureAwait(false) != null)
            throw new GenericException("Username already exists");

        var emailCheckSql = "SELECT email FROM users WHERE email = @email";
        var emailCheckParams = new Dictionary<string, object>()
        {
            { "@email", email }
        };
        if (await _dbService.ExecuteScalarAsync(emailCheckSql, emailCheckParams).ConfigureAwait(false) != null)
            throw new GenericException("Email already exists");       
    }
    
    public async Task InsertUserAsync(User dto)
    {
        try
        {
            await _dbService.BeginTransactionAsync().ConfigureAwait(false);

            var userSql = "INSERT INTO users (username,email,password_hash, salt) VALUES@username,@email,@password_hash,@salt)";
            var userParams = new Dictionary<string, object>()
            {
                { "@username", dto.Username! },
                { "@email", dto.Email! },
                { "@password_hash", dto.PasswordHash! },
                { "@salt", dto.Salt! }
            };

            var userResult = await _dbService.ExecuteAsync(userSql, userParams).ConfigureAwait(false);

            var lastInsertedUserId = userResult.LastInsertedId;
            if (lastInsertedUserId <= 0)
            {
                await _dbService.RollbackAsync().ConfigureAwait(false);
                throw new GenericException("Failed to create user");
            }

            var settingsSql = "INSERT INTO settings (user_id) VALUES @userId)";
            var settingsParams = new Dictionary<string, object>()
            {
                { "@userId", lastInsertedUserId }
            };


            var settingsResult = await _dbService.ExecuteAsync(settingsSql, settingsParams);

            var lastInsertedSettingsId = settingsResult.LastInsertedId;
            if (lastInsertedSettingsId <= 0)
            {
                await _dbService.RollbackAsync().ConfigureAwait(false);
                throw new GenericException("Failed to create user");
            }

            await _dbService.CommitAsync().ConfigureAwait(false);
        } 
        catch
        {
            await _dbService.RollbackAsync().ConfigureAwait(false);
            throw;
        }
    }

    public async Task<User?> GetFullUserByEmailAsync(string email)
    {
        var sql = "SELECT * FROM users WHERE email = @email";
        var parameters = new Dictionary<string, object>()
        {
            { "@email", email }
        };

        return (await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false)).MapSingle(row => new User
        {
            Id = row.Field<int>("id"),
            Username = row.Field<string>("username"),
            Email = row.Field<string>("email"),
            PasswordHash = row.Field<string>("password_hash"),
            Salt = row.Field<string>("salt")
        });
    }

    public async Task<User?> GetFullUserByIdAsync(int id)
    {
        var sql = "SELECT * FROM users WHERE id = @id";
        var parameters = new Dictionary<string, object>()
        {
            { "@id", id }
        };

        return (await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false)).MapSingle(row => new User
        {
            Id = row.Field<int>("id"),
            Username = row.Field<string>("username"),
            Email = row.Field<string>("email"),
            PasswordHash = row.Field<string>("password_hash"),
            Salt = row.Field<string>("salt")
        });
    }
}
