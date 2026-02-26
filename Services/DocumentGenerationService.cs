using System.Text;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class DocumentGenerationService
{
    public async Task<byte[]> GenerateContractAsync(string templateName, Client client, Case legalCase)
    {
        var template = GetTemplate(templateName);
        
        var content = template
            .Replace("{{CLIENT_NAME}}", client.Name)
            .Replace("{{CLIENT_EMAIL}}", client.Email)
            .Replace("{{CLIENT_PHONE}}", client.PhoneNumber ?? "N/A")
            .Replace("{{CLIENT_ADDRESS}}", client.Address ?? "N/A")
            .Replace("{{CASE_TITLE}}", legalCase.Title)
            .Replace("{{CASE_ID}}", legalCase.Id.ToString())
            .Replace("{{DATE}}", DateTime.Now.ToString("dd/MM/yyyy"))
            .Replace("{{YEAR}}", DateTime.Now.Year.ToString());

        return Encoding.UTF8.GetBytes(content);
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice, Client client, List<TimeEntry> timeEntries)
    {
        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial; margin: 40px; }}
        .header {{ text-align: center; margin-bottom: 40px; }}
        .invoice-info {{ margin-bottom: 30px; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
        .total {{ font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>FACTURE</h1>
        <p>N° {invoice.InvoiceNumber}</p>
    </div>
    
    <div class='invoice-info'>
        <p><strong>Client:</strong> {client.Name}</p>
        <p><strong>Email:</strong> {client.Email}</p>
        <p><strong>Date d'émission:</strong> {invoice.IssueDate:dd/MM/yyyy}</p>
        <p><strong>Date d'échéance:</strong> {invoice.DueDate:dd/MM/yyyy}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Durée (h)</th>
                <th>Taux horaire</th>
                <th>Montant</th>
            </tr>
        </thead>
        <tbody>
            {string.Join("", timeEntries.Select(t => $@"
            <tr>
                <td>{t.Description}</td>
                <td>{t.Duration:F2}</td>
                <td>{t.HourlyRate:C}</td>
                <td>{t.Amount:C}</td>
            </tr>"))}
        </tbody>
    </table>
    
    <div class='total'>
        <p>Sous-total: {invoice.TotalAmount:C}</p>
        <p>TVA (20%): {invoice.TaxAmount:C}</p>
        <p>TOTAL TTC: {invoice.TotalWithTax:C}</p>
    </div>
</body>
</html>";

        return Encoding.UTF8.GetBytes(html);
    }

    private string GetTemplate(string templateName)
    {
        return templateName switch
        {
            "contrat-honoraires" => @"
CONTRAT D'HONORAIRES

Entre les soussignés:

Le Cabinet d'Avocats, représenté par Maître [NOM_AVOCAT]
Et
{{CLIENT_NAME}}, domicilié(e) à {{CLIENT_ADDRESS}}

Il a été convenu ce qui suit:

Article 1 - Objet de la mission
Le Cabinet s'engage à assister {{CLIENT_NAME}} dans le cadre du dossier: {{CASE_TITLE}}

Article 2 - Honoraires
Les honoraires sont fixés selon le barème en vigueur.

Fait à [VILLE], le {{DATE}}

Signature du Client                    Signature de l'Avocat
",
            _ => "Template non trouvé"
        };
    }
}