using DatabaseServices;
using DatabaseServices.Models;
using DatabaseServices.Repsonses;
using MySql.Data.MySqlClient;
using System.Data;

namespace BuilderRepositories;

public class UserRepository
{
    private readonly DatabaseService _dbService;

    public UserRepository(DatabaseService dbService)
    {
        _dbService = dbService;
    }
    
    public async Task InsertUserAsync(UserDto dto)
    {  
        await _dbService.BeginTransactionAsync().ConfigureAwait(false);

        var userSql = "INSERT INTO users (username,email,password_hash, salt) VALUES (@username,@email,@password_hash,@salt)";
        var userParams = new Dictionary<string, object?>()
        {
            { "@username", dto.Username! },
            { "@email", dto.Email! },
            { "@password_hash", dto.PasswordHash! },
            { "@salt", dto.Salt! }
        };

        var userResult = new ExecuteResponse();
        try
        {
            userResult = await _dbService.ExecuteAsync(userSql, userParams).ConfigureAwait(false);
        }
        catch (MySqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
        {
            await _dbService.RollbackAsync().ConfigureAwait(false);

            if (ex.Message.Contains("email"))
                throw new GenericException("Email already in use");
            if (ex.Message.Contains("username"))
                throw new GenericException("Username already in use");

            throw;
        }

        var lastInsertedUserId = userResult.LastInsertedId;
        if (lastInsertedUserId <= 0)
        {
            await _dbService.RollbackAsync().ConfigureAwait(false);
            throw new GenericException("Failed to create user");
        }

        var settingsSql = "INSERT INTO user_settings (user_id) VALUES (@userId)";
        var settingsParams = new Dictionary<string, object?>()
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

    public async Task<UserDto?> GetFullUserByEmailAsync(string email)
    {
        var sql = "SELECT * FROM users WHERE email = @email";
        var parameters = new Dictionary<string, object?>()
        {
            { "@email", email }
        };

        return (await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false)).MapSingle(row => new UserDto
        {
            Id = row.Field<int>("id"),
            Username = row.Field<string>("username"),
            Email = row.Field<string>("email"),
            PasswordHash = row.Field<string>("password_hash"),
            Salt = row.Field<string>("salt")
        });
    }

    public async Task<UserDto?> GetFullUserByIdAsync(int id)
    {
        var sql = "SELECT * FROM users WHERE id = @id";
        var parameters = new Dictionary<string, object?>()
        {
            { "@id", id }
        };

        return (await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false)).MapSingle(row => new UserDto
        {
            Id = row.Field<int>("id"),
            Username = row.Field<string>("username"),
            Email = row.Field<string>("email"),
            PasswordHash = row.Field<string>("password_hash"),
            Salt = row.Field<string>("salt")
        });
    }

    public async Task<UserDto?> GetLimitedUserByIdAsync(int userId)
    {
        var sql = @"SELECT u.*, us.dark_mode
                    FROM users u
                    LEFT JOIN user_settings us ON u.id = us.user_id
                    WHERE u.id = @userId
                  ";
        var parameters = new Dictionary<string, object?>()
        {
            { "@userId", userId }
        };

        var dataTable = await _dbService.QueryAsync(sql, parameters).ConfigureAwait(false);

        return dataTable.MapSingle(row => new UserDto
        {
            Id = userId,
            Username = row.Field<string>("username"),
            Email = row.Field<string>("email"),
            Settings = new UserSettingsDto() { DarkMode = row.Field<bool>("dark_mode") },
            CreatedAt = row.Field<DateTime>("created_at").ToString("yyyy-MM-dd"),
            UpdatedAt = row.Field<DateTime>("updated_at").ToString("yyyy-MM-dd")
        });
    }
}
