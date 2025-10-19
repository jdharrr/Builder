using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace AuthenticationServices;

public class JwtBearerSettings : IConfigureNamedOptions<JwtBearerOptions>
{
    private readonly JwtSettings _settings;

	public JwtBearerSettings(IOptions<JwtSettings> settings)
	{
        _settings = settings.Value;
	}

    public void Configure(JwtBearerOptions options)
    {

    }

    public void Configure(string? name, JwtBearerOptions options)
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _settings.Issuer,
            ValidAudience = _settings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(_settings.Secret))
        };
    }

}