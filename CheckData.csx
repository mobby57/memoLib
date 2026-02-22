using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;

var optionsBuilder = new DbContextOptionsBuilder<MemoLibDbContext>();
optionsBuilder.UseSqlite("Data Source=memolib.db");

using var context = new MemoLibDbContext(optionsBuilder.Options);

var casesCount = await context.Cases.CountAsync();
var eventsCount = await context.Events.CountAsync();
var usersCount = await context.Users.CountAsync();

Console.WriteLine($"👤 Utilisateurs: {usersCount}");
Console.WriteLine($"📁 Dossiers: {casesCount}");
Console.WriteLine($"📧 Événements: {eventsCount}");

if (casesCount > 0)
{
    var recentCases = await context.Cases
        .OrderByDescending(c => c.CreatedAt)
        .Take(5)
        .ToListAsync();
    
    Console.WriteLine("\n📋 5 derniers dossiers:");
    foreach (var c in recentCases)
    {
        Console.WriteLine($"  - {c.Title} (créé le {c.CreatedAt:dd/MM/yyyy HH:mm})");
    }
}
