# 🚀 IAPosteManager v2.2 - Production Ready

Application web complète pour automatiser l'envoi d'emails avec génération IA, interface vocale et sécurité avancée.

## ✅ Status: Production Ready

- **39/39 tests E2E Playwright** ✅
- **Frontend React + Vite** ✅  
- **Backend Flask unifié** ✅
- **Interface d'accessibilité complète** ✅
- **Chiffrement AES-256** ✅
- **API REST documentée** ✅

## 📋 Features

### Core Features
- ✉️ **Automated Email Sending**: Send emails via REST API with SMTP integration
- 🤖 **AI-Powered Generation**: Generate email content using OpenAI GPT models
- 🎤 **Voice Interface**: Hands-free email composition with voice input
- 🔒 **AES-256 Encryption**: Secure data encryption for sensitive information
- ♿ **Accessibility**: WCAG 2.1 Level AA compliant interface
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

### Technical Features
- REST API with OpenAPI documentation
- CORS enabled for cross-origin requests
- Email validation and sanitization
- Error handling and logging
- Mock mode for development without credentials
- Environment-based configuration

## 🏗️ Architecture

```
iapostemanager/
├── backend/               # Flask REST API
│   ├── app.py            # Main application
│   ├── security.py       # AES-256 encryption
│   ├── email_service.py  # Email sending service
│   ├── ai_generator.py   # AI text generation
│   └── requirements.txt  # Python dependencies
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── package.json      # Node dependencies
│   └── vite.config.js    # Vite configuration
└── tests/                # E2E tests with Playwright
    ├── e2e/
    │   └── app.spec.js   # 39 comprehensive tests
    └── playwright.config.js
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mobby57/iapostemanager.git
cd iapostemanager
```

2. **Setup Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup Frontend**
```bash
cd frontend
npm install
```

4. **Setup Tests**
```bash
cd tests
npm install
npx playwright install
```

### Running the Application

1. **Start Backend** (Terminal 1)
```bash
cd backend
python app.py
```
Backend will run on http://localhost:5000

2. **Start Frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:3000

3. **Run Tests**
```bash
cd tests
npm test
```

## 📖 API Documentation

Once the backend is running, access the API documentation at:
- http://localhost:5000/api/docs

### API Endpoints

#### Health Check
```http
GET /api/health
```
Returns backend status and version.

#### Send Email
```http
POST /api/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "body": "Email body",
  "from": "sender@example.com" (optional)
}
```

#### AI Text Generation
```http
POST /api/ai/generate
Content-Type: application/json

{
  "prompt": "Write a professional email about...",
  "max_tokens": 500,
  "temperature": 0.7
}
```

#### Encrypt Data
```http
POST /api/security/encrypt
Content-Type: application/json

{
  "data": "sensitive data to encrypt"
}
```

#### Decrypt Data
```http
POST /api/security/decrypt
Content-Type: application/json

{
  "encrypted": "encrypted string"
}
```

#### Voice Transcription
```http
POST /api/voice/transcribe
```

## 🔒 Security

### Encryption
- **AES-256-CBC** encryption for sensitive data
- Random IV generation for each encryption
- PKCS7 padding
- Base64 encoding for transport

### Best Practices
- Environment variables for secrets
- HTTPS recommended for production
- CORS configured for specific origins
- Input validation and sanitization
- Email validation with email-validator
- Secure session management

### Configuration

Create a `.env` file in the backend directory:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-here
DEBUG=False
PORT=5000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@iapostemanager.com

# AI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Security Configuration
ENCRYPTION_KEY=your-base64-encoded-256-bit-key-here
```

## ♿ Accessibility Features

- **WCAG 2.1 Level AA Compliant**
- Screen reader support with ARIA labels
- Keyboard navigation support
- Focus visible indicators
- High contrast mode support
- Reduced motion support
- Semantic HTML structure
- Form labels and error messages
- Live regions for dynamic content

## 🧪 Testing

The project includes 39 comprehensive E2E tests covering:

- Application loading and rendering
- Backend connectivity
- Email composition and sending
- AI text generation
- Voice interface functionality
- Accessibility features
- Responsive design
- Error handling
- Form validation

### Run Tests
```bash
cd tests
npm test              # Run all tests
npm run test:headed   # Run with browser visible
npm run test:ui       # Run with UI mode
npm run test:report   # View test report
```

## 📦 Production Deployment

### Backend Deployment

1. Set production environment variables
2. Use a production WSGI server (gunicorn included):
```bash
gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app
```

3. Configure HTTPS/SSL certificate
4. Set up database (if needed for persistence)
5. Configure email SMTP settings

### Frontend Deployment

1. Build for production:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for API URL

### Recommended Hosting
- Backend: Heroku, AWS, DigitalOcean, Railway
- Frontend: Vercel, Netlify, GitHub Pages
- Database: PostgreSQL, MongoDB (if needed)

## 🛠️ Development

### Code Style
- Python: PEP 8
- JavaScript: ESLint configuration included
- React: Hooks and functional components
- CSS: BEM-like naming convention

### Adding Features

1. Backend: Add new resources in `backend/app.py`
2. Frontend: Create components in `frontend/src/components/`
3. Tests: Add tests in `tests/e2e/`
4. Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## 📞 Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/mobby57/iapostemanager/issues
- Documentation: http://localhost:5000/api/docs (when running)

## 🙏 Acknowledgments

- OpenAI for GPT API
- Flask framework
- React and Vite
- Playwright testing framework
- Cryptography library for encryption

---

**Version**: 2.2.0  
**Status**: Production Ready ✅  
**Last Updated**: December 2024
