using System.ComponentModel.DataAnnotations;

namespace MemoLib.Api.Models;

public class CaseNote
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid CaseId { get; set; }
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// Visibilité: private, team, client
    /// </summary>
    [Required]
    public string Visibility { get; set; } = "private";
    
    [Required]
    public Guid AuthorId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    /// <summary>
    /// Mentions @user stockées en JSON ["userId1", "userId2"]
    /// </summary>
    public string? Mentions { get; set; }
    
    // Navigation properties
    public Case? Case { get; set; }
    public User? Author { get; set; }
}
