/**
 * OpenAI Moderations API Service
 * Classifies text and image inputs for potentially harmful content
 */

class ModerationsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1/moderations';
  }

  /**
   * Moderate content (text or multimodal)
   */
  async moderate(input, model = 'omni-moderation-latest') {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input,
          model
        })
      });

      if (!response.ok) {
        throw new Error(`Moderation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Moderation error:', error);
      throw error;
    }
  }

  /**
   * Check if content is safe
   */
  async isSafe(input, model = 'omni-moderation-latest') {
    const result = await this.moderate(input, model);
    return !result.results[0].flagged;
  }

  /**
   * Get detailed safety analysis
   */
  async analyze(input, model = 'omni-moderation-latest') {
    const result = await this.moderate(input, model);
    const analysis = result.results[0];
    
    return {
      safe: !analysis.flagged,
      categories: analysis.categories,
      scores: analysis.category_scores,
      highRiskCategories: Object.entries(analysis.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category),
      maxScore: Math.max(...Object.values(analysis.category_scores)),
      riskLevel: this.getRiskLevel(analysis.category_scores)
    };
  }

  /**
   * Moderate email content
   */
  async moderateEmail(emailData) {
    const content = [
      emailData.subject || '',
      emailData.body || '',
      emailData.signature || ''
    ].filter(Boolean).join('\n\n');

    const result = await this.analyze(content);
    
    return {
      ...result,
      emailSafe: result.safe,
      recommendations: this.getEmailRecommendations(result)
    };
  }

  /**
   * Moderate batch content
   */
  async moderateBatch(inputs, model = 'omni-moderation-latest') {
    const result = await this.moderate(inputs, model);
    
    return result.results.map((analysis, index) => ({
      input: inputs[index],
      safe: !analysis.flagged,
      categories: analysis.categories,
      scores: analysis.category_scores,
      riskLevel: this.getRiskLevel(analysis.category_scores)
    }));
  }

  /**
   * Moderate multimodal content (text + images)
   */
  async moderateMultimodal(textContent, imageUrls = []) {
    const input = [
      { type: 'text', text: textContent }
    ];

    // Add images
    imageUrls.forEach(url => {
      input.push({
        type: 'image_url',
        image_url: { url }
      });
    });

    return this.analyze(input);
  }

  /**
   * Get risk level from scores
   */
  getRiskLevel(scores) {
    const maxScore = Math.max(...Object.values(scores));
    
    if (maxScore >= 0.8) return 'high';
    if (maxScore >= 0.5) return 'medium';
    if (maxScore >= 0.2) return 'low';
    return 'minimal';
  }

  /**
   * Get email-specific recommendations
   */
  getEmailRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.categories.harassment) {
      recommendations.push('Consider rephrasing to use more professional language');
    }
    
    if (analysis.categories.hate) {
      recommendations.push('Remove potentially offensive language');
    }
    
    if (analysis.categories.violence) {
      recommendations.push('Use less aggressive terminology');
    }
    
    if (analysis.categories.sexual) {
      recommendations.push('Keep content professional and appropriate');
    }
    
    if (analysis.riskLevel === 'high') {
      recommendations.push('Content requires significant revision before sending');
    }
    
    return recommendations;
  }

  /**
   * Auto-moderate with suggestions
   */
  async autoModerate(content, options = {}) {
    const analysis = await this.analyze(content);
    
    if (analysis.safe) {
      return { approved: true, content, suggestions: [] };
    }
    
    const suggestions = [];
    
    // Generate suggestions based on flagged categories
    if (analysis.categories.harassment) {
      suggestions.push('Replace aggressive language with professional alternatives');
    }
    
    if (analysis.categories.hate) {
      suggestions.push('Remove discriminatory or offensive terms');
    }
    
    if (analysis.categories.violence) {
      suggestions.push('Use collaborative rather than confrontational language');
    }
    
    return {
      approved: false,
      content,
      analysis,
      suggestions,
      action: options.autoReject ? 'rejected' : 'review_required'
    };
  }

  /**
   * Content filter for real-time typing
   */
  async filterRealtime(text, threshold = 0.5) {
    if (text.length < 10) return { safe: true }; // Skip very short text
    
    try {
      const result = await this.analyze(text);
      return {
        safe: result.maxScore < threshold,
        warning: result.maxScore >= threshold ? 'Content may be inappropriate' : null,
        riskLevel: result.riskLevel
      };
    } catch (error) {
      console.warn('Realtime filter error:', error);
      return { safe: true, error: true };
    }
  }
}

export default new ModerationsService();