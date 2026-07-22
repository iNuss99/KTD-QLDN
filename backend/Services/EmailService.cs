using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace techretail_api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        // Config keys expected in appsettings.json under "Email":
        //   SmtpHost, SmtpPort, FromAddress, FromName, Username, Password, EnableSsl
        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string fullName, string password)
        {
            var subject = "Chào mừng đến KTD – Thông tin tài khoản của bạn";
            var body = $@"
<div style=""font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;"">
  <h2 style=""color: #b45309;"">Chào mừng, {fullName}!</h2>
  <p>Tài khoản của bạn tại hệ thống <strong>KTD – Kingdom Trust Division</strong> đã được tạo thành công.</p>
  <p>Thông tin đăng nhập:</p>
  <ul>
    <li><strong>Email:</strong> {toEmail}</li>
    <li><strong>Mật khẩu tạm thời:</strong> <code style=""background:#fef3c7;padding:2px 8px;border-radius:4px;font-size:16px;"">{password}</code></li>
  </ul>
  <p style=""color:#ef4444;""><strong>Lưu ý:</strong> Mật khẩu này có hiệu lực trong 24 giờ. Vui lòng đăng nhập và đổi mật khẩu ngay.</p>
  <hr style=""margin: 20px 0;""/>
  <p style=""font-size: 12px; color: #94a3b8;"">Email này được gửi tự động từ hệ thống KTD. Không trả lời email này.</p>
</div>";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string newPassword)
        {
            var subject = "KTD – Mật khẩu của bạn đã được đặt lại";
            var body = $@"
<div style=""font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;"">
  <h2 style=""color: #b45309;"">Xin chào, {fullName}!</h2>
  <p>Mật khẩu tài khoản của bạn tại <strong>KTD</strong> vừa được đặt lại bởi quản trị viên.</p>
  <p><strong>Mật khẩu tạm thời mới:</strong> <code style=""background:#fef3c7;padding:2px 8px;border-radius:4px;font-size:16px;"">{newPassword}</code></p>
  <p style=""color:#ef4444;""><strong>Lưu ý:</strong> Mật khẩu này có hiệu lực trong 24 giờ. Vui lòng đăng nhập và đổi mật khẩu ngay.</p>
  <hr style=""margin: 20px 0;""/>
  <p style=""font-size: 12px; color: #94a3b8;"">Email này được gửi tự động từ hệ thống KTD. Không trả lời email này.</p>
</div>";

            await SendEmailAsync(toEmail, subject, body);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            var smtpHost = _config["Email:SmtpHost"];
            var fromAddress = _config["Email:FromAddress"];
            var username = _config["Email:Username"];
            var password = _config["Email:Password"];

            // If SMTP is not configured → log only (dev/demo mode)
            if (string.IsNullOrWhiteSpace(smtpHost) || string.IsNullOrWhiteSpace(fromAddress))
            {
                _logger.LogWarning("[EMAIL - NOT SENT - SMTP not configured]");
                _logger.LogWarning("  To:      {To}", toEmail);
                _logger.LogWarning("  Subject: {Subject}", subject);
                _logger.LogWarning("  Body snippet: {Snippet}", htmlBody.Replace("\n", " ").Substring(0, Math.Min(120, htmlBody.Length)));
                return;
            }

            int.TryParse(_config["Email:SmtpPort"], out int smtpPort);
            if (smtpPort == 0) smtpPort = 587;

            bool.TryParse(_config["Email:EnableSsl"], out bool enableSsl);
            if (!bool.TryParse(_config["Email:EnableSsl"], out _)) enableSsl = true;

            var fromName = _config["Email:FromName"] ?? "KTD System";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            try
            {
                using var client = new SmtpClient();
                var secureOption = enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
                await client.ConnectAsync(smtpHost, smtpPort, secureOption);

                if (!string.IsNullOrWhiteSpace(username))
                {
                    await client.AuthenticateAsync(username, password);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                _logger.LogInformation("[EMAIL SENT] To: {To} | Subject: {Subject}", toEmail, subject);
            }
            catch (Exception ex)
            {
                // Log but don't throw — email failure should not block user creation
                _logger.LogError(ex, "[EMAIL FAILED] To: {To} | Error: {Message}", toEmail, ex.Message);
            }
        }
    }
}
