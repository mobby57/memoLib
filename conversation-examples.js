// 🤖 OpenAI Conversations API - Usage Examples for IAPosteManager
// Demonstrates persistent conversation state for better AI interactions

import { openaiService, openaiHelpers, conversationAPI } from './services/openai.js';
import { apiService } from './services/api.js';

// =============================================================================
// 1. BASIC CONVERSATION MANAGEMENT
// =============================================================================

/**
 * Create a new email conversation project
 */
async function createEmailProject() {
  try {
    // Create conversation with initial context
    const conversation = await openaiHelpers.createEmailProject(
      'Newsletter Mensuel',
      'Création d\'une newsletter mensuelle pour nos clients'
    );
    
    console.log('✅ Conversation créée:', conversation.id);
    
    // Store conversation ID for later use
    localStorage.setItem('current_conversation', conversation.id);
    
    return conversation;
  } catch (error) {
    console.error('❌ Erreur création conversation:', error);
    return null;
  }
}

/**
 * Generate email with conversation context
 */
async function generateEmailWithContext(context, tone = 'professional') {
  try {
    const conversationId = localStorage.getItem('current_conversation');
    
    if (conversationId) {
      // Use existing conversation for context
      const email = await openaiHelpers.generateEmailWithContext(
        context,
        tone,
        conversationId
      );
      
      console.log('✅ Email généré avec contexte:', email.substring(0, 100) + '...');
      return email;
    } else {
      // Create new conversation first
      const conversation = await createEmailProject();
      if (conversation) {
        return generateEmailWithContext(context, tone);
      }
    }
  } catch (error) {
    console.error('❌ Erreur génération email:', error);
    // Fallback to simple generation
    return apiService.ai.generateContent(context, { tone });
  }
}

// =============================================================================
// 2. ITERATIVE EMAIL IMPROVEMENT
// =============================================================================

/**
 * Improve email iteratively using conversation context
 */
async function improveEmailIteratively(initialContext, iterations = 2) {
  try {
    // Create dedicated conversation for this email
    const conversation = await openaiService.conversations.create([], {
      purpose: 'email_improvement',
      project: 'iterative_generation',
      created_at: new Date().toISOString()
    });
    
    console.log('🔄 Démarrage amélioration itérative...');
    
    // Generate initial email
    let currentEmail = await openaiHelpers.generateEmailWithContext(
      initialContext,
      'professional',
      conversation.id
    );
    
    console.log('📝 Email initial généré');
    
    // Iterative improvements
    for (let i = 0; i < iterations; i++) {
      const improvementPrompt = `
Améliore cet email en:
- Rendant le ton plus engageant
- Améliorant la structure
- Ajoutant des éléments persuasifs

Email actuel:
${currentEmail}`;
      
      currentEmail = await openaiHelpers.generateEmailWithContext(
        improvementPrompt,
        'professional',
        conversation.id
      );
      
      console.log(`✨ Itération ${i + 1} terminée`);
    }
    
    // Analyze conversation history
    const analysis = await openaiHelpers.analyzeConversationHistory(conversation.id);
    console.log('📊 Analyse de la conversation:', analysis);
    
    return {
      finalEmail: currentEmail,
      conversationId: conversation.id,
      analysis
    };
    
  } catch (error) {
    console.error('❌ Erreur amélioration itérative:', error);
    return null;
  }
}

// =============================================================================
// 3. CONVERSATION HISTORY MANAGEMENT
// =============================================================================

/**
 * Get and display conversation history
 */
async function displayConversationHistory(conversationId) {
  try {
    const history = await conversationAPI.getConversationHistory(conversationId);
    
    console.log('📜 Historique de la conversation:');
    history.forEach((message, index) => {
      const role = message.role === 'user' ? '👤' : '🤖';
      const content = message.content.substring(0, 100) + '...';
      console.log(`${index + 1}. ${role} ${message.role}: ${content}`);
    });
    
    return history;
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    return [];
  }
}

/**
 * Save important conversations
 */
async function saveConversation(conversationId, title, tags = []) {
  try {
    const saved = await conversationAPI.saveConversation(conversationId, title, tags);
    console.log('💾 Conversation sauvegardée:', title);
    
    // Store in local favorites
    const favorites = JSON.parse(localStorage.getItem('favorite_conversations') || '[]');
    favorites.push({
      id: conversationId,
      title,
      tags,
      saved_at: new Date().toISOString()
    });
    localStorage.setItem('favorite_conversations', JSON.stringify(favorites));
    
    return saved;
  } catch (error) {
    console.error('❌ Erreur sauvegarde conversation:', error);
    return null;
  }
}

// =============================================================================
// 4. ADVANCED CONVERSATION FEATURES
// =============================================================================

/**
 * Multi-turn email consultation
 */
async function emailConsultation(initialRequest) {
  try {
    // Create consultation conversation
    const conversation = await openaiService.conversations.create([
      {
        type: 'message',
        role: 'system',
        content: [{
          type: 'input_text',
          text: 'Tu es un consultant expert en communication email. Aide l\'utilisateur à créer le meilleur email possible en posant des questions pertinentes.'
        }]
      },
      {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: initialRequest
        }]
      }
    ], {
      purpose: 'email_consultation',
      consultation_type: 'interactive'
    });
    
    console.log('🎯 Consultation email démarrée');
    
    // Interactive consultation loop
    let consultationActive = true;
    let turnCount = 0;
    
    while (consultationActive && turnCount < 5) {
      // Get AI response/question
      const response = await openaiService.chat.create([
        {
          role: 'system',
          content: 'Pose une question pertinente pour améliorer l\'email ou propose une version finale si tu as assez d\'informations.'
        }
      ], {
        max_tokens: 300,
        temperature: 0.7
      });
      
      const aiQuestion = response.choices[0].message.content;
      console.log('🤖 Question:', aiQuestion);
      
      // Add AI response to conversation
      await openaiService.conversations.addItems(conversation.id, [{
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: aiQuestion }]
      }]);
      
      // Check if consultation is complete
      if (aiQuestion.toLowerCase().includes('version finale') || 
          aiQuestion.toLowerCase().includes('email final')) {
        consultationActive = false;
        console.log('✅ Consultation terminée');
      }
      
      turnCount++;
    }
    
    return {
      conversationId: conversation.id,
      turns: turnCount,
      status: consultationActive ? 'ongoing' : 'completed'
    };
    
  } catch (error) {
    console.error('❌ Erreur consultation email:', error);
    return null;
  }
}

/**
 * Analyze conversation themes and patterns
 */
async function analyzeConversationPatterns(conversationIds) {
  try {
    const analyses = [];
    
    for (const id of conversationIds) {
      const analysis = await openaiHelpers.analyzeConversationHistory(id);
      if (analysis) {
        analyses.push({ id, ...analysis });
      }
    }
    
    // Aggregate patterns
    const allThemes = analyses.flatMap(a => a.themes || []);
    const themeFrequency = {};
    
    allThemes.forEach(theme => {
      themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
    });
    
    const topThemes = Object.entries(themeFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
    
    console.log('📈 Thèmes les plus fréquents:', topThemes);
    
    return {
      total_conversations: analyses.length,
      total_messages: analyses.reduce((sum, a) => sum + a.total_messages, 0),
      average_length: analyses.reduce((sum, a) => sum + a.total_messages, 0) / analyses.length,
      top_themes: topThemes,
      analyses
    };
    
  } catch (error) {
    console.error('❌ Erreur analyse patterns:', error);
    return null;
  }
}

// =============================================================================
// 5. INTEGRATION WITH IAPOSTEMANAGER UI
// =============================================================================

/**
 * Initialize conversation features in the UI
 */
function initializeConversationUI() {
  // Add conversation controls to AI generator page
  const aiGeneratorPage = document.querySelector('#ai-generator-page');
  if (aiGeneratorPage) {
    const conversationControls = document.createElement('div');
    conversationControls.className = 'conversation-controls';
    conversationControls.innerHTML = `
      <div class="conversation-panel">
        <h3>💬 Conversation Persistante</h3>
        <div class="conversation-status">
          <span id="conversation-status">Aucune conversation active</span>
          <button id="new-conversation-btn" class="btn btn-primary">Nouvelle Conversation</button>
        </div>
        <div class="conversation-history" id="conversation-history" style="display: none;">
          <h4>Historique</h4>
          <div id="history-list"></div>
        </div>
      </div>
    `;
    
    aiGeneratorPage.insertBefore(conversationControls, aiGeneratorPage.firstChild);
    
    // Event listeners
    document.getElementById('new-conversation-btn').addEventListener('click', async () => {
      const conversation = await createEmailProject();
      if (conversation) {
        updateConversationStatus(conversation.id);
      }
    });
  }
}

/**
 * Update conversation status in UI
 */
function updateConversationStatus(conversationId) {
  const statusElement = document.getElementById('conversation-status');
  if (statusElement) {
    statusElement.textContent = `Conversation active: ${conversationId.substring(0, 8)}...`;
    statusElement.className = 'status-active';
  }
  
  // Show history panel
  const historyPanel = document.getElementById('conversation-history');
  if (historyPanel) {
    historyPanel.style.display = 'block';
    loadConversationHistory(conversationId);
  }
}

/**
 * Load and display conversation history
 */
async function loadConversationHistory(conversationId) {
  try {
    const history = await conversationAPI.getConversationHistory(conversationId, 10);
    const historyList = document.getElementById('history-list');
    
    if (historyList) {
      historyList.innerHTML = history.map((message, index) => `
        <div class="history-item ${message.role}">
          <div class="message-role">${message.role === 'user' ? '👤 Vous' : '🤖 Assistant'}</div>
          <div class="message-content">${message.content.substring(0, 150)}...</div>
          <div class="message-time">${new Date(message.timestamp * 1000).toLocaleString()}</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('❌ Erreur chargement historique UI:', error);
  }
}

// =============================================================================
// 6. EXPORT FUNCTIONS FOR USE IN APP
// =============================================================================

export {
  createEmailProject,
  generateEmailWithContext,
  improveEmailIteratively,
  displayConversationHistory,
  saveConversation,
  emailConsultation,
  analyzeConversationPatterns,
  initializeConversationUI,
  updateConversationStatus,
  loadConversationHistory
};

console.log('🚀 OpenAI Conversations API integration loaded for IAPosteManager');