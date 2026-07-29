using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using techretail_api.Infrastructure.Data;

var services = new ServiceCollection();
services.AddDbContext<AppDbContext>(options => options.UseNpgsql("Host=localhost;Database=techretail;Username=postgres;Password=postgres"));
var provider = services.BuildServiceProvider();
var context = provider.GetRequiredService<AppDbContext>();

var count = context.Users.Count(u => u.Email != u.Email.ToLower());
Console.WriteLine($"Users with uppercase email: {count}");
