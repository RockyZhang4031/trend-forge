const supabase = require('../services/supabaseClient');
const { getAIProvider } = require('../services/aiService');

const router = require('express').Router();

// ---- 获取主题的喂养记录 ----
router.get('/theme/:themeId', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { data, error } = await supabase
      .from('feeds')
      .select('*')
      .eq('theme_id', themeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 喂养数据：提交文本，AI提取实体，写入图 ----
router.post('/', async (req, res, next) => {
  try {
    const { theme_id, source_type = 3, raw_content, url = null } = req.body;

    if (!theme_id || !raw_content) {
      return res.status(400).json({ error: 'theme_id 和 raw_content 必填' });
    }

    // 1. 创建 feed 记录
    const { data: feed, error: feedErr } = await supabase
      .from('feeds')
      .insert({
        theme_id,
        source_type,
        raw_content,
        url,
        status: 1, // processing
      })
      .select()
      .single();

    if (feedErr) throw feedErr;

    // 2. 获取主题名称作为上下文
    const { data: theme, error: themeErr } = await supabase
      .from('themes')
      .select('name')
      .eq('id', theme_id)
      .single();

    if (themeErr) throw themeErr;

    // 3. AI 提取实体
    const ai = getAIProvider();
    const extracted = await ai.extractEntities(raw_content, theme.name);

    // 4. 写入节点
    let createdNodes = [];
    if (extracted.nodes && extracted.nodes.length > 0) {
      const nodeInserts = extracted.nodes.map((n) => ({
        theme_id,
        name: n.name,
        type: n.type,
        description: n.description || '',
        scarcity_score: n.scarcity_score || 50.0,
        influence_score: n.influence_score || 50.0,
        confidence_score: n.confidence_score || 50.0,
        lifecycle_stage: n.lifecycle_stage || 50.0,
        lifecycle_pos: n.lifecycle_pos || 50.0,
        market_size: n.market_size || null,
        growth_rate: n.growth_rate || null,
      }));

      const { data: insertedNodes, error: nodeErr } = await supabase
        .from('nodes')
        .insert(nodeInserts)
        .select();

      if (nodeErr) throw nodeErr;
      createdNodes = insertedNodes || [];
    }

    // 5. 写入边（需要根据 name 匹配节点 ID）
    let createdEdges = [];
    if (extracted.edges && extracted.edges.length > 0 && createdNodes.length > 0) {
      const nodeMap = {};
      createdNodes.forEach((n) => {
        nodeMap[n.name] = n.id;
      });
      // 也包含已有节点
      const { data: existingNodes } = await supabase
        .from('nodes')
        .select('id, name')
        .eq('theme_id', theme_id);
      if (existingNodes) {
        existingNodes.forEach((n) => {
          if (!nodeMap[n.name]) nodeMap[n.name] = n.id;
        });
      }

      const edgeInserts = extracted.edges
        .filter((e) => nodeMap[e.source_name] && nodeMap[e.target_name])
        .map((e) => ({
          theme_id,
          source_node_id: nodeMap[e.source_name],
          target_node_id: nodeMap[e.target_name],
          type: e.type,
          weight: e.weight || 50.0,
          confidence_score: e.confidence_score || 50.0,
        }));

      if (edgeInserts.length > 0) {
        const { data: insertedEdges, error: edgeErr } = await supabase
          .from('edges')
          .insert(edgeInserts)
          .select();

        if (edgeErr) {
          console.error('Edge insert error:', edgeErr);
        } else {
          createdEdges = insertedEdges || [];
        }
      }
    }

    // 6. 写入证据
    if (createdNodes.length > 0 || createdEdges.length > 0) {
      const evidenceRecords = [
        ...createdNodes.map((n) => ({
          node_id: n.id,
          source_type,
          title: raw_content.substring(0, 100),
          content: raw_content,
          url,
          extracted_summary: `AI提取节点: ${n.name}`,
          ai_model: ai.model,
        })),
      ];
      await supabase.from('evidence').insert(evidenceRecords);
    }

    // 7. 创建快照
    const { data: nodeCount } = await supabase
      .from('nodes')
      .select('id', { count: 'exact', head: true })
      .eq('theme_id', theme_id);
    const { data: edgeCount } = await supabase
      .from('edges')
      .select('id', { count: 'exact', head: true })
      .eq('theme_id', theme_id);

    await supabase.from('snapshots').insert({
      theme_id,
      feed_id: feed.id,
      node_count: nodeCount?.length || 0,
      edge_count: edgeCount?.length || 0,
      diff_data: {
        added_nodes: createdNodes.map((n) => ({ id: n.id, name: n.name, type: n.type })),
        added_edges: createdEdges.map((e) => ({ id: e.id, type: e.type })),
      },
    });

    // 8. 更新 feed 状态
    await supabase
      .from('feeds')
      .update({
        status: 2,
        result_summary: `提取了 ${createdNodes.length} 个节点, ${createdEdges.length} 条关系`,
        processed_at: new Date().toISOString(),
      })
      .eq('id', feed.id);

    res.json({
      feed_id: feed.id,
      extracted_nodes: createdNodes,
      extracted_edges: createdEdges,
      summary: `提取了 ${createdNodes.length} 个节点, ${createdEdges.length} 条关系`,
    });
  } catch (err) {
    // 标记 feed 失败
    if (req.body.theme_id) {
      await supabase
        .from('feeds')
        .update({ status: 3, result_summary: err.message })
        .eq('theme_id', req.body.theme_id)
        .order('created_at', { ascending: false })
        .limit(1);
    }
    next(err);
  }
});

module.exports = router;
