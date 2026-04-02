# 🔐 GUIDE IMPLÉMENTATION RBAC - MEMOLIB

## Utilisation de RbacConfig dans les Controllers

### Exemple 1: US10 - Portail Client (CasesController)

```csharp
[HttpGet("client/my-cases")]
[Authorize]
public async Task<IActionResult> GetMyCases()
{
    var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
    var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "AGENT";

    // Vérifier permission
    if (!RbacConfig.HasPermission(userRole, RbacConfig.PortailClient.ViewOwnCases))
        return Forbid();

    // CLIENT voit uniquement ses dossiers
    var cases = await _context.Cases
        .Where(c => c.ClientId == userId)
        .ToListAsync();

    return Ok(cases);
}
```

### Exemple 2: US12 - Triage Assistant (TriageController)

```csharp
[HttpGet("queue")]
[Authorize]
public async Task<IActionResult> GetTriageQueue()
{
    var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "AGENT";

    // Seuls AGENT/ADMIN/OWNER peuvent voir la file
    if (!RbacConfig.HasPermission(userRole, RbacConfig.TriageAssistant.ViewQueue))
        return Forbid();

    var queue = await _context.Cases
        .Where(c => c.Status == "PENDING_TRIAGE")
        .OrderByDescending(c => c.Priority)
        .ThenBy(c => c.CreatedAt)
        .ToListAsync();

    return Ok(queue);
}
```

### Exemple 3: US14 - Vue 360 Juriste (CasesController)

```csharp
[HttpGet("{id}/consolidated")]
[Authorize]
public async Task<IActionResult> GetConsolidatedView(Guid id)
{
    var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "AGENT";

    // Seuls ADMIN/OWNER ont accès à la vue 360
    if (!RbacConfig.HasPermission(userRole, RbacConfig.Vue360Juriste.ViewConsolidated))
        return Forbid();

    var caseData = await _context.Cases
        .Include(c => c.Notes)
        .Include(c => c.Tasks)
        .Include(c => c.Events)
        .Include(c => c.Documents)
        .FirstOrDefaultAsync(c => c.Id == id);

    return Ok(caseData);
}
```

### Exemple 4: US9 - Reporting Direction (ReportsController)

```csharp
[HttpGet("dashboard")]
[Authorize]
public async Task<IActionResult> GetDirectionDashboard()
{
    var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "AGENT";

    // Seul OWNER peut voir le dashboard direction
    if (!RbacConfig.HasPermission(userRole, RbacConfig.ReportingDirection.ViewDashboard))
        return Forbid();

    var kpis = new
    {
        TotalCases = await _context.Cases.CountAsync(),
        ActiveCases = await _context.Cases.CountAsync(c => c.Status == "IN_PROGRESS"),
        TeamLoad = await GetTeamLoadData(),
        Revenue = await GetRevenueData()
    };

    return Ok(kpis);
}
```

## Middleware d'Autorisation Centralisé

```csharp
public class RbacAuthorizationMiddleware
{
    private readonly RequestDelegate _next;

    public RbacAuthorizationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var authorizeAttribute = endpoint?.Metadata.GetMetadata<AuthorizeAttribute>();

        if (authorizeAttribute != null)
        {
            var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Log accès pour audit
            LogAccess(context, userRole);
        }

        await _next(context);
    }

    private void LogAccess(HttpContext context, string? role)
    {
        // Implémenter logging pour US5 - Audit
    }
}
```

## Tests Unitaires par Rôle

```csharp
[Fact]
public async Task Client_CanViewOwnCases_Only()
{
    // Arrange
    var client = CreateUser("CLIENT");
    var otherClient = CreateUser("CLIENT");
    
    var case1 = CreateCase(clientId: client.Id);
    var case2 = CreateCase(clientId: otherClient.Id);

    // Act
    var result = await _controller.GetMyCases();

    // Assert
    var cases = Assert.IsType<List<Case>>(result.Value);
    Assert.Single(cases);
    Assert.Equal(case1.Id, cases[0].Id);
}

[Fact]
public async Task Agent_CannotAccessReportingDashboard()
{
    // Arrange
    SetUserRole("AGENT");

    // Act
    var result = await _reportsController.GetDirectionDashboard();

    // Assert
    Assert.IsType<ForbidResult>(result);
}
```

## Ordre d'Implémentation Recommandé

1. **Semaine 1-2: CLIENT (US10, US11, US19)**
2. **Semaine 3-4: AGENT (US12, US13, US1)**
3. **Semaine 5-7: ADMIN (US14, US6, US2)**
4. **Semaine 8-10: OWNER (US9, US15, US17)**
