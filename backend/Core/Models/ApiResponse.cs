namespace techretail_api.Core.Models
{
    /// <summary>
    /// Standard API response envelope for all endpoints.
    /// Ensures consistent JSON structure: { success, data, message, errorCode }
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public string? Message { get; set; }
        public string? ErrorCode { get; set; }
        public int StatusCode { get; set; }

        public static ApiResponse<T> Ok(T data, string? message = null) => new()
        {
            Success = true,
            Data = data,
            Message = message,
            StatusCode = 200
        };

        public static ApiResponse<T> Created(T data, string? message = "Tạo mới thành công") => new()
        {
            Success = true,
            Data = data,
            Message = message,
            StatusCode = 201
        };

        public static ApiResponse<T> Fail(string message, string errorCode = "BAD_REQUEST", int statusCode = 400) => new()
        {
            Success = false,
            Data = default,
            Message = message,
            ErrorCode = errorCode,
            StatusCode = statusCode
        };

        public static ApiResponse<T> NotFound(string message = "Không tìm thấy dữ liệu") =>
            Fail(message, "NOT_FOUND", 404);

        public static ApiResponse<T> Forbidden(string message = "Bạn không có quyền thực hiện chức năng này") =>
            Fail(message, "FORBIDDEN", 403);
    }

    // Non-generic version for responses without data
    public class ApiResponse : ApiResponse<object>
    {
        public static ApiResponse OkMessage(string message) => new()
        {
            Success = true,
            Message = message,
            StatusCode = 200
        };
    }
}
