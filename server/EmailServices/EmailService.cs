using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace EmailServices;

public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendPasswordResetEmail(string userEmail, string resetToken)
    {
        var resetLink = $"https://proud-grass-047c1c410.6.azurestaticapps.net/reset_Password?token={resetToken}";

        var smtpClient = new SmtpClient("smtp.gmail.com")
        {
            Port = 587,
            Credentials = new NetworkCredential(_settings.Email, _settings.Password),
            EnableSsl = true,
        };

        var message = new MailMessage
        {
            From = new MailAddress(_settings.Email, "NutriQuest"),
            Subject = "Reset Your Password",
            Body = $"<p>Click <a href='{resetLink}'>here</a> to reset your password.</p>",
            IsBodyHtml = true
        };

        message.To.Add(userEmail);

        await smtpClient.SendMailAsync(message).ConfigureAwait(false);
    }
}
