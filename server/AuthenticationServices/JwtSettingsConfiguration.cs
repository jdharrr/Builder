using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace AuthenticationServices;

public class JwtSettingsConfiguration : IConfigureOptions<JwtSettings>
{
	private readonly IConfiguration _config;

	public JwtSettingsConfiguration(IConfiguration config)
	{
		_config = config;
	}

	public void Configure(JwtSettings settings)
	{
		settings.Secret = _config["JwtSettings:Secret"]!;
		settings.Issuer = _config["JwtSettings:Issuer"]!;
		settings.Audience = _config["JwtSettings:Audience"]!;
		settings.AccessExpiryMinutes = _config["JwtSettings:AccessExpiryMinutes"]!;
		settings.PasswordResetExpiryMinutes = _config["JwtSettings:PasswordResetExpiryMinutes"]!;
	}
}