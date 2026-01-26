/**
 * IA Poste Manager - Communications Management API Service
 * For institutional clients (law firms, notaries, administrations)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class IAPosteManagerAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem("token");

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== COMMUNICATIONS ====================

  /**
   * Get messages with filters
   */
  async getMessages({
    channel = "all",
    status,
    priority,
    folderId,
    search,
    page = 1,
    perPage = 20,
  } = {}) {
    const params = new URLSearchParams();
    if (channel !== "all") params.append("channel", channel);
    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);
    if (folderId) params.append("folder_id", folderId);
    if (search) params.append("search", search);
    params.append("page", page);
    params.append("per_page", perPage);

    return this.request(`/api/communications/messages?${params}`);
  }

  /**
   * Get single message
   */
  async getMessage(messageId) {
    return this.request(`/api/communications/messages/${messageId}`);
  }

  /**
   * Classify message to a folder
   */
  async classifyMessage(messageId, folderId) {
    return this.request(`/api/communications/messages/${messageId}/classify`, {
      method: "POST",
      body: JSON.stringify({ folder_id: folderId }),
    });
  }

  /**
   * AI analysis of a message
   */
  async analyzeMessage(messageId) {
    return this.request(`/api/communications/messages/${messageId}/analyze`, {
      method: "POST",
    });
  }

  /**
   * Get communications statistics
   */
  async getCommunicationsStats() {
    return this.request("/api/communications/stats");
  }

  // ==================== FOLDERS ====================

  /**
   * Get folders with filters
   */
  async getFolders({
    status,
    folderType,
    assignedTo,
    search,
    page = 1,
    perPage = 20,
  } = {}) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (folderType) params.append("folder_type", folderType);
    if (assignedTo) params.append("assigned_to", assignedTo);
    if (search) params.append("search", search);
    params.append("page", page);
    params.append("per_page", perPage);

    return this.request(`/api/folders/?${params}`);
  }

  /**
   * Get single folder
   */
  async getFolder(folderId) {
    return this.request(`/api/folders/${folderId}`);
  }

  /**
   * Create a new folder
   */
  async createFolder(folderData) {
    return this.request("/api/folders/", {
      method: "POST",
      body: JSON.stringify(folderData),
    });
  }

  /**
   * Update a folder
   */
  async updateFolder(folderId, updates) {
    return this.request(`/api/folders/${folderId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get folder messages
   */
  async getFolderMessages(folderId) {
    return this.request(`/api/folders/${folderId}/messages`);
  }

  /**
   * Get folder documents
   */
  async getFolderDocuments(folderId) {
    return this.request(`/api/folders/${folderId}/documents`);
  }

  /**
   * Get folders statistics
   */
  async getFoldersStats() {
    return this.request("/api/folders/stats/overview");
  }

  // ==================== COMPLIANCE ====================

  /**
   * Get compliance statistics
   */
  async getComplianceStats() {
    return this.request("/api/compliance/stats");
  }

  /**
   * Get RGPD requests
   */
  async getRGPDRequests({ status, type } = {}) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);

    return this.request(`/api/compliance/rgpd-requests?${params}`);
  }

  /**
   * Complete RGPD request
   */
  async completeRGPDRequest(requestId, responseNotes = "") {
    return this.request(`/api/compliance/rgpd-requests/${requestId}/complete`, {
      method: "POST",
      body: JSON.stringify({ response_notes: responseNotes }),
    });
  }

  /**
   * Get legal deadlines
   */
  async getLegalDeadlines({ priority, daysAhead = 30 } = {}) {
    const params = new URLSearchParams();
    if (priority) params.append("priority", priority);
    params.append("days_ahead", daysAhead);

    return this.request(`/api/compliance/legal-deadlines?${params}`);
  }

  /**
   * Get audit log
   */
  async getAuditLog({
    userEmail,
    action,
    resourceType,
    startDate,
    endDate,
    page = 1,
    perPage = 50,
  } = {}) {
    const params = new URLSearchParams();
    if (userEmail) params.append("user_email", userEmail);
    if (action) params.append("action", action);
    if (resourceType) params.append("resource_type", resourceType);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    params.append("page", page);
    params.append("per_page", perPage);

    return this.request(`/api/compliance/audit-log?${params}`);
  }

  /**
   * Get retention rules
   */
  async getRetentionRules() {
    return this.request("/api/compliance/retention-rules");
  }

  /**
   * Get retention alerts
   */
  async getRetentionAlerts() {
    return this.request("/api/compliance/retention-alerts");
  }

  /**
   * Get certifications
   */
  async getCertifications() {
    return this.request("/api/compliance/certifications");
  }

  // ==================== TEAM ====================

  /**
   * Get team members
   */
  async getTeamMembers({ role, status, department, search } = {}) {
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    if (status) params.append("status", status);
    if (department) params.append("department", department);
    if (search) params.append("search", search);

    return this.request(`/api/team/members?${params}`);
  }

  /**
   * Get single team member
   */
  async getTeamMember(memberId) {
    return this.request(`/api/team/members/${memberId}`);
  }

  /**
   * Create team member
   */
  async createTeamMember(memberData) {
    return this.request("/api/team/members", {
      method: "POST",
      body: JSON.stringify(memberData),
    });
  }

  /**
   * Update team member
   */
  async updateTeamMember(memberId, updates) {
    return this.request(`/api/team/members/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Deactivate team member
   */
  async deactivateTeamMember(memberId) {
    return this.request(`/api/team/members/${memberId}`, {
      method: "DELETE",
    });
  }

  /**
   * Get team activity log
   */
  async getTeamActivity({ userId, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    params.append("limit", limit);

    return this.request(`/api/team/activity?${params}`);
  }

  /**
   * Get team statistics
   */
  async getTeamStats() {
    return this.request("/api/team/stats");
  }

  /**
   * Get available roles
   */
  async getRoles() {
    return this.request("/api/team/roles");
  }

  /**
   * Get all permissions
   */
  async getPermissions() {
    return this.request("/api/team/permissions");
  }

  // ==================== INTEGRATIONS ====================

  /**
   * Get all integrations
   */
  async getIntegrations({ category, status } = {}) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);

    return this.request(`/api/integrations/?${params}`);
  }

  /**
   * Get single integration
   */
  async getIntegration(integrationId) {
    return this.request(`/api/integrations/${integrationId}`);
  }

  /**
   * Connect integration
   */
  async connectIntegration(integrationId, config) {
    return this.request(`/api/integrations/${integrationId}/connect`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(integrationId) {
    return this.request(`/api/integrations/${integrationId}/disconnect`, {
      method: "POST",
    });
  }

  /**
   * Sync integration
   */
  async syncIntegration(integrationId) {
    return this.request(`/api/integrations/${integrationId}/sync`, {
      method: "POST",
    });
  }

  /**
   * Get integration logs
   */
  async getIntegrationLogs(integrationId, limit = 50) {
    return this.request(
      `/api/integrations/${integrationId}/logs?limit=${limit}`,
    );
  }

  /**
   * Get integrations statistics
   */
  async getIntegrationsStats() {
    return this.request("/api/integrations/stats/overview");
  }

  /**
   * Get webhooks
   */
  async getWebhooks() {
    return this.request("/api/integrations/webhooks");
  }

  // ==================== SEARCH ====================

  /**
   * Global search across all content
   */
  async search(
    query,
    { types, dateFrom, dateTo, page = 1, perPage = 20 } = {},
  ) {
    const params = new URLSearchParams();
    params.append("q", query);
    if (types) params.append("types", types.join(","));
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    params.append("page", page);
    params.append("per_page", perPage);

    return this.request(`/api/search?${params}`);
  }

  // ==================== AI ANALYSIS ====================

  /**
   * AI classification of content
   */
  async classifyContent(content) {
    return this.request("/api/ai/classify", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  /**
   * AI summary generation
   */
  async generateSummary(content) {
    return this.request("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  /**
   * AI entity extraction
   */
  async extractEntities(content) {
    return this.request("/api/ai/extract-entities", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  // ==================== DASHBOARD ====================

  /**
   * Get dashboard data
   */
  async getDashboardData() {
    const [commStats, folderStats, complianceStats, teamStats] =
      await Promise.all([
        this.getCommunicationsStats(),
        this.getFoldersStats(),
        this.getComplianceStats(),
        this.getTeamStats(),
      ]);

    return {
      communications: commStats,
      folders: folderStats,
      compliance: complianceStats,
      team: teamStats,
    };
  }

  // ==================== HEALTH ====================

  /**
   * Health check
   */
  async healthCheck() {
    return this.request("/health");
  }
}

export const iaPosteManagerAPI = new IAPosteManagerAPI();
export default iaPosteManagerAPI;
