using System.Collections.Generic;

namespace MemoLib.Api.Configuration;

/// <summary>
/// Configuration RBAC centralisée pour MemoLib
/// Définit les permissions par rôle et par endpoint
/// </summary>
public static class RbacConfig
{
    // Définition des rôles
    public const string ROLE_CLIENT = "CLIENT";
    public const string ROLE_AGENT = "AGENT";
    public const string ROLE_ADMIN = "ADMIN";
    public const string ROLE_OWNER = "OWNER";

    // Hiérarchie des rôles (du plus restrictif au plus permissif)
    public static readonly List<string> RoleHierarchy = new()
    {
        ROLE_CLIENT,  // Niveau 1 - Accès minimal
        ROLE_AGENT,   // Niveau 2 - Opérations courantes
        ROLE_ADMIN,   // Niveau 3 - Gestion complète
        ROLE_OWNER    // Niveau 4 - Contrôle total
    };

    /// <summary>
    /// Vérifie si un rôle a au moins le niveau requis
    /// </summary>
    public static bool HasMinimumRole(string userRole, string requiredRole)
    {
        var userLevel = RoleHierarchy.IndexOf(userRole);
        var requiredLevel = RoleHierarchy.IndexOf(requiredRole);
        return userLevel >= requiredLevel;
    }

    // ========================================
    // PERMISSIONS PAR FONCTIONNALITÉ
    // ========================================

    /// <summary>
    /// US10 - Portail Client Suivi Dossier
    /// </summary>
    public static class PortailClient
    {
        public static readonly string[] ViewOwnCases = { ROLE_CLIENT, ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ViewTimeline = { ROLE_CLIENT, ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ViewNextActions = { ROLE_CLIENT, ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US11 - Upload Client Guidé
    /// </summary>
    public static class UploadClient
    {
        public static readonly string[] UploadDocument = { ROLE_CLIENT, ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ViewChecklist = { ROLE_CLIENT, ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ValidateDocument = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US12 - Triage Assistant Priorisé
    /// </summary>
    public static class TriageAssistant
    {
        public static readonly string[] ViewQueue = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] AssignCase = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] UpdatePriority = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US13 - Checklist Passation
    /// </summary>
    public static class ChecklistPassation
    {
        public static readonly string[] ViewChecklist = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] CompleteChecklist = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] TransferCase = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ValidateTransfer = { ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US14 - Vue 360 Juriste
    /// </summary>
    public static class Vue360Juriste
    {
        public static readonly string[] ViewConsolidated = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] QuickActions = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] FilterTimeline = { ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US6 - Calendrier & Alertes SLA
    /// </summary>
    public static class CalendrierSLA
    {
        public static readonly string[] ViewCalendar = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ConfigureAlerts = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ViewSLAStatus = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US2 - Notes Collaboratives
    /// </summary>
    public static class NotesCollaboratives
    {
        public static readonly string[] ViewNotes = { ROLE_CLIENT, ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] CreateNote = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] EditOwnNote = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] EditAnyNote = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] DeleteNote = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] MentionUsers = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US9 - Reporting Direction
    /// </summary>
    public static class ReportingDirection
    {
        public static readonly string[] ViewDashboard = { ROLE_OWNER };
        public static readonly string[] ViewKPIs = { ROLE_OWNER };
        public static readonly string[] ExportReports = { ROLE_OWNER };
        public static readonly string[] ConfigureReports = { ROLE_OWNER };
    }

    /// <summary>
    /// US15 - Charge Équipe
    /// </summary>
    public static class ChargeEquipe
    {
        public static readonly string[] ViewTeamLoad = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ReassignCases = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ViewAlerts = { ROLE_ADMIN, ROLE_OWNER };
    }

    /// <summary>
    /// US17 - Contrôles RGPD
    /// </summary>
    public static class ControlesRGPD
    {
        public static readonly string[] ViewAuditLog = { ROLE_OWNER };
        public static readonly string[] ConfigureRetention = { ROLE_OWNER };
        public static readonly string[] ExportCompliance = { ROLE_OWNER };
        public static readonly string[] ViewAccessLog = { ROLE_OWNER };
    }

    // ========================================
    // GESTION DES DOSSIERS (CORE)
    // ========================================

    public static class Cases
    {
        public static readonly string[] ViewOwn = { ROLE_CLIENT, ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ViewAll = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] Create = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] Edit = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] Delete = { ROLE_OWNER };
        public static readonly string[] Assign = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] ChangeStatus = { ROLE_ADMIN, ROLE_OWNER };
        public static readonly string[] AddTags = { ROLE_AGENT, ROLE_ADMIN, ROLE_OWNER };
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    /// <summary>
    /// Vérifie si un utilisateur a la permission pour une action
    /// </summary>
    public static bool HasPermission(string userRole, string[] allowedRoles)
    {
        return allowedRoles.Contains(userRole);
    }

    /// <summary>
    /// Vérifie si un utilisateur peut accéder à un dossier
    /// </summary>
    public static bool CanAccessCase(string userRole, Guid userId, Guid caseOwnerId, List<Guid> caseCollaborators)
    {
        // CLIENT: uniquement ses propres dossiers
        if (userRole == ROLE_CLIENT)
            return userId == caseOwnerId;

        // AGENT: dossiers assignés
        if (userRole == ROLE_AGENT)
            return userId == caseOwnerId || caseCollaborators.Contains(userId);

        // ADMIN/OWNER: tous les dossiers
        return userRole == ROLE_ADMIN || userRole == ROLE_OWNER;
    }

    /// <summary>
    /// Obtient les fonctionnalités disponibles par rôle
    /// </summary>
    public static Dictionary<string, List<string>> GetFeaturesByRole()
    {
        return new Dictionary<string, List<string>>
        {
            [ROLE_CLIENT] = new List<string>
            {
                "US10 - Portail client suivi",
                "US11 - Upload guidé",
                "US19 - Paiement en ligne",
                "Consultation dossiers",
                "Consultation documents",
                "Messagerie avocat"
            },
            [ROLE_AGENT] = new List<string>
            {
                "US12 - Triage priorisé",
                "US13 - Checklist passation",
                "US1 - Ingestion multi-canaux",
                "US3 - Tâches dossier",
                "US2 - Notes (création)",
                "Gestion documents",
                "Communication clients"
            },
            [ROLE_ADMIN] = new List<string>
            {
                "US14 - Vue 360 consolidée",
                "US6 - Calendrier SLA",
                "US2 - Notes collaboratives",
                "US8 - Automatisations",
                "US7 - Facturation",
                "US15 - Charge équipe",
                "Gestion complète dossiers",
                "Gestion clients",
                "Supervision agents"
            },
            [ROLE_OWNER] = new List<string>
            {
                "US9 - Reporting direction",
                "US15 - Charge équipe",
                "US17 - Contrôles RGPD",
                "US16 - Pipeline finance",
                "US18 - Monitoring intégrations",
                "Gestion utilisateurs",
                "Configuration système",
                "Analytics avancées",
                "Toutes fonctionnalités"
            }
        };
    }
}
