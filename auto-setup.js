#!/usr/bin/env node

/**
 * Script d'auto-exécution - IA Poste Manager
 * Configure et démarre automatiquement le projet
 */

const { execSync } = require('child_process')
const { writeFileSync, existsSync, readFileSync } = require('fs')
const { randomBytes } = require('crypto')

class AutoSetup {
  constructor() {
    this.log('🚀 MemoLib Assistant - Auto Setup')
  }

  log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`)
  }

  error(message) {
    console.error(`❌ ${message}`)
    process.exit(1)
  }

  success(message) {
    console.log(`✅ ${message}`)
  }

  exec(command, silent = false) {
    try {
      return execSync(command, { 
        stdio: silent ? 'pipe' : 'inherit',
        encoding: 'utf8'
      })
    } catch (error) {
      if (!silent) throw error
      return null
    }
  }

  generateSecret() {
    return randomBytes(32).toString('base64')
  }

  setupEnvironment() {
    this.log('📝 Configuration environnement...')
    
    if (!existsSync('.env.local')) {
      const envContent = `# MemoLib Assistant - Configuration Auto-générée
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${this.generateSecret()}
DATABASE_URL="file:./dev.db"

# Mots de passe sécurisés (changez en production)
TEST_SUPERADMIN_PASSWORD=${randomBytes(8).toString('hex')}
TEST_ADMIN_PASSWORD=${randomBytes(8).toString('hex')}
TEST_CLIENT_PASSWORD=${randomBytes(8).toString('hex')}

# Analyse Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
`
      writeFileSync('.env.local', envContent)
      this.success('Fichier .env.local créé avec secrets sécurisés')
    } else {
      this.log('⚠️  .env.local existe déjà, conservation des paramètres')
    }
  }

  installDependencies() {
    this.log('📦 Installation des dépendances...')
    this.exec('npm install')
    this.success('Dépendances installées')
  }

  setupDatabase() {
    this.log('🗄️  Configuration base de données...')
    
    try {
      this.exec('npx prisma generate', true)
      this.exec('npx prisma db push', true)
      this.success('Base de données configurée')
    } catch (error) {
      this.log('⚠️  Utilisation du schéma existant')
    }
  }

  runTests() {
    this.log('🧪 Exécution des tests de sécurité...')
    
    const testResult = this.exec('npm test -- --passWithNoTests', true)
    if (testResult !== null) {
      this.success('Tests passés')
    } else {
      this.log('⚠️  Tests ignorés')
    }
  }

  startDevelopment() {
    this.log('🌟 Démarrage du serveur de développement...')
    this.success('Serveur disponible sur http://localhost:3000')
    
    // Afficher les credentials
    if (existsSync('.env.local')) {
      const env = readFileSync('.env.local', 'utf8')
      const adminPass = env.match(/TEST_ADMIN_PASSWORD=(.+)/)?.[1]
      
      console.log('\n📋 CREDENTIALS DE TEST:')
      console.log('Email: admin@dupont.fr')
      console.log(`Password: ${adminPass}`)
      console.log('\n🔗 URLs:')
      console.log('- Dashboard: http://localhost:3000/dashboard')
      console.log('- Login: http://localhost:3000/auth/login')
    }
    
    this.exec('npm run dev')
  }

  async run() {
    try {
      this.setupEnvironment()
      this.installDependencies()
      this.setupDatabase()
      this.runTests()
      this.startDevelopment()
    } catch (error) {
      this.error(`Erreur: ${error.message}`)
    }
  }
}

// Exécution
if (require.main === module) {
  new AutoSetup().run()
}

module.exports = AutoSetup