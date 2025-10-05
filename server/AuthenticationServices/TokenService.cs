using DatabaseServices;
using DatabaseServices.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthenticationServices;

public class TokenService
{
	private readonly string _secret;

	private readonly string _issuer;

	private readonly string _audience;

	private readonly int _accessExpiryMinutes;

    private readonly int _passwordResetExpiryMinutes;

	public TokenService(IOptions<JwtSettings> settings)
    {
		_secret = settings.Value.Secret;
		_issuer = settings.Value.Issuer;
		_audience = settings.Value.Audience;
		_accessExpiryMinutes = int.Parse(settings.Value.AccessExpiryMinutes);
        _passwordResetExpiryMinutes = int.Parse(settings.Value.PasswordResetExpiryMinutes);
    }

    public string GenerateAccessToken(int userId)
    {
        var securityKey = new SymmetricSecurityKey(Convert.FromBase64String(_secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_accessExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GeneratePasswordResetToken(string userId, string userEmail)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, userEmail)
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_passwordResetExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
