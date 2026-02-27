using Microsoft.Extensions.Configuration;

namespace MemoLib.Api.Services;

public class SectorAdapterService
{
    private readonly IConfiguration _config;
    
    public SectorAdapterService(IConfiguration config)
    {
        _config = config;
    }

    public SectorConfig GetSectorConfig(string sectorType)
    {
        var sector = _config.GetSection($"Sectors:{sectorType}").Get<SectorConfig>();
        return sector ?? GetDefaultSector();
    }

    private SectorConfig GetDefaultSector()
    {
        return new SectorConfig
        {
            Name = "Professionnel Libéral",
            CaseTypes = new[] { "Consultation", "Suivi", "Urgence" },
            ClientTypes = new[] { "Particulier", "Entreprise" },
            Pricing = new PricingConfig { Monthly = 49, Annual = 490 },
            Features = new[] { "Email", "Dossiers", "Recherche" }
        };
    }
}

public class SectorConfig
{
    public string Name { get; set; } = "";
    public string[] CaseTypes { get; set; } = Array.Empty<string>();
    public string[] ClientTypes { get; set; } = Array.Empty<string>();
    public PricingConfig Pricing { get; set; } = new();
    public string[] Features { get; set; } = Array.Empty<string>();
}

public class PricingConfig
{
    public decimal Monthly { get; set; }
    public decimal Annual { get; set; }
}