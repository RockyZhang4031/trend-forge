const supabase = require('../services/supabaseClient');

const router = require('express').Router();

// ---- 获取所有主题 ----
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 获取单个主题（含节点和边）----
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [{ data: theme, error: themeErr }, { data: nodes, error: nodesErr }, { data: edges, error: edgesErr }] =
      await Promise.all([
        supabase.from('themes').select('*').eq('id', id).single(),
        supabase.from('nodes').select('*').eq('theme_id', id),
        supabase.from('edges').select('*').eq('theme_id', id),
      ]);

    if (themeErr) throw themeErr;
    if (nodesErr) throw nodesErr;
    if (edgesErr) throw edgesErr;

    res.json({ ...theme, nodes, edges });
  } catch (err) {
    next(err);
  }
});

// ---- 创建主题 ----
router.post('/', async (req, res, next) => {
  try {
    const { name, description, status = 0 } = req.body;
    const { data, error } = await supabase
      .from('themes')
      .insert({ name, description, status })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 更新主题 ----
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('themes')
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

// ---- 删除主题 ----
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('themes').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
