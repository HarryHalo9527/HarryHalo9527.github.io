/**
 * LLM API wrapper — calls through Cloudflare Worker proxy
 * Configure the worker URL before deployment
 */
const LLM_API = {
  // Cloudflare Worker proxy URL
  workerUrl: 'https://yangzhuanfu-ai-proxy.jiangqi143.workers.dev/',

  // Fallback: direct API call (for local testing only)
  directUrl: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',

  /**
   * Configure the API endpoint
   */
  configure(options) {
    if (options.workerUrl) this.workerUrl = options.workerUrl;
    if (options.directUrl) this.directUrl = options.directUrl;
    if (options.apiKey) this.apiKey = options.apiKey;
  },

  /**
   * Check if API is configured
   */
  isConfigured() {
    return !!(this.workerUrl || this.apiKey);
  },

  /**
   * Call LLM API with messages
   * @param {string} systemPrompt - System prompt
   * @param {string} userMessage - User message
   * @param {object} options - Additional options
   * @returns {Promise<string>} - LLM response text
   */
  async chat(systemPrompt, userMessage, options = {}) {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    if (options.history) {
      messages.splice(1, 0, ...options.history);
    }

    const body = {
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 2000
    };

    try {
      let response;

      if (this.workerUrl) {
        response = await fetch(this.workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else if (this.apiKey) {
        response = await fetch(this.directUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body)
        });
      } else {
        throw new Error('API未配置。请设置Cloudflare Worker URL或API Key。');
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API请求失败 (${response.status}): ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      console.error('LLM API error:', err);
      throw err;
    }
  },

  /**
   * Parse JSON from LLM response (handles markdown code blocks)
   */
  parseJSON(text) {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(jsonStr);
  }
};

window.LLM_API = LLM_API;
