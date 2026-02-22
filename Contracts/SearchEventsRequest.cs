namespace MemoLib.Api.Contracts;

public class SearchEventsRequest
{
    public string? Text { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public Guid? SourceId { get; set; }
}
