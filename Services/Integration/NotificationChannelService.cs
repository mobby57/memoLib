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
            var accountSid = _config["Twilio:AccountSid"];
            var authToken = _config["Twilio:AuthToken"];
            var fromNumber = _config["Twilio:PhoneNumber"];

            if (string.IsNullOrWhiteSpace(accountSid) || string.IsNullOrWhiteSpace(authToken) || string.IsNullOrWhiteSpace(fromNumber))
            {
                _logger.LogWarning("Twilio non configuré (AccountSid/AuthToken/PhoneNumber)");
                return false;
            }

            var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("To", phoneNumber),
                new KeyValuePair<string, string>("From", fromNumber),
                new KeyValuePair<string, string>("Body", message)
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
            var authValue = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($"{accountSid}:{authToken}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authValue);

            var response = await _httpClient.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("SMS envoyé à {Phone}", phoneNumber);
                return true;
            }

            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Échec SMS Twilio: {Status} {Error}", response.StatusCode, error);
            return false;
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
            var vapidEndpoint = _config["Push:VapidEndpoint"];
            if (string.IsNullOrWhiteSpace(vapidEndpoint))
            {
                // Fallback: webhook générique
                var webhookUrl = _config["Push:WebhookUrl"];
                if (!string.IsNullOrWhiteSpace(webhookUrl))
                {
                    var payload = new { token, title, body = message, timestamp = DateTime.UtcNow };
                    var response = await _httpClient.PostAsJsonAsync(webhookUrl, payload);
                    return response.IsSuccessStatusCode;
                }

                _logger.LogWarning("Push notification non configuré (Push:VapidEndpoint ou Push:WebhookUrl)");
                return false;
            }

            var pushPayload = new { to = token, notification = new { title, body = message } };
            var pushResponse = await _httpClient.PostAsJsonAsync(vapidEndpoint, pushPayload);
            
            if (pushResponse.IsSuccessStatusCode)
            {
                _logger.LogInformation("Push notification envoyée: {Title}", title);
                return true;
            }

            _logger.LogWarning("Échec push: {Status}", pushResponse.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send push notification");
            return false;
        }
    }
}
