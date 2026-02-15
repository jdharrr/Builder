using Microsoft.Extensions.Options;
using DatabaseServices;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using AuthenticationServices;
using EmailServices;
using BuilderServices.Expenses.ExpenseService;
using BuilderServices.Expenses.ExpenseTableService;
using BuilderServices.ExpenseCategories.ExpenseCategoryChartService;
using BuilderServices.ExpensePayments.ExpensePaymentChartService;
using BuilderServices.ExpensePayments.ExpensePaymentService;
using BuilderServices.ExpensePayments.ExpensePaymentTableService;
using BuilderRepositories;
using BuilderServices.CreditCardService;
using BuilderServices.ExpenseCategories.ExpenseCategoryService;
using BuilderServices.UserService;

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
        services.AddScoped<CreditCardRepository>();
        services.AddScoped<CreditCardPaymentsRepository>();
        services.AddScoped<ScheduledPaymentRepository>();

        return services;
    }

    public static IServiceCollection ConfigureBuilderServices(this IServiceCollection services)
    {
        services.AddScoped<UserService>();
        services.AddScoped<ExpenseCategoryChartService>();
        services.AddScoped<ExpenseService>();
        services.AddScoped<ExpenseTableService>();
        services.AddScoped<ExpenseCategoryService>();
        services.AddScoped<ExpensePaymentChartService>();
        services.AddScoped<ExpensePaymentService>();
        services.AddScoped<ExpensePaymentTableService>();
        services.AddScoped<CreditCardService>();

        return services;
    }

    public static IServiceCollection ConfigureUserContext(this IServiceCollection services)
    {
        services.AddScoped<UserContext>();

        return services;
    }
}
