using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class LegalSectorSecurityService
{
    private static readonly HashSet<string> SuspiciousPatterns = new(StringComparer.OrdinalIgnoreCase)
    {
        "urgent payment", "wire transfer", "bitcoin", "cryptocurrency",
        "suspended account", "verify account", "click here immediately",
        "act now", "limited time", "congratulations you won"
    };

    private static readonly HashSet<string> TrustedLegalDomains = new(StringComparer.OrdinalIgnoreCase)
    {
        "justice.gouv.fr", "conseil-national.avocat.fr", "cnb.avocat.fr",
        "barreau-paris.com", "ordre-avocats.fr"
    };

    private static readonly Regex PhishingUrlPattern = new(
        @"(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|suspicious\.domain)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public LegalSecurityAssessment AssessEmailSecurity(string from, string subject, string body, List<string> attachments)
    {
        var assessment = new LegalSecurityAssessment();
        
        // 1. Vérification domaine expéditeur
        assessment.SenderTrustLevel = AssessSenderTrust(from);
        
        // 2. Détection patterns de phishing
        assessment.PhishingRisk = DetectPhishingPatterns(subject, body);
        
        // 3. Analyse des liens
        assessment.LinkSafety = AnalyzeLinks(body);
        
        // 4. Vérification pièces jointes
        assessment.AttachmentSafety = AnalyzeAttachments(attachments);
        
        // 5. Score global de confiance
        assessment.OverallTrustScore = CalculateOverallScore(assessment);
        
        // 6. Recommandations
        assessment.Recommendations = GenerateRecommendations(assessment);
        
        return assessment;
    }

    private TrustLevel AssessSenderTrust(string from)
    {
        if (string.IsNullOrWhiteSpace(from))
            return TrustLevel.VeryLow;

        var domain = from.Split('@').LastOrDefault()?.ToLowerInvariant();
        if (string.IsNullOrEmpty(domain))
            return TrustLevel.VeryLow;

        // Domaines juridiques officiels
        if (TrustedLegalDomains.Contains(domain))
            return TrustLevel.VeryHigh;

        // Domaines gouvernementaux
        if (domain.EndsWith(".gouv.fr") || domain.EndsWith(".justice.fr"))
            return TrustLevel.VeryHigh;

        // Domaines suspects
        if (domain.Contains("tempmail") || domain.Contains("10minute") || domain.Length < 4)
            return TrustLevel.VeryLow;

        // Domaines grands publics
        if (domain.EndsWith("gmail.com") || domain.EndsWith("outlook.com") || domain.EndsWith("yahoo.com"))
            return TrustLevel.Medium;

        return TrustLevel.Low;
    }

    private PhishingRisk DetectPhishingPatterns(string subject, string body)
    {
        var text = $"{subject} {body}".ToLowerInvariant();
        
        var suspiciousCount = SuspiciousPatterns.Count(pattern => text.Contains(pattern));
        
        // Détection d'urgence artificielle
        if (text.Contains("urgent") && text.Contains("immediately"))
            suspiciousCount += 2;

        // Détection de demandes financières
        if (text.Contains("payment") || text.Contains("transfer") || text.Contains("account"))
            suspiciousCount += 1;

        return suspiciousCount switch
        {
            0 => PhishingRisk.Low,
            1 => PhishingRisk.Medium,
            >= 2 => PhishingRisk.High,
            _ => PhishingRisk.Low
        };
    }

    private LinkSafety AnalyzeLinks(string body)
    {
        var urls = Regex.Matches(body, @"https?://[^\s]+", RegexOptions.IgnoreCase);
        
        if (urls.Count == 0)
            return LinkSafety.Safe;

        foreach (Match url in urls)
        {
            if (PhishingUrlPattern.IsMatch(url.Value))
                return LinkSafety.Dangerous;
        }

        return urls.Count > 5 ? LinkSafety.Suspicious : LinkSafety.Safe;
    }

    private AttachmentSafety AnalyzeAttachments(List<string> attachments)
    {
        if (attachments == null || attachments.Count == 0)
            return AttachmentSafety.Safe;

        var dangerousExtensions = new[] { ".exe", ".scr", ".bat", ".cmd", ".com", ".pif", ".vbs", ".js" };
        var suspiciousExtensions = new[] { ".zip", ".rar", ".7z" };

        foreach (var attachment in attachments)
        {
            var extension = Path.GetExtension(attachment).ToLowerInvariant();
            
            if (dangerousExtensions.Contains(extension))
                return AttachmentSafety.Dangerous;
                
            if (suspiciousExtensions.Contains(extension))
                return AttachmentSafety.Suspicious;
        }

        return AttachmentSafety.Safe;
    }

    private double CalculateOverallScore(LegalSecurityAssessment assessment)
    {
        var score = 100.0;

        // Pénalités selon les risques
        score -= assessment.SenderTrustLevel switch
        {
            TrustLevel.VeryLow => 40,
            TrustLevel.Low => 20,
            TrustLevel.Medium => 5,
            _ => 0
        };

        score -= assessment.PhishingRisk switch
        {
            PhishingRisk.High => 30,
            PhishingRisk.Medium => 15,
            _ => 0
        };

        score -= assessment.LinkSafety switch
        {
            LinkSafety.Dangerous => 25,
            LinkSafety.Suspicious => 10,
            _ => 0
        };

        score -= assessment.AttachmentSafety switch
        {
            AttachmentSafety.Dangerous => 35,
            AttachmentSafety.Suspicious => 15,
            _ => 0
        };

        return Math.Max(0, score);
    }

    private List<string> GenerateRecommendations(LegalSecurityAssessment assessment)
    {
        var recommendations = new List<string>();

        if (assessment.SenderTrustLevel <= TrustLevel.Low)
            recommendations.Add("⚠️ Vérifier l'identité de l'expéditeur avant toute action");

        if (assessment.PhishingRisk >= PhishingRisk.Medium)
            recommendations.Add("🚨 Patterns de phishing détectés - Ne pas cliquer sur les liens");

        if (assessment.LinkSafety != LinkSafety.Safe)
            recommendations.Add("🔗 Liens suspects détectés - Vérifier manuellement les URLs");

        if (assessment.AttachmentSafety != AttachmentSafety.Safe)
            recommendations.Add("📎 Pièces jointes à risque - Scanner avant ouverture");

        if (assessment.OverallTrustScore < 70)
            recommendations.Add("🛡️ Score de confiance faible - Traiter avec précaution maximale");

        if (recommendations.Count == 0)
            recommendations.Add("✅ Email semble sûr - Traitement normal autorisé");

        return recommendations;
    }
}

public class LegalSecurityAssessment
{
    public TrustLevel SenderTrustLevel { get; set; }
    public PhishingRisk PhishingRisk { get; set; }
    public LinkSafety LinkSafety { get; set; }
    public AttachmentSafety AttachmentSafety { get; set; }
    public double OverallTrustScore { get; set; }
    public List<string> Recommendations { get; set; } = new();
    
    public bool IsHighRisk => OverallTrustScore < 50;
    public bool RequiresManualReview => OverallTrustScore < 70;
}

public enum TrustLevel { VeryLow, Low, Medium, High, VeryHigh }
public enum PhishingRisk { Low, Medium, High }
public enum LinkSafety { Safe, Suspicious, Dangerous }
public enum AttachmentSafety { Safe, Suspicious, Dangerous }