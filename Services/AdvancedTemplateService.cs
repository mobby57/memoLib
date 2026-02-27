using System.Text.RegularExpressions;
using MemoLib.Api.Models;

namespace MemoLib.Api.Services;

public class AdvancedTemplateService
{
    public string RenderTemplate(AdvancedTemplate template, Dictionary<string, object> variables)
    {
        var content = template.Content;

        // Replace variables
        foreach (var variable in variables)
        {
            var placeholder = $"{{{{{variable.Key}}}}}";
            content = content.Replace(placeholder, variable.Value?.ToString() ?? "");
        }

        // Process conditions
        foreach (var condition in template.Conditions)
        {
            if (variables.TryGetValue(condition.Variable, out var value))
            {
                var shouldInclude = EvaluateCondition(value, condition.Operator, condition.Value);
                var replacement = shouldInclude ? condition.ContentIfTrue : (condition.ContentIfFalse ?? "");
                
                var conditionPlaceholder = $"{{{{IF {condition.Variable} {condition.Operator} {condition.Value}}}}}";
                content = content.Replace(conditionPlaceholder, replacement);
            }
        }

        return content;
    }

    private bool EvaluateCondition(object value, string op, string expected)
    {
        var valueStr = value?.ToString() ?? "";
        
        return op switch
        {
            "equals" => valueStr.Equals(expected, StringComparison.OrdinalIgnoreCase),
            "notEquals" => !valueStr.Equals(expected, StringComparison.OrdinalIgnoreCase),
            "contains" => valueStr.Contains(expected, StringComparison.OrdinalIgnoreCase),
            "greaterThan" => double.TryParse(valueStr, out var v1) && double.TryParse(expected, out var e1) && v1 > e1,
            "lessThan" => double.TryParse(valueStr, out var v2) && double.TryParse(expected, out var e2) && v2 < e2,
            _ => false
        };
    }

    public Dictionary<string, object> ExtractVariablesFromCase(Case caseData, Client? client)
    {
        return new Dictionary<string, object>
        {
            ["caseTitle"] = caseData.Title,
            ["caseStatus"] = caseData.Status.ToString(),
            ["casePriority"] = caseData.Priority,
            ["caseCreatedDate"] = caseData.CreatedAt.ToString("dd/MM/yyyy"),
            ["clientName"] = client?.Name ?? "",
            ["clientEmail"] = client?.Email ?? "",
            ["clientPhone"] = client?.Phone ?? "",
            ["currentDate"] = DateTime.UtcNow.ToString("dd/MM/yyyy"),
            ["currentYear"] = DateTime.UtcNow.Year
        };
    }
}
