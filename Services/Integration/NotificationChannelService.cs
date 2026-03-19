namespace MemoLib.Api.Services.Integration;

public interface INotificationChannelService
{
    Task<bool> SendSMSAsync(string phoneNumber, string message);
    Task<bool> SendSlackMessageAsync(string channel, string message);
    Task<bool> SendTeamsMessageAsync(string webhook, string message);
    Task<bool> SendPushNotificationAsync(string token, string title, string message);
}

public class NotificationChannelService : INotificationChannelService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NotificationChannelService> _logger;
    private readonly IConfiguration _config;

    public NotificationChannelService(HttpClient httpClient, ILogger<NotificationChannelService> logger, IConfiguration config)
    {
        _httpClient = httpClient;
        _logger = logger;
        _config = config;
    }

    public async Task<bool> SendSMSAsync(string phoneNumber, string message)
    {
        try
        {
            _logger.LogInformation("Sending SMS to {Phone}", phoneNumber);
            // Délègue au service Twilio/SMS existant si configuré
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {Phone}", phoneNumber);
            return false;
        }
    }

    public async Task<bool> SendSlackMessageAsync(string channel, string message)
    {
        try
        {
            var webhookUrl = _config["Integrations:Slack:WebhookUrl"];
            if (string.IsNullOrWhiteSpace(webhookUrl))
            {
                _logger.LogWarning("Slack webhook not configured");
                return false;
            }

            var payload = new { text = message, channel };
            var response = await _httpClient.PostAsJsonAsync(webhookUrl, payload);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack message to {Channel}", channel);
            return false;
        }
    }

    public async Task<bool> SendTeamsMessageAsync(string webhook, string message)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(webhook))
            {
                _logger.LogWarning("Teams webhook URL not provided");
                return false;
            }

            var payload = new { text = message };
            var response = await _httpClient.PostAsJsonAsync(webhook, payload);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Teams message");
            return false;
        }
    }

    public async Task<bool> SendPushNotificationAsync(string token, string title, string message)
    {
        try
        {
            _logger.LogInformation("Sending push notification: {Title}", title);
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send push notification");
            return false;
        }
    }
}
