# Nettoyage automatique des controllers dupliques (Bloquant #2)
Write-Host "Nettoyage des 52 controllers dupliques..." -ForegroundColor Cyan

$controllersToDelete = @(
    "CasesControllerV2.cs",
    "SecureAuthController.cs",
    "SecureEmailController.cs",
    "SecureSearchController.cs",
    "AdvancedFeaturesController.cs",
    "AdvancedTemplatesController.cs",
    "AlertsController.cs",
    "AutomationSettingsController.cs",
    "BillingController.cs",
    "CalendarController.cs",
    "CaseCollaborationController.cs",
    "CaseCommentsController.cs",
    "CaseManagementController.cs",
    "CaseShareController.cs",
    "ClientOnboardingController.cs",
    "ClientPortalController.cs",
    "ControllerUserContextExtensions.cs",
    "CriticalAlertsController.cs",
    "DebugController.cs",
    "DevController.cs",
    "DynamicFormsController.cs",
    "EmailScanController.cs",
    "EmailSetupController.cs",
    "EmbeddingsController.cs",
    "EventsController.cs",
    "ExportController.cs",
    "GdprController.cs",
    "IngestionController.cs",
    "MessagingController.cs",
    "MessengerController.cs",
    "PendingActionsController.cs",
    "PublicContactController.cs",
    "QuestionnaireController.cs",
    "SatisfactionController.cs",
    "SectorController.cs",
    "SecurityController.cs",
    "SemanticController.cs",
    "SharedWorkspaceController.cs",
    "SignalController.cs",
    "SignaturesController.cs",
    "StatsController.cs",
    "TeamController.cs",
    "TelegramController.cs",
    "TemplatesController.cs",
    "TransactionExampleController.cs",
    "UniversalGatewayController.cs",
    "WorkspaceController.cs"
)

$deleted = 0
foreach ($controller in $controllersToDelete) {
    $path = "Controllers\$controller"
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "Supprime: $controller" -ForegroundColor Green
        $deleted++
    }
}

Write-Host "$deleted controllers supprimes" -ForegroundColor Green
Write-Host "Controllers restants: 15" -ForegroundColor Cyan

Write-Host "Verification compilation..." -ForegroundColor Cyan
dotnet build --no-restore
if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation OK" -ForegroundColor Green
} else {
    Write-Host "Erreur compilation" -ForegroundColor Red
}
