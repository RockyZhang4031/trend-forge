const AIProvider = require('./aiProvider');
const fetch = require('node-fetch');

/**
 * 智谱 GLM Provider
 */
class GLMProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.model = config.model || 'glm-4-flash';
  }

  async chat(messages) {
    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GLM API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async extractEntities(text, themeContext) {
    const systemPrompt = `你是一个产业链分析专家。用户会给你一段文本（新闻、文章、论文等），你需要从中提取与主题"${themeContext}"相关的实体和关系。

请返回严格的 JSON 格式，不要包含其他文字：

{
  "nodes": [
    {
      "name": "实体名称",
      "type": 1,
      "description": "简要描述",
      "scarcity_score": 50.0,
      "influence_score": 50.0,
      "confidence_score": 80.0,
      "lifecycle_stage": 50.0,
      "lifecycle_pos": 50.0,
      "market_size": null,
      "growth_rate": null
    }
  ],
  "edges": [
    {
      "source_name": "源实体名称",
      "target_name": "目标实体名称",
      "type": 1,
      "weight": 60.0,
      "confidence_score": 70.0
    }
  ]
}

节点类型 type：
1=趋势 2=技术 3=资源 4=公司 5=人物 6=产业 7=事件

关系类型 type：
1=依赖 2=推动 3=掌控 4=属于 5=引发

所有分数 0-100：
- scarcity_score: 稀缺度，越高越稀缺
- influence_score: 影响力，越高影响越大
- confidence_score: 你对这个提取结果的把握
- lifecycle_stage: 生命周期阶段，0=萌芽 100=衰退
- lifecycle_pos: 当前在生命周期中的位置

market_size: 市场规模（亿元），不确定填 null
growth_rate: 增长率（百分比），不确定填 null

只提取与主题相关的实体，不要提取无关内容。如果文本中没有相关实体，返回空数组。`;

    const result = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ]);

    // 尝试解析 JSON
    try {
      // 去掉可能的 markdown 代码块标记
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(cleanResult);
    } catch (e) {
      console.error('AI返回解析失败:', result.substring(0, 200));
      return { nodes: [], edges: [] };
    }
  }
}

module.exports = GLMProvider;
