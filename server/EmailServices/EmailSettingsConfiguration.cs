using EmailServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace EmailServices;

public class EmailSettingsConfiguration : IConfigureOptions<EmailSettings>
{
    private readonly IConfiguration _config;

	public EmailSettingsConfiguration(IConfiguration config)
    {
        _config = config;
    }

    public void Configure(EmailSettings settings)
    {
        settings.Email = _config["EmailSettings:SendEmail"] ?? string.Empty;
        settings.Password = _config["EmailSettings:Password"] ?? string.Empty; ;
    }
}
