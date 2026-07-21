const supabase = require('../services/supabaseClient');
const { getAIProvider } = require('../services/aiService');

const router = require('express').Router();

// ---- 获取节点的分析内容 ----
router.get('/node/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { data, error } = await supabase
      .from('nodes')
      .select('id, name, type, metadata, scarcity_score, influence_score, description')
      .eq('id', nodeId)
      .single();

    if (error) throw error;

    const meta = data.metadata || {};
    res.json({
      node: data,
      analysis: meta.analysis || null,
      asset: meta.asset || null,
    });
  } catch (err) {
    next(err);
  }
});

// ---- 获取主题的分析报告 ----
router.get('/theme/:themeId', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .eq('theme_id', themeId)
      .eq('source_type', 9)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// ---- 获取主题下所有节点的分析+投资标的 ----
router.get('/theme/:themeId/all', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { data, error } = await supabase
      .from('nodes')
      .select('id, name, type, metadata, scarcity_score, influence_score')
      .eq('theme_id', themeId);

    if (error) throw error;

    const analyses = [];
    const assets = [];

    for (const node of (data || [])) {
      const meta = node.metadata || {};
      if (meta.analysis) {
        analyses.push({
          node_id: node.id,
          node_name: node.name,
          node_type: node.type,
          ...meta.analysis,
        });
      }
      if (meta.asset) {
        assets.push({
          node_id: node.id,
          node_name: node.name,
          node_type: node.type,
          ...meta.asset,
        });
      }
    }

    res.json({ analyses, assets });
  } catch (err) {
    next(err);
  }
});

const NODE_TYPE_MAP = { 1: '趋势', 2: '技术', 3: '资源', 4: '公司', 5: '人物', 6: '产业', 7: '事件' };

// 节点分析 prompt — 丰富版
function buildNodePrompt(node, neighbors) {
  const isCompany = node.type === 4;

  const systemPrompt = `你是顶级趋势分析师，正在为投资机构撰写深度分析。内容必须具体、有数据、有时间节点、有阶段划分。不要泛泛而谈。

输出严格 JSON：
{
  "analysis": {
    "thesis": "核心论点，4-6句话。必须包含：为什么重要、当前状态、未来方向、关键瓶颈",
    "risk": "风险因素，3-4句话。必须包含具体风险点和技术/商业/政策维度",
    "conclusion": "一句话结论",
    "current_stage": "技术验证期 | 量产爬坡期 | 规模化爆发期 | 成熟期",
    "growth_phases": [
      {
        "stage": "阶段名称",
        "period": "如 2020-2024",
        "description": "该阶段特征，2-3句话",
        "progress": 0-100的数字,
        "status": "completed | ongoing | upcoming"
      },
      {
        "stage": "阶段名称",
        "period": "如 2025-2027",
        "description": "该阶段特征",
        "progress": 0-100,
        "status": "ongoing | upcoming"
      },
      {
        "stage": "阶段名称",
        "period": "如 2028-2032",
        "description": "该阶段特征",
        "progress": 0-100,
        "status": "upcoming"
      }
    ],
    "milestones": [
      { "year": "2024", "quarter": "Q4", "event": "具体事件描述", "impact": "high | medium | low" },
      { "year": "2025", "quarter": "Q1", "event": "具体事件描述", "impact": "high" },
      { "year": "2025", "quarter": "Q3", "event": "具体事件描述", "impact": "medium" },
      { "year": "2026", "event": "具体事件描述", "impact": "medium" },
      { "year": "2027", "event": "具体事件描述", "impact": "high" },
      { "year": "2028", "event": "具体事件描述", "impact": "medium" },
      { "year": "2030", "event": "具体事件描述", "impact": "high" }
    ],
    "key_metrics": [
      { "label": "如 市场规模", "value": "如 380亿元", "trend": "up | down | flat" },
      { "label": "如 年增长率", "value": "如 45%", "trend": "up" },
      { "label": "如 渗透率", "value": "如 <1%", "trend": "up" }
    ],
    "key_points": [
      "关键发现1，2-3句话，必须包含具体数据或时间",
      "关键发现2，2-3句话",
      "关键发现3，2-3句话",
      "关键发现4，2-3句话"
    ]
  }${isCompany ? `,
  "asset": {
    "ticker": "股票代码（如 TSLA），未上市填 null",
    "exchange": "交易所（NASDAQ/HKEX/SSE/SZSE/TSE），未上市填 null",
    "is_listed": true/false,
    "market_cap": 市值亿元数字或null,
    "investment_thesis": "投资逻辑，4-5句话。必须包含：核心驱动力、竞争壁垒、增长预期",
    "risk_factors": "风险因素，3-4句话。必须具体",
    "exposure_score": 0-100,
    "upside_score": 0-100,
    "certainty_score": 0-100,
    "entry_point": "当前是否是好的入场时机，2-3句话分析",
    "target_return": "如 2-3x（3年预期）"
  }` : ""}
}

只返回 JSON，不要 markdown 标记，不要解释。`;

  const userPrompt = `节点信息：
名称: ${node.name}
类型: ${NODE_TYPE_MAP[node.type] || '未知'}
描述: ${node.description || '无'}
稀缺度: ${node.scarcity_score}/100
影响力: ${node.influence_score}/100
市场规模: ${node.market_size || '未知'}亿元
增长率: ${node.growth_rate || '未知'}%
生命周期阶段: ${node.lifecycle_stage || '未知'}/100

关联节点:
${(neighbors || []).map(n => `- ${n.name} (${NODE_TYPE_MAP[n.type] || '未知'}, 稀缺${n.scarcity_score}, 影响${n.influence_score})`).join('\n')}

请生成深度分析。所有时间点必须具体到年/季度，所有论点必须有数据支撑。`;

  return { systemPrompt, userPrompt };
}

// 主题报告 prompt — 丰富版
function buildThemePrompt(theme, nodes, edges, nodeMap) {
  const systemPrompt = `你是顶级趋势分析师，正在为投资机构撰写一份完整的趋势简报。内容必须丰富、具体、有数据、有时间纵深。

输出严格 JSON：
{
  "title": "报告标题",
  "subtitle": "副标题，一句话概括",
  "overall_score": 0-100,
  "scores": {
    "technology": 0-100,
    "resource": 0-100,
    "capital": 0-100,
    "certainty": 0-100,
    "policy": 0-100
  },
  "scarcity_map": {
    "technology": 0-100,
    "resource": 0-100,
    "talent": 0-100,
    "capital": 0-100,
    "policy": 0-100
  },
  "growth_curve": [
    { "year": "2023", "value": 15, "label": "技术验证" },
    { "year": "2024", "value": 25, "label": "突破前夜" },
    { "year": "2025", "value": 40, "label": "量产起点" },
    { "year": "2026", "value": 55, "label": "爬坡加速" },
    { "year": "2027", "value": 68, "label": "规模扩张" },
    { "year": "2028", "value": 78, "label": "加速渗透" },
    { "year": "2030", "value": 90, "label": "全面普及" }
  ],
  "stages": [
    {
      "name": "技术验证期",
      "period": "2020-2024",
      "score": 25,
      "description": "2-3句话描述该阶段特征和关键事件",
      "status": "completed"
    },
    {
      "name": "量产爬坡期",
      "period": "2025-2027",
      "score": 60,
      "description": "2-3句话",
      "status": "ongoing"
    },
    {
      "name": "规模化爆发期",
      "period": "2028-2032",
      "score": 85,
      "description": "2-3句话",
      "status": "upcoming"
    },
    {
      "name": "成熟期",
      "period": "2033+",
      "score": 95,
      "description": "2-3句话",
      "status": "upcoming"
    }
  ],
  "key_findings": [
    "发现1：2-3句话，含具体数据和年份",
    "发现2：2-3句话",
    "发现3：2-3句话",
    "发现4：2-3句话",
    "发现5：2-3句话",
    "发现6：2-3句话",
    "发现7：2-3句话"
  ],
  "investment_targets": [
    { "name": "公司名", "tag": "核心标的 | 稀缺垄断 | 高风险 | 早期布局", "score": 0-100, "reason": "1句话理由" },
    { "name": "公司名", "tag": "...", "score": 0-100, "reason": "..." },
    { "name": "公司名", "tag": "...", "score": 0-100, "reason": "..." },
    { "name": "公司名", "tag": "...", "score": 0-100, "reason": "..." }
  ],
  "timeline": [
    { "year": "2024", "quarter": "Q4", "event": "具体事件", "type": "milestone | product | policy | market", "impact": "high | medium | low" },
    { "year": "2025", "quarter": "Q1", "event": "...", "type": "product", "impact": "high" },
    { "year": "2025", "quarter": "Q3", "event": "...", "type": "market", "impact": "medium" },
    { "year": "2026", "quarter": "Q2", "event": "...", "type": "milestone", "impact": "high" },
    { "year": "2027", "event": "...", "type": "market", "impact": "high" },
    { "year": "2028", "event": "...", "type": "milestone", "impact": "medium" },
    { "year": "2030", "event": "...", "type": "market", "impact": "high" }
  ],
  "report_sections": [
    {
      "heading": "一、趋势判断",
      "content": "4-5段详细分析。每段3-4句话。必须包含：趋势本质、驱动力、当前阶段、未来方向"
    },
    {
      "heading": "二、稀缺环节",
      "content": "3-4段。分析技术/资源/人才/资本各维度的稀缺程度，指出最稀缺的环节"
    },
    {
      "heading": "三、投资标的",
      "content": "3-4段。按上市/未上市分类，分析每个标的的投资逻辑和风险"
    },
    {
      "heading": "四、时间窗口",
      "content": "3-4段。按阶段分析时间节点，指出关键窗口期和投资节奏"
    },
    {
      "heading": "五、风险因素",
      "content": "2-3段。分析技术风险、市场风险、政策风险"
    }
  ]
}

只返回 JSON，不要 markdown 标记。`;

  const userPrompt = `主题：${theme.name}
描述：${theme.description}

节点列表（${nodes.length}个）：
${nodes.map(n => `- [${NODE_TYPE_MAP[n.type]}] ${n.name} (稀缺${n.scarcity_score}, 影响${n.influence_score}${n.market_size ? `, 市场${n.market_size}亿` : ''}${n.growth_rate ? `, 增长${n.growth_rate}%` : ''})`).join('\n')}

关系列表（${edges.length}条）：
${edges.map(e => {
    const s = nodeMap.get(e.source_node_id)?.name || '?';
    const t = nodeMap.get(e.target_node_id)?.name || '?';
    return `- ${s} → ${t} (强度${e.weight})`;
  }).join('\n')}

已有节点分析摘要：
${nodes.filter(n => n.metadata?.analysis).map(n => `- ${n.name} [${n.metadata.analysis.current_stage || '未知'}]: ${n.metadata.analysis.thesis || ''}`).join('\n')}

请生成完整的趋势简报。所有内容必须具体、有数据支撑、有时间节点。`;

  return { systemPrompt, userPrompt };
}

// ---- AI 生成单个节点的分析内容 ----
router.post('/generate/node/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { regenerate = false } = req.body;

    const { data: node, error: nodeErr } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .single();
    if (nodeErr) throw nodeErr;

    const meta = node.metadata || {};
    if (meta.analysis && !regenerate) {
      return res.json({ node_id: nodeId, analysis: meta.analysis, asset: meta.asset, cached: true });
    }

    const { data: edges } = await supabase
      .from('edges')
      .select('source_node_id, target_node_id, type, weight')
      .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);

    const neighborIds = new Set();
    (edges || []).forEach(e => {
      if (e.source_node_id === nodeId) neighborIds.add(e.target_node_id);
      if (e.target_node_id === nodeId) neighborIds.add(e.source_node_id);
    });

    const { data: neighbors } = neighborIds.size > 0
      ? await supabase.from('nodes').select('name, type, scarcity_score, influence_score').in('id', [...neighborIds])
      : { data: [] };

    const ai = getAIProvider();
    const { systemPrompt, userPrompt } = buildNodePrompt(node, neighbors);

    const result = await ai.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    let parsed;
    try {
      let clean = result.trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('Analysis parse failed:', result.substring(0, 200));
      return res.status(500).json({ error: 'AI 返回解析失败', raw: result.substring(0, 500) });
    }

    const newMeta = { ...meta, analysis: parsed.analysis };
    if (parsed.asset) newMeta.asset = parsed.asset;

    await supabase
      .from('nodes')
      .update({ metadata: newMeta, updated_at: new Date().toISOString() })
      .eq('id', nodeId);

    res.json({ node_id: nodeId, analysis: parsed.analysis, asset: parsed.asset, cached: false });
  } catch (err) {
    next(err);
  }
});

// ---- AI 生成主题级报告 ----
router.post('/generate/theme/:themeId', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { regenerate = false } = req.body;

    if (!regenerate) {
      const { data: existing } = await supabase
        .from('feeds')
        .select('*')
        .eq('theme_id', themeId)
        .eq('source_type', 9)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        return res.json({ report: existing[0], cached: true });
      }
    }

    const [{ data: theme }, { data: nodes }] = await Promise.all([
      supabase.from('themes').select('*').eq('id', themeId).single(),
      supabase.from('nodes').select('id, name, type, scarcity_score, influence_score, description, market_size, growth_rate, lifecycle_stage, metadata').eq('theme_id', themeId),
    ]);

    const { data: edges } = await supabase
      .from('edges')
      .select('source_node_id, target_node_id, type, weight')
      .eq('theme_id', themeId);

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const ai = getAIProvider();
    const { systemPrompt, userPrompt } = buildThemePrompt(theme, nodes, edges, nodeMap);

    const result = await ai.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    let parsed;
    try {
      let clean = result.trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('Report parse failed:', result.substring(0, 200));
      return res.status(500).json({ error: 'AI 返回解析失败', raw: result.substring(0, 500) });
    }

    const { data: report, error: reportErr } = await supabase
      .from('feeds')
      .insert({
        theme_id: themeId,
        source_type: 9,
        raw_content: JSON.stringify(parsed),
        status: 2,
        result_summary: parsed.title,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reportErr) throw reportErr;

    res.json({ report, cached: false });
  } catch (err) {
    next(err);
  }
});

// ---- 批量生成所有节点的分析 ----
router.post('/generate/theme/:themeId/all', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { force = false } = req.body;

    const { data: nodes, error } = await supabase
      .from('nodes')
      .select('id, name, type, metadata, description, scarcity_score, influence_score, market_size, growth_rate, lifecycle_stage')
      .eq('theme_id', themeId);

    if (error) throw error;

    const needGen = force
      ? (nodes || [])
      : (nodes || []).filter(n => {
          const meta = n.metadata || {};
          return !meta.analysis;
        });

    if (needGen.length === 0) {
      return res.json({ generated: 0, message: '所有节点已有分析' });
    }

    res.json({
      generated: needGen.length,
      message: `正在为 ${needGen.length} 个节点生成深度分析...`,
      node_ids: needGen.map(n => n.id),
    });

    // 后台逐个生成
    const ai = getAIProvider();

    for (const node of needGen) {
      try {
        const { data: edges } = await supabase
          .from('edges')
          .select('source_node_id, target_node_id')
          .or(`source_node_id.eq.${node.id},target_node_id.eq.${node.id}`);

        const neighborIds = new Set();
        (edges || []).forEach(e => {
          if (e.source_node_id === node.id) neighborIds.add(e.target_node_id);
          if (e.target_node_id === node.id) neighborIds.add(e.source_node_id);
        });

        const { data: neighbors } = neighborIds.size > 0
          ? await supabase.from('nodes').select('name, type, scarcity_score, influence_score').in('id', [...neighborIds])
          : { data: [] };

        const { systemPrompt, userPrompt } = buildNodePrompt(node, neighbors);

        const result = await ai.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);

        let clean = result.trim();
        if (clean.startsWith('```')) {
          clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(clean);

        const newMeta = { ...(node.metadata || {}), analysis: parsed.analysis };
        if (parsed.asset) newMeta.asset = parsed.asset;

        await supabase
          .from('nodes')
          .update({ metadata: newMeta, updated_at: new Date().toISOString() })
          .eq('id', node.id);

        console.log(`✅ ${node.name} analysis generated`);
      } catch (e) {
        console.error(`❌ ${node.name}:`, e.message);
      }
    }

    // 全部完成后生成主题报告
    try {
      const resp = await fetch(`http://localhost:${process.env.PORT || 3001}/api/analyses/generate/theme/${themeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });
      const data = await resp.json();
      console.log('✅ Theme report generated');
    } catch (e) {
      console.error('Theme report generation failed:', e.message);
    }

  } catch (err) {
    next(err);
  }
});

module.exports = router;
