# 🤖 OpenAI Integration Guide - IAPosteManager

## 📋 Overview

IAPosteManager now includes comprehensive OpenAI integration following all official best practices from the OpenAI API documentation. This integration provides advanced AI capabilities for email generation, text improvement, and content moderation.

## 🔧 Setup & Configuration

### 1. Environment Variables

Create a `.env` file based on `.env.template`:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_OPENAI_ORG_ID=org-your-organization-id-here  # Optional
VITE_OPENAI_PROJECT_ID=proj_your-project-id-here  # Optional

# Rate Limiting (Optional - defaults provided)
OPENAI_RATE_LIMIT_REQUESTS=50
OPENAI_RATE_LIMIT_TOKENS=40000
```

### 2. API Key Setup

1. **Get your API key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Organization ID**: Found in [Organization Settings](https://platform.openai.com/account/org-settings)
3. **Project ID**: Found in [Project Settings](https://platform.openai.com/settings/proj_xxx/general)

### 3. Security Best Practices

✅ **DO:**
- Store API keys in environment variables
- Use server-side API calls only
- Implement rate limiting
- Monitor usage and costs
- Use request IDs for debugging

❌ **DON'T:**
- Expose API keys in client-side code
- Commit API keys to version control
- Skip input validation
- Ignore rate limits

## 🚀 Features

### 1. Email Generation
- **Model**: GPT-4o-mini (cost-effective)
- **Features**: Professional/casual tone, context-aware
- **Fallback**: Template-based generation

### 2. Text Improvement
- **Purpose**: Improve dictated text quality
- **Features**: Grammar correction, style enhancement
- **Fallback**: Basic text formatting

### 3. Content Moderation
- **Model**: text-moderation-latest
- **Purpose**: Filter inappropriate content
- **Features**: Category-based flagging

### 4. Request Tracking
- **Feature**: Unique request IDs
- **Purpose**: Debugging and support
- **Headers**: X-Client-Request-Id

## 📡 API Endpoints

### Frontend Service (`/src/frontend/src/services/openai.js`)

```javascript
import { openaiService } from './openai.js';

// Chat completion
const response = await openaiService.chat.create(messages, {
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 1000
});

// Text improvement
const improved = await openaiHelpers.improveText(text, 'email');

// Content moderation
const moderation = await openaiHelpers.moderateContent(text);
```

### Backend Endpoints

```bash
# Email generation
POST /api/generate-email
{
  "context": "Meeting follow-up",
  "tone": "professional",
  "email_type": "follow-up"
}

# Text improvement
POST /api/ai/improve-text
{
  "text": "hello how are you doing",
  "tone": "professional",
  "context": "email"
}

# Content moderation
POST /api/ai/moderate
{
  "text": "Content to moderate"
}

# AI service health
GET /api/ai/health
```

## 🔍 Monitoring & Debugging

### Request Tracking

Every OpenAI request includes:
- **X-Client-Request-Id**: Custom tracking ID
- **Request logging**: Automatic logging with token usage
- **Error tracking**: Detailed error messages with request IDs

### Debug Headers

The service logs these OpenAI response headers:
- `x-request-id`: OpenAI's request ID
- `openai-processing-ms`: Processing time
- `x-ratelimit-remaining-requests`: Remaining requests
- `x-ratelimit-remaining-tokens`: Remaining tokens

### Example Debug Output

```javascript
console.debug('OpenAI API Request:', {
  requestId: 'iaposte_1703123456_abc123',
  'x-request-id': 'req_abc123def456',
  'openai-processing-ms': '1234',
  'x-ratelimit-remaining-requests': '49',
  'x-ratelimit-remaining-tokens': '39500'
});
```

## ⚡ Performance Optimizations

### 1. Model Selection
- **Primary**: `gpt-4o-mini` (cost-effective, fast)
- **Fallback**: Template-based generation
- **Moderation**: `text-moderation-latest`

### 2. Rate Limiting
- **Local tracking**: Prevents API errors
- **Conservative limits**: 50 requests/min, 40k tokens/min
- **Automatic reset**: Time-based counter reset

### 3. Caching
- **Frontend**: 5-minute cache for GET requests
- **Backend**: Session-based caching
- **Cleanup**: Automatic cache expiration

### 4. Error Handling
- **Graceful degradation**: Fallback to templates
- **Retry logic**: Built-in error recovery
- **User feedback**: Clear error messages

## 🛠️ Troubleshooting

### Common Issues

#### 1. "API key missing" Error
```bash
# Check environment variables
echo $VITE_OPENAI_API_KEY

# Verify .env file
cat .env | grep OPENAI
```

#### 2. Rate Limit Errors
```javascript
// Check rate limits
const limits = openaiService.utils.getRateLimits();
console.log('Current limits:', limits);
```

#### 3. Request Timeout
- **Default timeout**: 60 seconds
- **Increase if needed**: Modify timeout in service
- **Check network**: Verify internet connection

#### 4. Invalid Response Format
- **Check prompts**: Ensure proper formatting
- **Verify parsing**: Check response parsing logic
- **Fallback active**: Template generation should work

### Debug Mode

Enable debug logging:

```javascript
// Frontend
localStorage.setItem('debug', 'openai:*');

// Backend
app.logger.setLevel(logging.DEBUG);
```

## 💰 Cost Management

### Token Usage Optimization

1. **Use efficient models**: GPT-4o-mini vs GPT-4
2. **Limit max_tokens**: Set appropriate limits
3. **Cache responses**: Avoid duplicate requests
4. **Monitor usage**: Track token consumption

### Cost Estimation

```javascript
// Estimate tokens before request
const estimatedTokens = openaiService.utils.estimateTokens(text);
console.log(`Estimated cost: $${estimatedTokens * 0.00015}`);
```

## 🔒 Security Considerations

### 1. API Key Protection
- **Server-side only**: Never expose in frontend
- **Environment variables**: Use secure storage
- **Rotation**: Regularly rotate API keys

### 2. Input Validation
- **Sanitization**: Clean all user inputs
- **Length limits**: Prevent abuse
- **Content filtering**: Use moderation API

### 3. Rate Limiting
- **Per-user limits**: Implement user-based limits
- **IP-based limits**: Additional protection
- **Monitoring**: Track unusual usage patterns

## 📊 Usage Analytics

### Metrics to Track

1. **Request volume**: Requests per hour/day
2. **Token usage**: Total tokens consumed
3. **Error rates**: Failed requests percentage
4. **Response times**: Average processing time
5. **Cost tracking**: Daily/monthly spending

### Implementation

```javascript
// Track usage
const usage = {
  requests: 0,
  tokens: 0,
  errors: 0,
  cost: 0
};

// Update after each request
usage.requests++;
usage.tokens += response.usage.total_tokens;
usage.cost += response.usage.total_tokens * 0.00015;
```

## 🔄 Migration Guide

### From Old OpenAI Integration

1. **Update imports**:
   ```javascript
   // Old
   import openai from 'openai';
   
   // New
   import { openaiService } from './services/openai.js';
   ```

2. **Update API calls**:
   ```javascript
   // Old
   const response = await openai.createCompletion({...});
   
   // New
   const response = await openaiService.chat.create(messages, options);
   ```

3. **Update error handling**:
   ```javascript
   // Old
   try { ... } catch (error) { console.error(error); }
   
   // New
   try { ... } catch (error) { 
     console.error('Request ID:', error.requestId);
   }
   ```

## 🧪 Testing

### Unit Tests

```javascript
// Test AI service initialization
test('AI service initializes with API key', () => {
  const service = new UnifiedAIService('sk-test-key');
  expect(service.client).toBeDefined();
});

// Test fallback behavior
test('Falls back to templates when API fails', async () => {
  const service = new UnifiedAIService(); // No API key
  const result = await service.generate_email('test context');
  expect(result.source).toBe('template');
});
```

### Integration Tests

```bash
# Test API endpoints
curl -X POST http://localhost:5000/api/ai/health
curl -X POST http://localhost:5000/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"context": "test", "tone": "professional"}'
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Python Library](https://github.com/openai/openai-python)
- [Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

## 🆘 Support

For issues related to:
- **OpenAI API**: Check [OpenAI Status](https://status.openai.com/)
- **Integration bugs**: Check application logs
- **Performance**: Monitor token usage and response times
- **Costs**: Review usage in OpenAI dashboard

---

**🎉 Your IAPosteManager now has enterprise-grade AI capabilities!**