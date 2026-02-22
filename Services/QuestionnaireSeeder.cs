using MemoLib.Api.Data;
using MemoLib.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MemoLib.Api.Services;

public class QuestionnaireSeeder
{
    public static async Task SeedDefaultQuestionnaires(MemoLibDbContext context)
    {
        if (await context.Questionnaires.AnyAsync()) return;

        var questionnaires = new[]
        {
            new Questionnaire
            {
                Id = Guid.NewGuid(),
                Name = "Clôture Email Client",
                Description = "Questions pour clôturer un email client",
                EventType = "EMAIL",
                Tags = "client",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Questions = new List<Question>
                {
                    new() { Id = Guid.NewGuid(), Text = "Le client a-t-il été satisfait de la réponse?", Type = "CHOICE", Options = "[\"Oui\",\"Non\",\"Partiellement\"]", IsRequired = true, Order = 1 },
                    new() { Id = Guid.NewGuid(), Text = "Une action de suivi est-elle nécessaire?", Type = "BOOLEAN", IsRequired = true, Order = 2 },
                    new() { Id = Guid.NewGuid(), Text = "Date de suivi prévue", Type = "DATE", IsRequired = false, Order = 3 },
                    new() { Id = Guid.NewGuid(), Text = "Commentaires additionnels", Type = "TEXT", IsRequired = false, Order = 4 }
                }
            },
            new Questionnaire
            {
                Id = Guid.NewGuid(),
                Name = "Clôture Dossier Urgent",
                Description = "Checklist pour dossiers prioritaires",
                EventType = "EMAIL",
                Tags = "urgent",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Questions = new List<Question>
                {
                    new() { Id = Guid.NewGuid(), Text = "Tous les documents ont-ils été archivés?", Type = "BOOLEAN", IsRequired = true, Order = 1 },
                    new() { Id = Guid.NewGuid(), Text = "Le client a-t-il été informé de la clôture?", Type = "BOOLEAN", IsRequired = true, Order = 2 },
                    new() { Id = Guid.NewGuid(), Text = "Facturation effectuée?", Type = "CHOICE", Options = "[\"Oui\",\"Non\",\"En cours\"]", IsRequired = true, Order = 3 },
                    new() { Id = Guid.NewGuid(), Text = "Temps passé (heures)", Type = "NUMBER", IsRequired = false, Order = 4 }
                }
            }
        };

        foreach (var questionnaire in questionnaires)
        {
            foreach (var question in questionnaire.Questions)
            {
                question.QuestionnaireId = questionnaire.Id;
            }
        }

        context.Questionnaires.AddRange(questionnaires);
        await context.SaveChangesAsync();
    }
}