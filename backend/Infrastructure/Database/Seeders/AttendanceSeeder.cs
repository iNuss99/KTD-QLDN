using Microsoft.EntityFrameworkCore;
using techretail_api.Infrastructure.Data;
using techretail_api.Core.Models;
using System;
using System.Linq;
using System.Collections.Generic;

namespace techretail_api.Infrastructure.Database.Seeders
{
    public static class AttendanceSeeder
    {
        public static void Seed(AppDbContext dbContext)
        {
            if (dbContext.AttendanceRecords.Count() < 10)
            {
                var users = dbContext.Users.ToList();
                if (users.Count == 0) return;

                var random = new Random();
                var records = new List<AttendanceRecord>();
                var statuses = new[] { "Present", "Present", "Present", "Present", "Late", "HalfDay", "Absent" };

                // Seed for last 30 days for each user
                foreach (var user in users)
                {
                    for (int i = 1; i <= 30; i++)
                    {
                        var now = DateTime.UtcNow.AddDays(-i);
                        var date = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
                        // Skip weekends mostly
                        if (date.DayOfWeek == DayOfWeek.Sunday || date.DayOfWeek == DayOfWeek.Saturday)
                        {
                            if (random.Next(10) > 1) continue; // 10% chance to work on weekend
                        }

                        var status = statuses[random.Next(statuses.Length)];

                        DateTime? checkIn = null;
                        DateTime? checkOut = null;

                        if (status != "Absent")
                        {
                            int startHour = status == "Late" ? random.Next(9, 11) : random.Next(7, 9);
                            int startMin = random.Next(0, 60);
                            checkIn = date.AddHours(startHour).AddMinutes(startMin);

                            if (status == "HalfDay")
                            {
                                checkOut = checkIn.Value.AddHours(random.Next(3, 5));
                            }
                            else
                            {
                                checkOut = checkIn.Value.AddHours(random.Next(8, 10));
                            }
                        }

                        records.Add(new AttendanceRecord
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Date = date,
                            CheckInTime = checkIn,
                            CheckOutTime = checkOut,
                            Status = status,
                            Notes = status == "Absent" ? "Ốm" : (status == "Late" ? "Kẹt xe" : null)
                        });
                    }
                }

                dbContext.AttendanceRecords.AddRange(records);
                dbContext.SaveChanges();
            }
        }
    }
}
