using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MemoLib.Api.Services;

namespace MemoLib.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SectorController : ControllerBase
{
    private readonly SectorAdapterService _sectorService;

    public SectorController(SectorAdapterService sectorService)
    {
        _sectorService = sectorService;
    }

    [HttpGet("available")]
    public IActionResult GetAvailableSectors()
    {
        var sectors = new[]
        {
            new { Code = "AVOCAT", Name = "Cabinet d'Avocat", Price = 49 },
            new { Code = "NOTAIRE", Name = "Étude Notariale", Price = 59 },
            new { Code = "HUISSIER", Name = "Étude d'Huissier", Price = 39 },
            new { Code = "EXPERT_COMPTABLE", Name = "Cabinet Comptable", Price = 69 },
            new { Code = "ARCHITECTE", Name = "Agence Architecture", Price = 79 },
            new { Code = "MEDECIN", Name = "Cabinet Médical", Price = 89 },
            new { Code = "MANAGER_ENTREPRISE", Name = "Manager Entreprise", Price = 29 },
            new { Code = "AGENT_IMMOBILIER", Name = "Agent Immobilier", Price = 39 },
            new { Code = "CONSULTANT", Name = "Consultant", Price = 49 }
        };

        return Ok(sectors);
    }

    [HttpGet("{sectorType}/config")]
    public IActionResult GetSectorConfig(string sectorType)
    {
        var config = _sectorService.GetSectorConfig(sectorType.ToUpper());
        return Ok(config);
    }

    [HttpGet("{sectorType}/templates")]
    public IActionResult GetSectorTemplates(string sectorType)
    {
        var templates = sectorType.ToUpper() switch
        {
            "AVOCAT" => new[]
            {
                "Accusé réception dossier",
                "Demande pièces complémentaires", 
                "Convocation rendez-vous",
                "Facture honoraires"
            },
            "NOTAIRE" => new[]
            {
                "Confirmation rendez-vous",
                "Liste pièces à fournir",
                "Projet d'acte",
                "Convocation signature"
            },
            "MEDECIN" => new[]
            {
                "Confirmation consultation",
                "Rappel vaccin",
                "Résultats analyses",
                "Ordonnance renouvelée"
            },
            "MANAGER_ENTREPRISE" => new[]
            {
                "Point équipe hebdomadaire",
                "Rapport d'avancement",
                "Demande budget",
                "Escalade problème"
            },
            "AGENT_IMMOBILIER" => new[]
            {
                "Confirmation visite",
                "Proposition prix",
                "Dossier locataire",
                "Rapport estimation"
            },
            "CONSULTANT" => new[]
            {
                "Proposition mission",
                "Rapport d'audit",
                "Facture prestation",
                "Suivi recommandations"
            },
            _ => new[] { "Message standard", "Accusé réception" }
        };

        return Ok(templates);
    }
}