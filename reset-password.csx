using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<MemoLibDbContext>(options =>
    options.UseSqlite("Data Source=memolib.db"));
builder.Services.AddScoped<PasswordService>();

var app = builder.Build();

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<MemoLibDbContext>();
var passwordService = scope.ServiceProvider.GetRequiredService<PasswordService>();

var email = "sarraboudjellal57@gmail.com";
var newPassword = "Admin123!";

var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
if (user != null)
{
    user.Password = passwordService.HashPassword(newPassword);
    await db.SaveChangesAsync();
    Console.WriteLine($"✅ Mot de passe réinitialisé pour {email}");
    Console.WriteLine($"   Nouveau mot de passe: {newPassword}");
}
else
{
    Console.WriteLine($"❌ Utilisateur {email} introuvable");
}
