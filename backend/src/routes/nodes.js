const supabase = require('../services/supabaseClient');

const router = require('express').Router();

// ---- 获取主题下所有节点 ----
router.get('/theme/:themeId', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('theme_id', themeId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 获取单个节点（含证据）----
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [{ data: node, error: nodeErr }, { data: evidence, error: evidenceErr }] =
      await Promise.all([
        supabase.from('nodes').select('*').eq('id', id).single(),
        supabase.from('evidence').select('*').eq('node_id', id).order('created_at', { ascending: false }),
      ]);

    if (nodeErr) throw nodeErr;
    if (evidenceErr) throw evidenceErr;

    res.json({ ...node, evidence });
  } catch (err) {
    next(err);
  }
});

// ---- 创建节点 ----
router.post('/', async (req, res, next) => {
  try {
    const node = req.body;
    const { data, error } = await supabase
      .from('nodes')
      .insert(node)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 批量创建节点 ----
router.post('/batch', async (req, res, next) => {
  try {
    const { nodes } = req.body;
    const { data, error } = await supabase
      .from('nodes')
      .insert(nodes)
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 更新节点 ----
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 批量更新节点位置 ----
router.put('/batch/positions', async (req, res, next) => {
  try {
    const { positions } = req.body; // [{ id, x, y }]

    const updates = await Promise.all(
      positions.map(({ id, x, y }) =>
        supabase.from('nodes').update({ x, y }).eq('id', id)
      )
    );

    const errors = updates.filter((u) => u.error);
    if (errors.length) {
      console.error('Batch position update errors:', errors);
    }

    res.json({ updated: positions.length, errors: errors.length });
  } catch (err) {
    next(err);
  }
});

// ---- 删除节点 ----
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('nodes').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
