const GLMProvider = require('./glmProvider');

let instance = null;

/**
 * 获取 AI Provider 单例
 */
function getAIProvider() {
  if (instance) return instance;

  const provider = process.env.AI_PROVIDER || 'glm';

  switch (provider) {
    case 'glm':
      instance = new GLMProvider({
        apiKey: process.env.GLM_API_KEY,
        apiUrl: process.env.GLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4',
        model: process.env.AI_MODEL || 'glm-4-flash',
      });
      break;
    // 后续扩展：
    // case 'openai':
    //   instance = new OpenAIProvider({...});
    //   break;
    // case 'claude':
    //   instance = new ClaudeProvider({...});
    //   break;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  console.log(`🤖 AI Provider: ${provider} (model: ${instance.model})`);
  return instance;
}

module.exports = { getAIProvider };
