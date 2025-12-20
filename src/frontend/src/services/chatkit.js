/**
 * OpenAI ChatKit API Service (Beta)
 * Manages ChatKit sessions, threads, and file uploads for internal integrations
 */

class ChatKitService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1/chatkit';
    this.betaHeader = 'chatkit_beta=v1';
  }

  /**
   * Create ChatKit session
   */
  async createSession(user, workflow, options = {}) {
    try {
      const {
        chatkit_configuration = {},
        expires_after = { seconds: 600 }, // 10 minutes default
        rate_limits = { max_requests_per_1_minute: 10 }
      } = options;

      const response = await fetch(`${this.baseURL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        },
        body: JSON.stringify({
          user,
          workflow,
          chatkit_configuration,
          expires_after,
          rate_limits
        })
      });

      if (!response.ok) {
        throw new Error(`Create session failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }

  /**
   * Cancel ChatKit session
   */
  async cancelSession(sessionId) {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`Cancel session failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cancel session error:', error);
      throw error;
    }
  }

  /**
   * List ChatKit threads
   */
  async listThreads(options = {}) {
    try {
      const {
        after = null,
        before = null,
        limit = 20,
        order = 'desc',
        user = null
      } = options;

      const params = new URLSearchParams();
      if (after) params.append('after', after);
      if (before) params.append('before', before);
      params.append('limit', limit.toString());
      params.append('order', order);
      if (user) params.append('user', user);

      const response = await fetch(`${this.baseURL}/threads?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`List threads failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List threads error:', error);
      throw error;
    }
  }

  /**
   * Retrieve ChatKit thread
   */
  async getThread(threadId) {
    try {
      const response = await fetch(`${this.baseURL}/threads/${threadId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`Get thread failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get thread error:', error);
      throw error;
    }
  }

  /**
   * Delete ChatKit thread
   */
  async deleteThread(threadId) {
    try {
      const response = await fetch(`${this.baseURL}/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`Delete thread failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete thread error:', error);
      throw error;
    }
  }

  /**
   * List ChatKit thread items
   */
  async listThreadItems(threadId, options = {}) {
    try {
      const {
        after = null,
        before = null,
        limit = 20,
        order = 'desc'
      } = options;

      const params = new URLSearchParams();
      if (after) params.append('after', after);
      if (before) params.append('before', before);
      params.append('limit', limit.toString());
      params.append('order', order);

      const response = await fetch(`${this.baseURL}/threads/${threadId}/items?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'OpenAI-Beta': this.betaHeader
        }
      });

      if (!response.ok) {
        throw new Error(`List thread items failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List thread items error:', error);
      throw error;
    }
  }

  // Helper methods for email-specific use cases

  /**
   * Create email workflow session
   */
  async createEmailSession(userId, workflowId = 'email_generation') {
    const workflow = {
      id: workflowId,
      version: '2024-10-01'
    };

    const config = {
      chatkit_configuration: {
        automatic_thread_titling: { enabled: true },
        file_upload: {
          enabled: true,
          max_file_size: 16,
          max_files: 20
        },
        history: {
          enabled: true,
          recent_threads: 10
        }
      },
      expires_after: { seconds: 1800 }, // 30 minutes
      rate_limits: { max_requests_per_1_minute: 60 }
    };

    return this.createSession(userId, workflow, config);
  }

  /**
   * Get user's email threads
   */
  async getUserEmailThreads(userId, limit = 10) {
    return this.listThreads({
      user: userId,
      limit,
      order: 'desc'
    });
  }

  /**
   * Get thread conversation history
   */
  async getConversationHistory(threadId, limit = 50) {
    const items = await this.listThreadItems(threadId, {
      limit,
      order: 'asc'
    });

    return items.data.map(item => ({
      id: item.id,
      type: item.type,
      content: item.content?.[0]?.text || '',
      attachments: item.attachments || [],
      timestamp: item.created_at
    }));
  }

  /**
   * Clean up expired sessions and old threads
   */
  async cleanup(userId, daysOld = 7) {
    try {
      const threads = await this.listThreads({
        user: userId,
        limit: 100
      });

      const cutoffTime = Date.now() / 1000 - (daysOld * 24 * 60 * 60);
      const oldThreads = threads.data.filter(thread => 
        thread.created_at < cutoffTime
      );

      const deletePromises = oldThreads.map(thread => 
        this.deleteThread(thread.id)
      );
      
      await Promise.allSettled(deletePromises);

      return { deleted: oldThreads.length };
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }

  /**
   * Search threads by title or content
   */
  async searchThreads(userId, query, limit = 20) {
    const threads = await this.listThreads({
      user: userId,
      limit: 100
    });

    const filtered = threads.data.filter(thread => 
      thread.title?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      data: filtered.slice(0, limit),
      total: filtered.length
    };
  }

  /**
   * Get session status and configuration
   */
  getSessionConfig(emailFeatures = true) {
    return {
      chatkit_configuration: {
        automatic_thread_titling: { enabled: true },
        file_upload: {
          enabled: emailFeatures,
          max_file_size: emailFeatures ? 16 : 8,
          max_files: emailFeatures ? 20 : 10
        },
        history: {
          enabled: true,
          recent_threads: emailFeatures ? 20 : 10
        }
      },
      expires_after: { seconds: emailFeatures ? 3600 : 1800 },
      rate_limits: {
        max_requests_per_1_minute: emailFeatures ? 100 : 30
      }
    };
  }
}

export default new ChatKitService();