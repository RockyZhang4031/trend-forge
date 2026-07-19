const supabase = require('../services/supabaseClient');

const router = require('express').Router();

// ---- 获取主题下所有边 ----
router.get('/theme/:themeId', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { data, error } = await supabase
      .from('edges')
      .select('*')
      .eq('theme_id', themeId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 创建边 ----
router.post('/', async (req, res, next) => {
  try {
    const edge = req.body;
    const { data, error } = await supabase
      .from('edges')
      .insert(edge)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 批量创建边 ----
router.post('/batch', async (req, res, next) => {
  try {
    const { edges } = req.body;
    const { data, error } = await supabase
      .from('edges')
      .insert(edges)
      .select();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 删除边 ----
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('edges').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
