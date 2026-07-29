namespace techretail_api.Services
{
    public interface IEmailService
    {
        Task SendWelcomeEmailAsync(string toEmail, string fullName, string password);
        Task SendPasswordResetEmailAsync(string toEmail, string fullName, string newPassword);
    }
}
