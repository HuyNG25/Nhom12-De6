using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

namespace ProjectMemberService.Services
{
    public class RabbitMqEventPublisher : IEventPublisher, IDisposable
    {
        private readonly ILogger<RabbitMqEventPublisher> _logger;
        private readonly IConfiguration _configuration;
        private IConnection? _connection;
        private IModel? _channel;
        private bool _isConnected = false;
        private readonly HttpClient _httpClient;

        public RabbitMqEventPublisher(IConfiguration configuration, ILogger<RabbitMqEventPublisher> logger)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = new HttpClient();
            TryConnect(configuration);
        }

        private void TryConnect(IConfiguration configuration)
        {
            try
            {
                var rabbitHost = configuration["RabbitMq:Host"] ?? "localhost";
                var factory = new ConnectionFactory
                {
                    HostName = rabbitHost,
                    UserName = "guest",
                    Password = "guest",
                    Port = 5672,
                    RequestedConnectionTimeout = TimeSpan.FromSeconds(5)
                };
                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();
                _isConnected = true;
                _logger.LogInformation("Connected to RabbitMQ at {Host}", rabbitHost);
            }
            catch (Exception ex)
            {
                _isConnected = false;
                _logger.LogWarning("Could not connect to RabbitMQ: {Message}. Events will be logged only.", ex.Message);
            }
        }

        public async Task PublishAsync<T>(string eventName, T eventData)
        {
            var message = JsonSerializer.Serialize(eventData);
            _logger.LogInformation("Publishing event [{EventName}]: {Message}", eventName, message);

            if (_isConnected && _channel != null && _channel.IsOpen)
            {
                try
                {
                    // Declare a fanout exchange for the event
                    _channel.ExchangeDeclare(exchange: eventName, type: ExchangeType.Fanout, durable: true, autoDelete: false);

                    var body = Encoding.UTF8.GetBytes(message);
                    var props = _channel.CreateBasicProperties();
                    props.ContentType = "application/json";
                    props.DeliveryMode = 2; // persistent

                    _channel.BasicPublish(
                        exchange: eventName,
                        routingKey: string.Empty,
                        basicProperties: props,
                        body: body
                    );

                    _logger.LogInformation("Event [{EventName}] published to RabbitMQ successfully.", eventName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish event [{EventName}] to RabbitMQ.", eventName);
                }
            }
            else
            {
                _logger.LogWarning("RabbitMQ not connected. Event [{EventName}] was logged but not published to broker.", eventName);
            }

            // HTTP POST to N3
            await PostToN3ApiAsync(eventData);
        }

        private async Task PostToN3ApiAsync<T>(T eventData)
        {
            try
            {
                var n3Url = _configuration["N3ApiUrl"] ?? "http://103.178.235.78:5003/api/events/consume";
                var jwtKey = _configuration["Jwt:Key"] ?? "SuperSecretKey_ProjectMemberService_2024_DoNotShare!";
                var issuer = _configuration["Jwt:Issuer"] ?? "ProjectMemberService";
                var audience = _configuration["Jwt:Audience"] ?? "ProjectMemberServiceClient";

                var tokenHandler = new JwtSecurityTokenHandler();
                var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, "system") }),
                    Expires = DateTime.UtcNow.AddMinutes(5),
                    Issuer = issuer,
                    Audience = audience,
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature)
                };
                var token = tokenHandler.CreateToken(tokenDescriptor);
                var jwt = tokenHandler.WriteToken(token);

                var requestMessage = new HttpRequestMessage(HttpMethod.Post, n3Url);
                requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);
                requestMessage.Content = new StringContent(JsonSerializer.Serialize(eventData), Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(requestMessage);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Successfully sent event to N3 via HTTP POST.");
                }
                else
                {
                    var errorStr = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to send event to N3. StatusCode: {StatusCode}, Error: {Error}", response.StatusCode, errorStr);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while sending event to N3 via HTTP.");
            }
        }

        public void Dispose()
        {
            try { _channel?.Close(); } catch { }
            try { _connection?.Close(); } catch { }
        }
    }
}
