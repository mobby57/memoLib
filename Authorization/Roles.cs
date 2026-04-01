namespace MemoLib.Api.Authorization;

public static class Roles
{
    // Rôles génériques multi-secteurs
    public const string User = "USER";              // Utilisateur standard
    public const string Agent = "AGENT";            // Agent/Employé opérationnel
    public const string Manager = "MANAGER";        // Manager/Superviseur
    public const string Admin = "ADMIN";            // Administrateur
    public const string Owner = "OWNER";            // Propriétaire/Super Admin
    
    // Groupes de rôles
    public const string AgentOrAbove = "AGENT,MANAGER,ADMIN,OWNER";
    public const string ManagerOrAbove = "MANAGER,ADMIN,OWNER";
    public const string AdminOrAbove = "ADMIN,OWNER";
    public const string OwnerOnly = "OWNER";
}
