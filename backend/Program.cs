using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using techretail_api.Infrastructure.Data;
using techretail_api.Infrastructure.Database.Seeders;
using techretail_api.Core.Interceptors;
using techretail_api.Repositories;
using techretail_api.Services;
using techretail_api.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Support PORT env variable (Render sets this automatically)
var port = Environment.GetEnvironmentVariable("PORT") ?? "5130";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add HttpContextAccessor for getting Claims in Interceptor
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditInterceptor>();

// Add DbContext
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var auditInterceptor = sp.GetRequiredService<AuditInterceptor>();
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .AddInterceptors(auditInterceptor);
});

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

// Register Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Register Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IOrdersService, OrdersService>();
builder.Services.AddScoped<IFinanceService, FinanceService>();
builder.Services.AddScoped<IProductsService, ProductsService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.SetIsOriginAllowed(_ => true) // Allow any origin dynamically
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt Key is missing");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

// Seed Database
DatabaseSeeder.SeedAll(app.Services);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseHttpsRedirection(); // Only in dev; Render handles SSL via reverse proxy
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SignalR Hub
app.MapHub<OperationsHub>("/hubs/operations");

// Health check endpoint for UptimeRobot
app.MapGet("/", () => "Kingdom Trust Division API is running!");

app.Run();
