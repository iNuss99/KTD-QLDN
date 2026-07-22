using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace techretail_api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;
        private static readonly HttpClient _httpClient = new HttpClient();

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
            // Note: We are using the "Password" config field to store the Brevo API Key
            var apiKey = _config["Email:Password"]; 
            var fromAddress = _config["Email:FromAddress"];
            var fromName = _config["Email:FromName"] ?? "KTD System";

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromAddress))
            {
                _logger.LogWarning("[EMAIL - NOT SENT - API Key not configured]");
                return;
            }

            try
            {
                var payload = new
                {
                    sender = new { name = fromName, email = fromAddress },
                    to = new[] { new { email = toEmail } },
                    subject = subject,
                    htmlContent = htmlBody
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
                request.Headers.Add("api-key", apiKey);
                request.Headers.Add("accept", "application/json");
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("[EMAIL SENT] To: {To} | Subject: {Subject}", toEmail, subject);
                }
                else
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    _logger.LogError("[EMAIL FAILED] To: {To} | StatusCode: {StatusCode} | Response: {Response}", toEmail, response.StatusCode, errorResponse);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EMAIL FAILED] To: {To} | Error: {Message}", toEmail, ex.Message);
            }
        }
    }
}
