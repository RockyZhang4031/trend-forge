/**
 * AI Provider 抽象基类
 * 后续可接入 GPT / Claude / 通义千问 等
 */
class AIProvider {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.model = config.model;
  }

  /**
   * 聊天补全
   * @param {Array} messages - 消息列表
   * @returns {Promise<string>} AI返回文本
   */
  async chat(messages) {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * 从文本中提取结构化实体和关系
   * @param {string} text - 原始文本
   * @param {string} themeContext - 主题上下文
   * @returns {Promise<Object>} { nodes: [], edges: [] }
   */
  async extractEntities(text, themeContext) {
    throw new Error('extractEntities() must be implemented by subclass');
  }
}

module.exports = AIProvider;
