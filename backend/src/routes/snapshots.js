const supabase = require('../services/supabaseClient');

const router = require('express').Router();

// ---- 获取主题的快照列表 ----
router.get('/theme/:themeId', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { data, error } = await supabase
      .from('snapshots')
      .select('*')
      .eq('theme_id', themeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 获取单个快照 ----
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('snapshots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
