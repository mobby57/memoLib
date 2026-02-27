namespace MemoLib.Api.Authorization;

public static class Policies
{
    // Gestion des dossiers/cas
    public const string ViewCases = "ViewCases";
    public const string CreateCases = "CreateCases";
    public const string EditCases = "EditCases";
    public const string AssignCases = "AssignCases";
    public const string CloseCases = "CloseCases";
    public const string DeleteCases = "DeleteCases";
    public const string ExportCases = "ExportCases";
    
    // Gestion des contacts/clients
    public const string ViewContacts = "ViewContacts";
    public const string CreateContacts = "CreateContacts";
    public const string EditContacts = "EditContacts";
    public const string DeleteContacts = "DeleteContacts";
    public const string ExportContacts = "ExportContacts";
    
    // Communication
    public const string ViewMessages = "ViewMessages";
    public const string SendMessages = "SendMessages";
    public const string DeleteMessages = "DeleteMessages";
    public const string UseTemplates = "UseTemplates";
    public const string ManageTemplates = "ManageTemplates";
    
    // Documents & Pièces jointes
    public const string ViewDocuments = "ViewDocuments";
    public const string UploadDocuments = "UploadDocuments";
    public const string DeleteDocuments = "DeleteDocuments";
    public const string ShareDocuments = "ShareDocuments";
    
    // Analytics & Rapports
    public const string ViewAnalytics = "ViewAnalytics";
    public const string ViewReports = "ViewReports";
    public const string ExportReports = "ExportReports";
    
    // Administration
    public const string ManageUsers = "ManageUsers";
    public const string ManageRoles = "ManageRoles";
    public const string ManageSettings = "ManageSettings";
    public const string ViewAuditLogs = "ViewAuditLogs";
    public const string ManageIntegrations = "ManageIntegrations";
    public const string ManageBilling = "ManageBilling";
}
