// nodejs-api/src/app.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Redis = require('redis');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

class LegalAIAPI {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: { origin: "*", methods: ["GET", "POST"] }
        });
        this.redis = Redis.createClient({ url: process.env.REDIS_URL });
        this.pythonAI = process.env.PYTHON_AI_URL || 'http://localhost:8000';
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Route santé
        this.app.get('/health', (req, res) => {
            res.json({ status: 'OK', service: 'Legal AI API', timestamp: new Date().toISOString() });
        });

        // Routes emails
        this.app.post('/api/emails/analyze', this.analyzeEmail.bind(this));
        this.app.get('/api/emails/priority/:priority', this.getEmailsByPriority.bind(this));
        this.app.post('/api/emails/batch-analyze', this.batchAnalyzeEmails.bind(this));

        // Routes clients
        this.app.get('/api/clients', this.getClients.bind(this));
        this.app.post('/api/clients', this.createClient.bind(this));
        this.app.put('/api/clients/:id', this.updateClient.bind(this));

        // Routes dossiers
        this.app.get('/api/dossiers', this.getDossiers.bind(this));
        this.app.post('/api/dossiers', this.createDossier.bind(this));
        this.app.put('/api/dossiers/:id/status', this.updateDossierStatus.bind(this));

        // Routes règles métier
        this.app.get('/api/rules', this.getRules.bind(this));
        this.app.post('/api/rules', this.createRule.bind(this));
        this.app.put('/api/rules/:id', this.updateRule.bind(this));

        // Route dashboard
        this.app.get('/api/dashboard/stats', this.getDashboardStats.bind(this));
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log('Client connecté:', socket.id);

            socket.on('join-cabinet', (cabinetId) => {
                socket.join(`cabinet-${cabinetId}`);
                console.log(`Client ${socket.id} rejoint cabinet ${cabinetId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client déconnecté:', socket.id);
            });
        });
    }

    // Analyse email avec cache intelligent
    async analyzeEmail(req, res) {
        try {
            const emailData = req.body;
            const cacheKey = `email:analysis:${emailData.id}`;
            
            // Vérifier cache Redis
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                return res.json(JSON.parse(cached));
            }

            // Appel service Python IA
            const response = await axios.post(`${this.pythonAI}/analyze-email`, emailData, {
                timeout: 10000
            });

            const analysis = response.data;

            // Cache résultat (5 minutes)
            await this.redis.setex(cacheKey, 300, JSON.stringify(analysis));

            // Notification temps réel si urgent
            if (analysis.priority === 'critique' || analysis.priority === 'urgent') {
                this.notifyUrgentEmail(emailData.cabinetId, analysis);
            }

            res.json(analysis);
        } catch (error) {
            console.error('Erreur analyse email:', error);
            res.status(500).json({ error: 'Erreur analyse email' });
        }
    }

    // Analyse batch optimisée
    async batchAnalyzeEmails(req, res) {
        try {
            const { emails } = req.body;
            const batchSize = 10; // Traiter par batch de 10
            const results = [];

            for (let i = 0; i < emails.length; i += batchSize) {
                const batch = emails.slice(i, i + batchSize);
                const batchPromises = batch.map(email => this.analyzeEmailInternal(email));
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }

            res.json({ analyses: results, total: results.length });
        } catch (error) {
            console.error('Erreur batch analyse:', error);
            res.status(500).json({ error: 'Erreur batch analyse' });
        }
    }

    async analyzeEmailInternal(emailData) {
        const cacheKey = `email:analysis:${emailData.id}`;
        const cached = await this.redis.get(cacheKey);
        
        if (cached) return JSON.parse(cached);

        try {
            const response = await axios.post(`${this.pythonAI}/analyze-email`, emailData);
            const analysis = response.data;
            await this.redis.setex(cacheKey, 300, JSON.stringify(analysis));
            return analysis;
        } catch (error) {
            return { error: 'Analyse échouée', email_id: emailData.id };
        }
    }

    // Emails par priorité avec pagination
    async getEmailsByPriority(req, res) {
        try {
            const { priority } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            const cacheKey = `emails:priority:${priority}:${page}:${limit}`;
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {
                return res.json(JSON.parse(cached));
            }

            // Simulation données (remplacer par vraie DB)
            const emails = await this.getEmailsFromDB(priority, page, limit);
            
            await this.redis.setex(cacheKey, 60, JSON.stringify(emails));
            res.json(emails);
        } catch (error) {
            res.status(500).json({ error: 'Erreur récupération emails' });
        }
    }

    // Gestion clients
    async getClients(req, res) {
        try {
            const cacheKey = 'clients:all';
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {
                return res.json(JSON.parse(cached));
            }

            const clients = await this.getClientsFromDB();
            await this.redis.setex(cacheKey, 300, JSON.stringify(clients));
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: 'Erreur récupération clients' });
        }
    }

    async createClient(req, res) {
        try {
            const clientData = req.body;
            
            // Validation
            if (!clientData.nom || !clientData.email) {
                return res.status(400).json({ error: 'Nom et email requis' });
            }

            // Appel service Python pour créer profil
            const response = await axios.post(`${this.pythonAI}/clients`, clientData);
            
            // Invalider cache
            await this.redis.del('clients:all');
            
            res.status(201).json(response.data);
        } catch (error) {
            res.status(500).json({ error: 'Erreur création client' });
        }
    }

    // Dashboard statistiques
    async getDashboardStats(req, res) {
        try {
            const cacheKey = 'dashboard:stats';
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {
                return res.json(JSON.parse(cached));
            }

            // Appel service Python pour stats
            const response = await axios.get(`${this.pythonAI}/dashboard/stats`);
            const stats = response.data;
            
            // Cache 1 minute
            await this.redis.setex(cacheKey, 60, JSON.stringify(stats));
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: 'Erreur récupération statistiques' });
        }
    }

    // Notification temps réel
    notifyUrgentEmail(cabinetId, emailAnalysis) {
        this.io.to(`cabinet-${cabinetId}`).emit('urgent-email', {
            id: emailAnalysis.email_id,
            priority: emailAnalysis.priority,
            client: emailAnalysis.client_name,
            subject: emailAnalysis.subject,
            actions: emailAnalysis.suggested_actions,
            timestamp: new Date().toISOString()
        });
    }

    // Méthodes simulées (remplacer par vraie DB)
    async getEmailsFromDB(priority, page, limit) {
        // Simulation
        return {
            emails: [
                {
                    id: '001',
                    sender: 'ahmed.hassan@email.com',
                    subject: 'URGENT - OQTF reçue',
                    priority: priority,
                    date: new Date().toISOString()
                }
            ],
            total: 1,
            page: parseInt(page),
            limit: parseInt(limit)
        };
    }

    async getClientsFromDB() {
        return [
            {
                id: '1',
                nom: 'Ahmed HASSAN',
                email: 'ahmed.hassan@email.com',
                procedure: 'OQTF',
                status: 'actif'
            }
        ];
    }

    async start(port = 3000) {
        await this.redis.connect();
        
        this.server.listen(port, () => {
            console.log(`🚀 Legal AI API démarrée sur port ${port}`);
            console.log(`📊 Dashboard: http://localhost:${port}/health`);
        });
    }
}

// Démarrage
if (require.main === module) {
    const api = new LegalAIAPI();
    api.start(process.env.PORT || 3000);
}

module.exports = LegalAIAPI;