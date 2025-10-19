using BuilderApi;
using BuilderApi.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Dependency Injections
builder.Services.ConfigureDatabase(builder.Configuration);
builder.Services.ConfigureAuthentication(builder.Configuration);
builder.Services.ConfigureEmail(builder.Configuration);
builder.Services.ConfigureBuilderRepositories();
builder.Services.ConfigureBuilderServices();
builder.Services.ConfigureUserContext();

// Other Services
builder.Services.AddControllers();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Token",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Name = "Bearer",
                In = ParameterLocation.Header,
                Reference = new OpenApiReference
                {
                    Id= "Bearer",
                    Type=ReferenceType.SecurityScheme,
                }
            },
            new string[]{ }
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowBuilderApp",
        policy =>
        {
            policy.WithOrigins("http://127.0.0.1:5")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowBuilderApp");

app.UseHttpsRedirection();

// Authenticate User
app.UseAuthentication();

// Execute Middleware Pipeline
app.UseMiddleware<UserContextMiddleware>();

// Authorize Actions
app.UseAuthorization();

app.MapControllers();

app.Run();