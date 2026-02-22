using System.Text.RegularExpressions;

namespace MemoLib.Api.Services;

public class EmbeddingService
{
    private readonly HashSet<string> _stopWords;

    public EmbeddingService()
    {
        _stopWords = new HashSet<string>
        {
            "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
            "has", "he", "in", "is", "it", "its", "of", "on", "or", "that",
            "the", "to", "was", "will", "with", "le", "la", "les", "de", "un", "une"
        };
    }

    public Dictionary<string, double> GenerateEmbedding(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return new Dictionary<string, double>();

        var tokens = Tokenize(text);
        var frequencies = CalculateFrequencies(tokens);

        return frequencies;
    }

    public double CalculateSimilarity(
        Dictionary<string, double> embedding1,
        Dictionary<string, double> embedding2)
    {
        if (embedding1.Count == 0 || embedding2.Count == 0)
            return 0;

        var dotProduct = 0.0;
        var magnitude1 = 0.0;
        var magnitude2 = 0.0;

        var allKeys = embedding1.Keys
            .Union(embedding2.Keys)
            .ToHashSet();

        foreach (var key in allKeys)
        {
            var v1 = embedding1.ContainsKey(key) ? embedding1[key] : 0;
            var v2 = embedding2.ContainsKey(key) ? embedding2[key] : 0;

            dotProduct += v1 * v2;
            magnitude1 += v1 * v1;
            magnitude2 += v2 * v2;
        }

        magnitude1 = Math.Sqrt(magnitude1);
        magnitude2 = Math.Sqrt(magnitude2);

        if (magnitude1 == 0 || magnitude2 == 0)
            return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }

    private List<string> Tokenize(string text)
    {
        var lower = text.ToLowerInvariant();
        var tokens = Regex.Split(lower, @"\W+")
            .Where(t => !string.IsNullOrEmpty(t) && t.Length > 2)
            .Where(t => !_stopWords.Contains(t))
            .ToList();

        return tokens;
    }

    private Dictionary<string, double> CalculateFrequencies(List<string> tokens)
    {
        var frequencies = new Dictionary<string, double>();

        foreach (var token in tokens)
        {
            if (frequencies.ContainsKey(token))
                frequencies[token]++;
            else
                frequencies[token] = 1;
        }

        var totalTokens = tokens.Count;
        if (totalTokens > 0)
        {
            foreach (var key in frequencies.Keys.ToList())
                frequencies[key] /= totalTokens;
        }

        return frequencies;
    }
}
