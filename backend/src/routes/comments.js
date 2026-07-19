const supabase = require('../services/supabaseClient');

const router = require('express').Router();

// ---- 获取主题评论 ----
router.get('/theme/:themeId', async (req, res, next) => {
  try {
    const { themeId } = req.params;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('theme_id', themeId)
      .is('node_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 获取节点评论 ----
router.get('/node/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 发表评论 ----
router.post('/', async (req, res, next) => {
  try {
    const { theme_id, node_id, parent_id, author_name, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content 必填' });
    }
    if (!theme_id && !node_id) {
      return res.status(400).json({ error: 'theme_id 或 node_id 必填' });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        theme_id: theme_id || null,
        node_id: node_id || null,
        parent_id: parent_id || null,
        author_name: author_name || '匿名用户',
        content,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ---- 删除评论 ----
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
