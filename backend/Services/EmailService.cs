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
            // Random value to prevent Gmail from trimming the email
            var antiTrim = Guid.NewGuid().ToString();

            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
</head>
<body style=""margin: 0; padding: 0; background-color: #f4f6f9;"">
<div style=""font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"">
  <!-- Header -->
  <div style=""background: linear-gradient(135deg, #488996 0%, #3577ad 100%); padding: 48px 24px; text-align: center;"">
    <div style=""display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px;"">
      KTD ENTERPRISE
    </div>
    <h1 style=""margin: 0 0 12px 0; color: #ffffff; font-size: 32px; font-weight: 700;"">Chào mừng bạn! 🎉</h1>
    <p style=""margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;"">Tài khoản của bạn đã được tạo thành công</p>
  </div>
  
  <!-- Body -->
  <div style=""padding: 40px 32px;"">
    <p style=""margin: 0 0 20px 0; font-size: 16px; color: #334155;"">Xin chào <strong>{fullName}</strong>,</p>
    <p style=""margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #475569;"">Quản trị viên đã tạo tài khoản cho bạn tại hệ thống <strong>KTD Enterprise</strong>. Dưới đây là thông tin đăng nhập của bạn:</p>
    
    <!-- Info Card -->
    <div style=""border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px; background-color: #fafafa;"">
      <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""font-size: 15px;"">
        <tr>
          <td style=""padding: 12px 0; width: 120px; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 13px;"">Email</td>
          <td style=""padding: 12px 0;""><a href=""mailto:{toEmail}"" style=""color: #3b82f6; text-decoration: none; font-weight: 500;"">{toEmail}</a></td>
        </tr>
        <tr><td colspan=""2"" style=""border-bottom: 1px solid #f1f5f9;""></td></tr>
        <tr>
          <td style=""padding: 16px 0 4px 0; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 13px;"">Mật khẩu</td>
          <td style=""padding: 16px 0 4px 0;"">
            <span style=""display: inline-block; background-color: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-family: 'Courier New', Courier, monospace; font-size: 18px; letter-spacing: 2px;"">{password}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Warning Box -->
    <div style=""background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px 20px; border-radius: 4px 8px 8px 4px; margin-bottom: 32px;"">
      <p style=""margin: 0; color: #9a3412; font-size: 14px; line-height: 1.5;"">
        <strong>⚠️ Lưu ý bảo mật:</strong> Đây là mật khẩu tạm thời. Bạn sẽ được yêu cầu đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
      </p>
    </div>
    
    <!-- Button -->
    <div style=""text-align: center; margin-bottom: 40px;"">
      <a href=""http://localhost:5173"" style=""display: inline-block; background-color: #4080a8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;"">Đăng nhập ngay &rarr;</a>
    </div>
    
    <p style=""margin: 0; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.5;"">Nếu bạn không yêu cầu tài khoản này, vui lòng bỏ qua email này hoặc liên hệ quản trị viên.</p>
  </div>
</div>
<!-- Anti-trimming for Gmail -->
<div style=""display:none; white-space:nowrap; font:15px courier; line-height:0;"">
  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; {antiTrim}
</div>
</body>
</html>";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string newPassword)
        {
            var subject = "KTD – Mật khẩu của bạn đã được đặt lại";
            // Random value to prevent Gmail from trimming the email
            var antiTrim = Guid.NewGuid().ToString();

            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
</head>
<body style=""margin: 0; padding: 0; background-color: #f4f6f9;"">
<div style=""font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);"">
  <!-- Header -->
  <div style=""background: linear-gradient(135deg, #488996 0%, #3577ad 100%); padding: 48px 24px; text-align: center;"">
    <div style=""display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 24px;"">
      KTD ENTERPRISE
    </div>
    <h1 style=""margin: 0 0 12px 0; color: #ffffff; font-size: 32px; font-weight: 700;"">Đặt lại mật khẩu 🔒</h1>
    <p style=""margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;"">Mật khẩu của bạn vừa được cập nhật</p>
  </div>
  
  <!-- Body -->
  <div style=""padding: 40px 32px;"">
    <p style=""margin: 0 0 20px 0; font-size: 16px; color: #334155;"">Xin chào <strong>{fullName}</strong>,</p>
    <p style=""margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #475569;"">Quản trị viên đã đặt lại mật khẩu cho tài khoản của bạn tại hệ thống <strong>KTD Enterprise</strong>. Dưới đây là thông tin đăng nhập mới:</p>
    
    <!-- Info Card -->
    <div style=""border: 1px solid #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px; background-color: #fafafa;"">
      <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""font-size: 15px;"">
        <tr>
          <td style=""padding: 12px 0; width: 120px; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 13px;"">Email</td>
          <td style=""padding: 12px 0;""><a href=""mailto:{toEmail}"" style=""color: #3b82f6; text-decoration: none; font-weight: 500;"">{toEmail}</a></td>
        </tr>
        <tr><td colspan=""2"" style=""border-bottom: 1px solid #f1f5f9;""></td></tr>
        <tr>
          <td style=""padding: 16px 0 4px 0; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 13px;"">Mật khẩu</td>
          <td style=""padding: 16px 0 4px 0;"">
            <span style=""display: inline-block; background-color: #fff7ed; border: 1px solid #fed7aa; color: #c2410c; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-family: 'Courier New', Courier, monospace; font-size: 18px; letter-spacing: 2px;"">{newPassword}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Warning Box -->
    <div style=""background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px 20px; border-radius: 4px 8px 8px 4px; margin-bottom: 32px;"">
      <p style=""margin: 0; color: #9a3412; font-size: 14px; line-height: 1.5;"">
        <strong>⚠️ Lưu ý bảo mật:</strong> Mật khẩu này chỉ có hiệu lực trong 24 giờ. Vui lòng đăng nhập và đổi mật khẩu ngay để đảm bảo an toàn.
      </p>
    </div>
    
    <!-- Button -->
    <div style=""text-align: center; margin-bottom: 40px;"">
      <a href=""http://localhost:5173"" style=""display: inline-block; background-color: #4080a8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;"">Đăng nhập ngay &rarr;</a>
    </div>
    
    <p style=""margin: 0; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.5;"">Email này được gửi tự động từ hệ thống KTD. Vui lòng không trả lời.</p>
  </div>
</div>
<!-- Anti-trimming for Gmail -->
<div style=""display:none; white-space:nowrap; font:15px courier; line-height:0;"">
  &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; {antiTrim}
</div>
</body>
</html>";

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
