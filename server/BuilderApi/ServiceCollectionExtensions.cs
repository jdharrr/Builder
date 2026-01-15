using Microsoft.Extensions.Options;
using DatabaseServices;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using AuthenticationServices;
using EmailServices;
using BuilderServices.ExpenseService;
using BuilderRepositories;
using BuilderServices.ExpenseCategoryService;
using BuilderServices.UserService;
using BuilderServices.ExpensePaymentService;

namespace BuilderApi;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection ConfigureDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IConfigureOptions<DatabaseSettings>, DatabaseSettingsConfiguration>();
        services.AddScoped<DatabaseService>();

        return services;
    }

    public static IServiceCollection ConfigureAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IConfigureOptions<JwtSettings>, JwtSettingsConfiguration>();
        services.AddSingleton<IConfigureOptions<JwtBearerOptions>, JwtBearerSettings>();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddScoped<TokenService>();
        services.AddScoped<AuthenticationService>();

        return services;
    }

    public static IServiceCollection ConfigureEmail(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IConfigureOptions<EmailSettings>, EmailSettingsConfiguration>();
        services.AddScoped<EmailService>();

        return services;
    }

    public static IServiceCollection ConfigureBuilderRepositories(this IServiceCollection services)
    {
        services.AddScoped<UserRepository>();
        services.AddScoped<ExpenseRepository>();
        services.AddScoped<ExpensePaymentRepository>();
        services.AddScoped<ExpenseCategoryRepository>();
        services.AddScoped<UserSettingsRepository>();

        return services;
    }

    public static IServiceCollection ConfigureBuilderServices(this IServiceCollection services)
    {
        services.AddScoped<UserService>();
        services.AddScoped<ExpenseService>();
        services.AddScoped<ExpenseCategoryService>();
        services.AddScoped<ExpensePaymentService>();

        return services;
    }

    public static IServiceCollection ConfigureUserContext(this IServiceCollection services)
    {
        services.AddScoped<UserContext>();

        return services;
    }
}