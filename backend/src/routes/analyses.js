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
    
    // 从 feeds 表读取 AI 报告 (source_type=9)
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

// ---- AI 生成单个节点的分析内容 ----
router.post('/generate/node/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { regenerate = false } = req.body;

    // 获取节点 + 关联节点
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

    // 获取关联节点
    const { data: edges } = await supabase
      .from('edges')
      .select('source_node_id, target_node_id, type, weight')
      .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);

    const neighborIds = new Set();
    (edges || []).forEach(e => {
      if (e.source_node_id === nodeId) neighborIds.add(e.target_node_id);
      if (e.target_node_id === nodeId) neighborIds.add(e.source_node_id);
    });

    const { data: neighbors } = await supabase
      .from('nodes')
      .select('name, type, scarcity_score, influence_score')
      .in('id', [...neighborIds]);

    const ai = getAIProvider();
    const nodeTypeMap = { 1: '趋势', 2: '技术', 3: '资源', 4: '公司', 5: '人物', 6: '产业', 7: '事件' };

    const systemPrompt = `你是趋势分析师。基于节点的属性和关系，生成结构化分析。

输出 JSON 格式：
{
  "analysis": {
    "thesis": "核心论点（2-3句话，说明为什么这个节点重要）",
    "risk": "主要风险因素（1-2句话）",
    "conclusion": "一句话结论",
    "timeline": "时间窗口预测（如：2025-2027量产爬坡期）",
    "key_points": ["关键发现1", "关键发现2", "关键发现3"]
  }${node.type === 4 ? `,
  "asset": {
    "ticker": "股票代码（如 TSLA），未上市填 null",
    "exchange": "交易所（NASDAQ/HKEX/SSE/SZSE），未上市填 null",
    "is_listed": true/false,
    "market_cap": 市值亿元数字或null,
    "investment_thesis": "投资逻辑（2-3句话）",
    "risk_factors": "风险因素（1-2句话）",
    "exposure_score": 0-100的数字,
    "upside_score": 0-100的数字,
    "certainty_score": 0-100的数字
  }` : ""}
}

只返回 JSON，不要 markdown 标记。`;

    const userPrompt = `节点信息：
名称: ${node.name}
类型: ${nodeTypeMap[node.type] || '未知'}
描述: ${node.description || '无'}
稀缺度: ${node.scarcity_score}/100
影响力: ${node.influence_score}/100
市场规模: ${node.market_size || '未知'}亿元
增长率: ${node.growth_rate || '未知'}%

关联节点:
${(neighbors || []).map(n => `- ${n.name} (${nodeTypeMap[n.type] || '未知'}, 稀缺${n.scarcity_score}, 影响${n.influence_score})`).join('\n')}

请生成分析。`;

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

    // 存入 node.metadata
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

    // 检查是否已有报告
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

    // 获取主题 + 所有节点
    const [{ data: theme }, { data: nodes }] = await Promise.all([
      supabase.from('themes').select('*').eq('id', themeId).single(),
      supabase.from('nodes').select('id, name, type, scarcity_score, influence_score, description, metadata').eq('theme_id', themeId),
    ]);

    const { data: edges } = await supabase
      .from('edges')
      .select('source_node_id, target_node_id, type, weight')
      .eq('theme_id', themeId);

    const nodeTypeMap = { 1: '趋势', 2: '技术', 3: '资源', 4: '公司', 5: '人物', 6: '产业', 7: '事件' };
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const ai = getAIProvider();

    const systemPrompt = `你是趋势分析引擎。生成一份结构化的趋势简报。

输出 JSON 格式：
{
  "title": "报告标题",
  "overall_score": 0-100的数字,
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
  "key_findings": [
    "关键发现1（一句话）",
    "关键发现2",
    "关键发现3",
    "关键发现4",
    "关键发现5"
  ],
  "investment_targets": [
    { "name": "公司名", "tag": "核心标的|稀缺垄断|高风险", "score": 0-100 }
  ],
  "timeline": [
    { "year": "2025", "event": "事件描述" },
    { "year": "2027", "event": "事件描述" },
    { "year": "2030", "event": "事件描述" }
  ],
  "report_sections": [
    { "heading": "趋势判断", "content": "2-3段分析" },
    { "heading": "稀缺环节", "content": "1-2段分析" },
    { "heading": "投资标的", "content": "1-2段分析" },
    { "heading": "时间窗口", "content": "1-2段分析" }
  ]
}

只返回 JSON。`;

    const userPrompt = `主题：${theme.name}
描述：${theme.description}

节点列表（${nodes.length}个）：
${nodes.map(n => `- [${nodeTypeMap[n.type]}] ${n.name} (稀缺${n.scarcity_score}, 影响${n.influence_score})`).join('\n')}

关系列表（${edges.length}条）：
${edges.map(e => {
      const s = nodeMap.get(e.source_node_id)?.name || '?';
      const t = nodeMap.get(e.target_node_id)?.name || '?';
      return `- ${s} → ${t} (强度${e.weight})`;
    }).join('\n')}

已有节点分析：
${nodes.filter(n => n.metadata?.analysis).map(n => `- ${n.name}: ${n.metadata.analysis.thesis || ''}`).join('\n')}

请生成趋势简报。`;

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

    // 存入 feeds 表 (source_type=9 = AI报告)
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

    const { data: nodes, error } = await supabase
      .from('nodes')
      .select('id, name, type, metadata')
      .eq('theme_id', themeId);

    if (error) throw error;

    // 找没有 analysis 的节点
    const needGen = (nodes || []).filter(n => {
      const meta = n.metadata || {};
      return !meta.analysis;
    });

    if (needGen.length === 0) {
      return res.json({ generated: 0, message: '所有节点已有分析' });
    }

    // 异步生成（不等待完成）
    res.json({ 
      generated: needGen.length, 
      message: `正在为 ${needGen.length} 个节点生成分析...`,
      node_ids: needGen.map(n => n.id),
    });

    // 后台逐个生成
    const ai = getAIProvider();
    const nodeTypeMap = { 1: '趋势', 2: '技术', 3: '资源', 4: '公司', 5: '人物', 6: '产业', 7: '事件' };

    for (const node of needGen) {
      try {
        // 获取关联节点
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

        const systemPrompt = `你是趋势分析师。输出 JSON：
{
  "analysis": {
    "thesis": "核心论点2-3句",
    "risk": "风险因素1-2句",
    "conclusion": "一句话结论",
    "timeline": "时间窗口",
    "key_points": ["发现1", "发现2", "发现3"]
  }${node.type === 4 ? `,
  "asset": {
    "ticker": "股票代码或null",
    "exchange": "交易所或null",
    "is_listed": true/false,
    "market_cap": 数字或null,
    "investment_thesis": "投资逻辑2-3句",
    "risk_factors": "风险1-2句",
    "exposure_score": 0-100,
    "upside_score": 0-100,
    "certainty_score": 0-100
  }` : ""}
}
只返回JSON。`;

        const userPrompt = `节点: ${node.name} (${nodeTypeMap[node.type]})
关联: ${(neighbors || []).map(n => n.name).join(', ') || '无'}`;

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
      await fetch(`http://localhost:${process.env.PORT || 3001}/api/analyses/generate/theme/${themeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });
    } catch (e) {
      console.error('Theme report generation failed:', e.message);
    }

  } catch (err) {
    next(err);
  }
});

module.exports = router;
