using MemoLib.Api.Models.Base;

namespace MemoLib.Api.Models;

public class SatisfactionSurvey : TenantEntity
{
    public Guid CaseId { get; set; }
    public Guid ClientId { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public DateTime SentAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Status { get; set; } = "SENT";
    public int? OverallSatisfaction { get; set; }
    public int? CommunicationQuality { get; set; }
    public int? ResponseTime { get; set; }
    public int? Professionalism { get; set; }
    public int? ResultQuality { get; set; }
    public string? PositiveComments { get; set; }
    public string? ImprovementSuggestions { get; set; }
    public bool? WouldRecommend { get; set; }
    public string? SurveyToken { get; set; }
    public DateTime? ExpiresAt { get; set; }

    // Navigation
    public Case? Case { get; set; }
    public Client? Client { get; set; }
    public User? AssignedLawyer { get; set; }
}

public class LawyerPerformance
{
    public Guid LawyerId { get; set; }
    public string LawyerName { get; set; } = null!;
    public int TotalCasesClosed { get; set; }
    public int SurveysReceived { get; set; }
    public double ResponseRate { get; set; }
    public double AverageOverallSatisfaction { get; set; }
    public double AverageCommunication { get; set; }
    public double AverageResponseTime { get; set; }
    public double AverageProfessionalism { get; set; }
    public double AverageResultQuality { get; set; }
    public int RecommendationCount { get; set; }
    public double RecommendationRate { get; set; }
}
