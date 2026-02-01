#!/usr/bin/env node
/**
 * Validation des variables d'environnement
 * IA Poste Manager v3.1 - Node.js/TypeScript
 */

require('dotenv').config();

const checkEnvVariables = () => {
    console.log('🔍 Vérification des variables d\'environnement');
    console.log('='.repeat(50));

    // Variables obligatoires
    const required = {
        'SECRET_KEY': 'Clé secrète application',
        'REDIS_HOST': 'Host Redis Cloud',
        'REDIS_PASSWORD': 'Mot de passe Redis'
    };

    // Variables par catégorie
    const categories = {
        '🔄 REDIS FALLBACK': {
            'REDIS_CLOUD_REST_URL': 'URL REST API Redis',
            'REDIS_CLOUD_API_KEY': 'Clé API REST Redis'
        },
        '🧠 IA SÉMANTIQUE': {
            'LANGCACHE_SERVER_URL': 'URL LangCache',
            'LANGCACHE_CACHE_ID': 'ID Cache LangCache',
            'LANGCACHE_API_KEY': 'Clé API LangCache'
        },
        '🤖 IA EXTERNES': {
            'OPENAI_API_KEY': 'Clé OpenAI',
            'ANTHROPIC_API_KEY': 'Clé Anthropic',
            'GOOGLE_AI_API_KEY': 'Clé Google AI',
            'HUGGINGFACE_API_TOKEN': 'Token HuggingFace'
        },
        '📧 EMAIL': {
            'SMTP_HOST': 'Serveur SMTP',
            'SMTP_USER': 'Utilisateur email',
            'SMTP_PASSWORD': 'Mot de passe email'
        },
        '🗄️ BASES DE DONNÉES': {
            'DATABASE_URL': 'URL PostgreSQL',
            'MONGO_URI': 'URI MongoDB',
            'SQLITE_PATH': 'Chemin SQLite'
        },
        '☁️ CLOUD STORAGE': {
            'AWS_ACCESS_KEY_ID': 'Clé AWS',
            'AWS_SECRET_ACCESS_KEY': 'Secret AWS',
            'AWS_BUCKET_NAME': 'Bucket S3'
        },
        '🔐 AUTHENTIFICATION': {
            'JWT_SECRET_KEY': 'Clé JWT',
            'OAUTH_GOOGLE_CLIENT_ID': 'Client ID Google',
            'OAUTH_MICROSOFT_CLIENT_ID': 'Client ID Microsoft'
        },
        '📊 MONITORING': {
            'REDIS_PROMETHEUS_ENDPOINT': 'Endpoint Prometheus',
            'SENTRY_DSN': 'DSN Sentry',
            'GOOGLE_ANALYTICS_ID': 'ID Google Analytics'
        },
        '🔔 WEBHOOKS': {
            'SLACK_WEBHOOK_URL': 'Webhook Slack',
            'TEAMS_WEBHOOK_URL': 'Webhook Teams',
            'ZAPIER_WEBHOOK_URL': 'Webhook Zapier'
        },
        '🔧 CONFIGURATION': {
            'REDIS_PORT': 'Port Redis',
            'PORT': 'Port application',
            'NODE_ENV': 'Environnement Node',
            'TIMEZONE': 'Fuseau horaire'
        }
    };

    const missingRequired = [];
    let totalConfigured = 0;
    let totalPossible = 0;

    console.log('\n✅ VARIABLES OBLIGATOIRES:');
    for (const [varName, desc] of Object.entries(required)) {
        const value = process.env[varName];
        if (value && !value.startsWith('your_')) {
            console.log(`  ✓ ${varName}: ${desc} - OK`);
        } else {
            console.log(`  ❌ ${varName}: ${desc} - MANQUANT`);
            missingRequired.push(varName);
        }
    }

    for (const [category, varsDict] of Object.entries(categories)) {
        console.log(`\n${category}:`);
        let categoryCount = 0;
        for (const [varName, desc] of Object.entries(varsDict)) {
            totalPossible++;
            const value = process.env[varName];
            if (value && !value.startsWith('your_') && value !== `your_${varName.toLowerCase()}_here`) {
                console.log(`  ✓ ${varName}: ${desc} - OK`);
                categoryCount++;
                totalConfigured++;
            } else {
                console.log(`  ⚪ ${varName}: ${desc} - Non configuré`);
            }
        }
        
        if (categoryCount > 0) {
            console.log(`    → ${categoryCount}/${Object.keys(varsDict).length} configurées`);
        }
    }

    console.log('\n📊 RÉSUMÉ:');
    console.log(`Variables obligatoires: ${Object.keys(required).length - missingRequired.length}/${Object.keys(required).length}`);
    console.log(`Variables optionnelles: ${totalConfigured}/${totalPossible}`);
    const completion = totalPossible > 0 ? (totalConfigured / totalPossible) * 100 : 0;
    console.log(`Taux de completion: ${completion.toFixed(1)}%`);

    if (missingRequired.length > 0) {
        console.log(`\n❌ ERREUR: Variables manquantes: ${missingRequired.join(', ')}`);
        console.log('➡️  Éditez votre fichier .env');
        return false;
    } else {
        console.log('\n✅ Configuration minimale OK!');
        
        if (completion >= 80) {
            console.log('🚀 Configuration ENTERPRISE - Toutes fonctionnalités!');
        } else if (completion >= 60) {
            console.log('⚡ Configuration PROFESSIONNELLE - Très complet!');
        } else if (completion >= 40) {
            console.log('🔧 Configuration AVANCÉE - Bon niveau!');
        } else if (completion >= 20) {
            console.log('📱 Configuration STANDARD - Fonctionnel!');
        } else {
            console.log('🔧 Configuration BASIQUE - Minimum viable!');
        }
        
        return true;
    }
};

if (require.main === module) {
    const success = checkEnvVariables();
    process.exit(success ? 0 : 1);
}

module.exports = { checkEnvVariables };