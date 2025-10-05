using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace DatabaseServices;

public class DatabaseSettingsConfiguration : IConfigureOptions<DatabaseSettings>
{
    private readonly IConfiguration _config;

    public DatabaseSettingsConfiguration(IConfiguration config)
    {
        _config = config;
    }

    public void Configure(DatabaseSettings settings)
    {
        settings.ConnectionString = _config["DatabaseSettings:ConnectionString"]
            ?? throw new Exception("Invalid database credentials");
    }
}
