using Microsoft.EntityFrameworkCore;
using MemoLib.Api.Data;
using MemoLib.Api.Models;
using System.Net.Mail;
using System.Net;

namespace MemoLib.Api.Services;

public class SatisfactionSurveyService
{
    private readonly MemoLibDbContext _context;
    private readonly IConfiguration _config;
    private readonly ILogger<SatisfactionSurveyService> _logger;

    public SatisfactionSurveyService(MemoLibDbContext context, IConfiguration config, ILogger<SatisfactionSurveyService> logger)
    {
        _context = context;
        _config = config;
        _logger = logger;
    }

    public async Task<SatisfactionSurvey> SendSurveyOnCaseClosureAsync(Guid caseId)
    {
        var case_ = await _context.Cases.FindAsync(caseId);
        if (case_ == null || case_.Status != "CLOSED") return null!;

        var client = await _context.Clients.FindAsync(case_.ClientId);
        if (client == null || string.IsNullOrWhiteSpace(client.Email)) return null!;

        var survey = new SatisfactionSurvey
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            ClientId = client.Id,
            AssignedLawyerId = case_.AssignedToUserId,
            SentAt = DateTime.UtcNow,
            Status = "SENT",
            SurveyToken = Guid.NewGuid().ToString("N"),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _context.SatisfactionSurveys.Add(survey);
        await _context.SaveChangesAsync();

        await SendSurveyEmailAsync(client.Email, survey.SurveyToken, case_.Title);

        return survey;
    }

    private async Task SendSurveyEmailAsync(string clientEmail, string token, string caseTitle)
    {
        var username = _config["EmailMonitor:Username"];
        var password = _config["EmailMonitor:Password"];
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password)) return;

        var surveyUrl = $"http://localhost:5078/survey.html?token={token}";
        var body = $@"Bonjour,

Votre dossier ""{caseTitle}"" a été clôturé.

Nous aimerions connaître votre avis sur nos services. Merci de prendre 2 minutes pour répondre à notre enquête de satisfaction :

{surveyUrl}

Ce lien est valable 30 jours.

Cordialement,
L'équipe MemoLib";

        try
        {
            using var client = new SmtpClient(_config["EmailMonitor:SmtpHost"] ?? "smtp.gmail.com", 587)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(username, password)
            };

            var mail = new MailMessage
            {
                From = new MailAddress(username),
                Subject = "Enquête de satisfaction - Dossier clôturé",
                Body = body,
                IsBodyHtml = false
            };
            mail.To.Add(clientEmail);

            await client.SendMailAsync(mail);
            _logger.LogInformation($"Enquête envoyée à {clientEmail}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur envoi enquête");
        }
    }

    public async Task<SatisfactionSurvey?> GetSurveyByTokenAsync(string token)
    {
        return await _context.SatisfactionSurveys
            .FirstOrDefaultAsync(s => s.SurveyToken == token && s.Status == "SENT" && s.ExpiresAt > DateTime.UtcNow);
    }

    public async Task<bool> SubmitSurveyAsync(string token, SatisfactionSurvey response)
    {
        var survey = await GetSurveyByTokenAsync(token);
        if (survey == null) return false;

        survey.OverallSatisfaction = response.OverallSatisfaction;
        survey.CommunicationQuality = response.CommunicationQuality;
        survey.ResponseTime = response.ResponseTime;
        survey.Professionalism = response.Professionalism;
        survey.ResultQuality = response.ResultQuality;
        survey.PositiveComments = response.PositiveComments;
        survey.ImprovementSuggestions = response.ImprovementSuggestions;
        survey.WouldRecommend = response.WouldRecommend;
        survey.CompletedAt = DateTime.UtcNow;
        survey.Status = "COMPLETED";

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<LawyerPerformance>> GetLawyerPerformanceAsync()
    {
        var lawyers = await _context.Users.Where(u => u.Role == "AVOCAT").ToListAsync();
        var performances = new List<LawyerPerformance>();

        foreach (var lawyer in lawyers)
        {
            var closedCases = await _context.Cases.CountAsync(c => c.AssignedToUserId == lawyer.Id && c.Status == "CLOSED");
            var surveys = await _context.SatisfactionSurveys
                .Where(s => s.AssignedLawyerId == lawyer.Id && s.Status == "COMPLETED")
                .ToListAsync();

            if (closedCases == 0) continue;

            var perf = new LawyerPerformance
            {
                LawyerId = lawyer.Id,
                LawyerName = lawyer.Name ?? string.Empty,
                TotalCasesClosed = closedCases,
                SurveysReceived = surveys.Count,
                ResponseRate = closedCases > 0 ? (double)surveys.Count / closedCases * 100 : 0,
                AverageOverallSatisfaction = surveys.Any() ? surveys.Average(s => s.OverallSatisfaction ?? 0) : 0,
                AverageCommunication = surveys.Any() ? surveys.Average(s => s.CommunicationQuality ?? 0) : 0,
                AverageResponseTime = surveys.Any() ? surveys.Average(s => s.ResponseTime ?? 0) : 0,
                AverageProfessionalism = surveys.Any() ? surveys.Average(s => s.Professionalism ?? 0) : 0,
                AverageResultQuality = surveys.Any() ? surveys.Average(s => s.ResultQuality ?? 0) : 0,
                RecommendationCount = surveys.Count(s => s.WouldRecommend == true),
                RecommendationRate = surveys.Any() ? (double)surveys.Count(s => s.WouldRecommend == true) / surveys.Count * 100 : 0
            };

            performances.Add(perf);
        }

        return performances.OrderByDescending(p => p.AverageOverallSatisfaction).ToList();
    }
}
