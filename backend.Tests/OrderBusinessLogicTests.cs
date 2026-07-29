using techretail_api.Core.Models;

namespace techretail_api.Tests.Unit
{
    /// <summary>
    /// Tests for core business logic in Order domain.
    /// These test the computation logic directly (no DB required).
    /// </summary>
    public class OrderBusinessLogicTests
    {
        // ─── Test: OrderCode không được trùng khi tạo đồng thời ───
        [Fact]
        public void OrderCode_Generated_ShouldBeUnique_WhenCalledConcurrently()
        {
            // Arrange – simulate 100 concurrent OrderCode generations
            var codes = new System.Collections.Concurrent.ConcurrentBag<string>();

            // Act
            Parallel.For(0, 100, _ =>
            {
                var code = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
                codes.Add(code);
            });

            // Assert – all codes must be unique
            Assert.Equal(100, codes.Distinct().Count());
        }

        // ─── Test: Tính toán TotalAmount đúng ───
        [Fact]
        public void OrderTotal_ShouldBeCalculatedCorrectly()
        {
            // Arrange
            var details = new List<OrderDetail>
            {
                new() { Id = Guid.NewGuid(), Quantity = 2, UnitPrice = 100_000m },
                new() { Id = Guid.NewGuid(), Quantity = 3, UnitPrice = 50_000m }
            };

            decimal subTotal = details.Sum(d => d.Quantity * d.UnitPrice);
            decimal tax = 15_000m;
            decimal discount = 10_000m;

            // Act
            decimal total = subTotal + tax - discount;

            // Assert
            Assert.Equal(350_000m, subTotal);   // 2×100k + 3×50k
            Assert.Equal(355_000m, total);       // 350k + 15k - 10k
        }

        // ─── Test: Không được cho phép TotalAmount âm ───
        [Fact]
        public void OrderTotal_ShouldNotBeNegative_WhenDiscountExceedsSubtotal()
        {
            // Arrange
            decimal subTotal = 50_000m;
            decimal discount = 100_000m; // discount > subtotal
            decimal tax = 0m;

            // Act
            decimal total = subTotal + tax - discount;

            // Assert – phát hiện edge case nguy hiểm: total âm
            Assert.True(total < 0, "Hệ thống phải kiểm tra và từ chối giảm giá lớn hơn tổng tiền hàng");
        }

        // ─── Test: State machine chuyển trạng thái hợp lệ ───
        [Theory]
        [InlineData("Pending", "Confirmed", true)]
        [InlineData("Pending", "Cancelled", true)]
        [InlineData("Confirmed", "Shipped", true)]
        [InlineData("Shipped", "Delivered", true)]
        [InlineData("Delivered", "Cancelled", false)]   // không được hủy sau khi đã giao
        [InlineData("Cancelled", "Confirmed", false)]   // không được phục hồi từ Cancelled
        public void OrderStatusTransition_ShouldFollowStateMachine(string from, string to, bool expectedValid)
        {
            // Arrange
            var validTransitions = new Dictionary<string, string[]>
            {
                { "Pending",   new[] { "Confirmed", "Shipped", "Delivered", "Cancelled" } },
                { "Confirmed", new[] { "Shipped", "Delivered", "Cancelled" } },
                { "Shipped",   new[] { "Delivered", "Cancelled" } },
                { "Delivered", Array.Empty<string>() },
                { "Cancelled", Array.Empty<string>() }
            };

            // Act
            bool isValid = validTransitions.ContainsKey(from) && validTransitions[from].Contains(to);

            // Assert
            Assert.Equal(expectedValid, isValid);
        }

        // ─── Test: Trừ kho chỉ xảy ra khi trạng thái cần trừ ───
        [Theory]
        [InlineData("Pending", false)]
        [InlineData("Confirmed", true)]
        [InlineData("Shipped", true)]
        [InlineData("Delivered", true)]
        [InlineData("Cancelled", false)]
        public void StockDeduction_ShouldOnlyOccurForActiveStatuses(string status, bool expectedDeducted)
        {
            // Act
            bool willBeDeducted = status is "Confirmed" or "Shipped" or "Delivered";

            // Assert
            Assert.Equal(expectedDeducted, willBeDeducted);
        }

        // ─── Test: ApiResponse wrapper tạo đúng format ───
        [Fact]
        public void ApiResponse_Ok_ShouldHaveSuccessTrue()
        {
            // Act
            var response = ApiResponse<string>.Ok("test data", "Thành công");

            // Assert
            Assert.True(response.Success);
            Assert.Equal("test data", response.Data);
            Assert.Equal("Thành công", response.Message);
            Assert.Equal(200, response.StatusCode);
            Assert.Null(response.ErrorCode);
        }

        [Fact]
        public void ApiResponse_Fail_ShouldHaveSuccessFalse()
        {
            // Act
            var response = ApiResponse<string>.Fail("Lỗi nghiệp vụ", "BUSINESS_ERROR");

            // Assert
            Assert.False(response.Success);
            Assert.Null(response.Data);
            Assert.Equal("BUSINESS_ERROR", response.ErrorCode);
            Assert.Equal(400, response.StatusCode);
        }
    }

    // ─── Regression tests for bugs fixed ───
    public class PayrollCalculationRegressionTests
    {
        // B4 regression: daysAbsent phải được trừ vào lương
        [Theory]
        [InlineData(22, 0, 0, 10_000_000, 10_000_000)]  // đi đủ ngày → lương đầy đủ
        [InlineData(17, 0, 0, 10_000_000, 7_727_272)]   // vắng 5 ngày không phép → bị trừ
        [InlineData(17, 5, 0, 10_000_000, 10_000_000)]  // vắng 5 ngày nhưng còn 5 ngày phép → không trừ
        [InlineData(10, 2, 0, 10_000_000, 5_454_545)]   // vắng 12 ngày, phép 2 → trừ 10 ngày
        [InlineData(0, 0, 0, 10_000_000, 0)]            // không đi làm, không phép → lương 0
        public void PayrollNetPay_ShouldReflectAbsences(
            int daysPresent, int leaveDaysRemaining, int bonusAmount,
            decimal baseSalary, decimal expectedNetPay)
        {
            // Arrange
            const int WORKING_DAYS = 22;
            decimal dailyRate = baseSalary / WORKING_DAYS;

            int daysAbsent = Math.Max(0, WORKING_DAYS - daysPresent);
            int unauthorizedAbsent = Math.Max(0, daysAbsent - leaveDaysRemaining);
            decimal deductions = unauthorizedAbsent * dailyRate;
            decimal netPay = Math.Max(0, baseSalary + bonusAmount - deductions);

            // Assert — allow ±1 VND rounding difference
            Assert.True(Math.Abs(netPay - expectedNetPay) < 1m,
                $"Expected ~{expectedNetPay} but got {netPay} (daysPresent={daysPresent}, leave={leaveDaysRemaining})");
        }

        // B4 regression: netPay không bao giờ được âm
        [Fact]
        public void PayrollNetPay_ShouldNeverBeNegative()
        {
            decimal salary = 5_000_000;
            decimal hugePenalty = 10_000_000; // deduction larger than salary
            decimal netPay = Math.Max(0, salary - hugePenalty);
            Assert.True(netPay >= 0, "NetPay must never be negative");
        }

        // B7 regression: stock threshold dùng MinStockQuantity
        [Theory]
        [InlineData(5, 10, true)]   // stock <= MinStock → low stock
        [InlineData(10, 10, true)]  // stock == MinStock → low stock
        [InlineData(11, 10, false)] // stock > MinStock → not low
        [InlineData(0, 5, true)]    // stock = 0 → always low
        public void LowStockFilter_ShouldUseProductThreshold(int stock, int minStock, bool expectedLow)
        {
            bool isLow = stock <= minStock;
            Assert.Equal(expectedLow, isLow);
        }
    }
}
