/**
 * 种子数据生成脚本
 * 运行: npm run seed
 * 
 * 会创建 "机器人发展探索" 主题 + 初始节点和关系
 */
const supabase = require('../services/supabaseClient');

// ---- 预置种子数据（不依赖 AI）----
const SEED_THEME = {
  name: '机器人发展探索',
  description: '追踪人类机器人技术发展进程，从核心组件到产业链，从稀缺资源到关键人物',
  status: 0,
  heat_score: 78.0,
};

const SEED_NODES = [
  // 趋势
  { name: '人形机器人', type: 1, description: '模仿人类形态和动作的通用机器人', scarcity_score: 85, influence_score: 95, confidence_score: 90, lifecycle_stage: 35, lifecycle_pos: 30, market_size: 380, growth_rate: 45 },
  { name: '具身智能', type: 1, description: 'AI与物理实体结合，能理解环境并执行任务', scarcity_score: 90, influence_score: 88, confidence_score: 85, lifecycle_stage: 20, lifecycle_pos: 15, market_size: null, growth_rate: 60 },

  // 技术
  { name: '灵巧手', type: 2, description: '多自由度机械手，能执行精细操作', scarcity_score: 88, influence_score: 82, confidence_score: 88, lifecycle_stage: 30, lifecycle_pos: 25, market_size: 120, growth_rate: 50 },
  { name: '视觉识别', type: 2, description: '机器人环境感知与物体识别', scarcity_score: 40, influence_score: 75, confidence_score: 92, lifecycle_stage: 55, lifecycle_pos: 50, market_size: 280, growth_rate: 30 },
  { name: '运动控制', type: 2, description: '平衡、步态、轨迹规划', scarcity_score: 65, influence_score: 80, confidence_score: 90, lifecycle_stage: 45, lifecycle_pos: 40, market_size: 200, growth_rate: 35 },
  { name: '大模型驱动', type: 2, description: 'LLM为机器人提供理解和决策能力', scarcity_score: 70, influence_score: 92, confidence_score: 85, lifecycle_stage: 25, lifecycle_pos: 20, market_size: 500, growth_rate: 80 },
  { name: '力觉传感', type: 2, description: '触觉和力反馈系统', scarcity_score: 78, influence_score: 70, confidence_score: 85, lifecycle_stage: 35, lifecycle_pos: 30, market_size: 80, growth_rate: 40 },

  // 资源
  { name: '稀土钕铁硼', type: 3, description: '机器人电机的核心磁性材料', scarcity_score: 82, influence_score: 85, confidence_score: 95, lifecycle_stage: 50, lifecycle_pos: 45, market_size: 150, growth_rate: 25 },
  { name: '高性能芯片', type: 3, description: '机器人边缘计算所需的AI芯片', scarcity_score: 75, influence_score: 90, confidence_score: 93, lifecycle_stage: 40, lifecycle_pos: 35, market_size: 400, growth_rate: 55 },
  { name: '精密减速器', type: 3, description: 'RV减速器和谐波减速器，机器人关节核心', scarcity_score: 88, influence_score: 82, confidence_score: 92, lifecycle_stage: 50, lifecycle_pos: 45, market_size: 100, growth_rate: 30 },

  // 公司
  { name: 'Tesla', type: 4, description: 'Optimus人形机器人，马斯克主导', scarcity_score: 60, influence_score: 95, confidence_score: 95, lifecycle_stage: 30, lifecycle_pos: 25, market_size: null, growth_rate: null },
  { name: '波士顿动力', type: 4, description: 'Atlas机器人，液压驱动先驱', scarcity_score: 85, influence_score: 80, confidence_score: 90, lifecycle_stage: 50, lifecycle_pos: 45, market_size: null, growth_rate: null },
  { name: 'Figure AI', type: 4, description: 'Figure 01人形机器人，OpenAI投资', scarcity_score: 80, influence_score: 75, confidence_score: 80, lifecycle_stage: 20, lifecycle_pos: 15, market_size: null, growth_rate: null },
  { name: '宇树科技', type: 4, description: '国内四足/人形机器人代表', scarcity_score: 50, influence_score: 65, confidence_score: 85, lifecycle_stage: 35, lifecycle_pos: 30, market_size: null, growth_rate: null },
  { name: '哈默纳科', type: 4, description: '全球谐波减速器龙头', scarcity_score: 85, influence_score: 78, confidence_score: 92, lifecycle_stage: 60, lifecycle_pos: 55, market_size: null, growth_rate: null },

  // 人物
  { name: '马斯克', type: 5, description: 'Tesla CEO，推动Optimus人形机器人', scarcity_score: 95, influence_score: 98, confidence_score: 98, lifecycle_stage: 40, lifecycle_pos: 35, market_size: null, growth_rate: null },
  { name: '雷军', type: 5, description: '小米进军人形机器人领域', scarcity_score: 70, influence_score: 75, confidence_score: 90, lifecycle_stage: 30, lifecycle_pos: 25, market_size: null, growth_rate: null },
  { name: '黄仁勋', type: 5, description: 'NVIDIA CEO，提供机器人AI算力底座', scarcity_score: 85, influence_score: 92, confidence_score: 95, lifecycle_stage: 45, lifecycle_pos: 40, market_size: null, growth_rate: null },

  // 产业
  { name: '智能制造', type: 6, description: '工业机器人与自动化产线', scarcity_score: 30, influence_score: 85, confidence_score: 95, lifecycle_stage: 55, lifecycle_pos: 50, market_size: 2500, growth_rate: 20 },
  { name: '服务机器人', type: 6, description: '商用/家用服务场景', scarcity_score: 45, influence_score: 70, confidence_score: 88, lifecycle_stage: 35, lifecycle_pos: 30, market_size: 800, growth_rate: 40 },
  { name: '医疗机器人', type: 6, description: '手术、康复、配送医疗场景', scarcity_score: 65, influence_score: 72, confidence_score: 90, lifecycle_stage: 40, lifecycle_pos: 35, market_size: 400, growth_rate: 35 },

  // 事件
  { name: 'Optimus Gen2发布', type: 7, description: '2023年底Tesla展示第二代人形机器人', scarcity_score: 50, influence_score: 85, confidence_score: 95, lifecycle_stage: 30, lifecycle_pos: 30, market_size: null, growth_rate: null },
  { name: 'Figure 01演示', type: 7, description: '2024年Figure AI展示与人类对话交互', scarcity_score: 60, influence_score: 78, confidence_score: 90, lifecycle_stage: 20, lifecycle_pos: 20, market_size: null, growth_rate: null },
];

// 关系: [source_name, target_name, type, weight, confidence]
const SEED_EDGE_DEFS = [
  ['具身智能', '人形机器人', 2, 85, 88],
  ['大模型驱动', '具身智能', 2, 90, 85],
  ['人形机器人', '灵巧手', 1, 80, 92],
  ['人形机器人', '视觉识别', 1, 75, 90],
  ['人形机器人', '运动控制', 1, 85, 92],
  ['人形机器人', '力觉传感', 1, 70, 85],
  ['人形机器人', '稀土钕铁硼', 1, 78, 90],
  ['人形机器人', '高性能芯片', 1, 82, 88],
  ['人形机器人', '精密减速器', 1, 85, 92],
  ['Tesla', '人形机器人', 2, 88, 90],
  ['波士顿动力', '人形机器人', 2, 75, 88],
  ['Figure AI', '人形机器人', 2, 72, 82],
  ['宇树科技', '人形机器人', 2, 60, 85],
  ['马斯克', 'Tesla', 3, 95, 98],
  ['雷军', '宇树科技', 3, 60, 80],
  ['黄仁勋', '高性能芯片', 3, 88, 95],
  ['哈默纳科', '精密减速器', 3, 90, 92],
  ['人形机器人', '智能制造', 5, 70, 80],
  ['人形机器人', '服务机器人', 5, 85, 82],
  ['人形机器人', '医疗机器人', 5, 65, 78],
  ['Optimus Gen2发布', 'Tesla', 4, 80, 95],
  ['Figure 01演示', 'Figure AI', 4, 75, 90],
  ['Tesla', '智能制造', 4, 70, 85],
  ['稀土钕铁硼', '人形机器人', 1, 78, 90],
];

async function seed() {
  console.log('🌱 开始生成种子数据...\n');

  // 1. 创建主题
  const { data: theme, error: themeErr } = await supabase
    .from('themes')
    .insert(SEED_THEME)
    .select()
    .single();

  if (themeErr) {
    console.error('创建主题失败:', themeErr.message);
    console.log('（如果数据库未配置，请先设置 .env 文件）');
    process.exit(1);
  }

  console.log(`✅ 主题创建: ${theme.name} (${theme.id})`);

  // 2. 创建节点
  const nodesWithTheme = SEED_NODES.map((n) => ({ ...n, theme_id: theme.id }));
  const { data: nodes, error: nodesErr } = await supabase
    .from('nodes')
    .insert(nodesWithTheme)
    .select();

  if (nodesErr) {
    console.error('创建节点失败:', nodesErr.message);
    process.exit(1);
  }

  console.log(`✅ 节点创建: ${nodes.length} 个`);

  // 3. 创建关系
  const nameToId = {};
  nodes.forEach((n) => { nameToId[n.name] = n.id; });

  const edges = SEED_EDGE_DEFS
    .filter(([src, tgt]) => nameToId[src] && nameToId[tgt])
    .map(([src, tgt, type, weight, conf]) => ({
      theme_id: theme.id,
      source_node_id: nameToId[src],
      target_node_id: nameToId[tgt],
      type,
      weight,
      confidence_score: conf,
    }));

  const { data: edgeData, error: edgeErr } = await supabase
    .from('edges')
    .insert(edges)
    .select();

  if (edgeErr) {
    console.error('创建关系失败:', edgeErr.message);
  } else {
    console.log(`✅ 关系创建: ${edgeData.length} 条`);
  }

  // 4. 创建初始快照
  await supabase.from('snapshots').insert({
    theme_id: theme.id,
    node_count: nodes.length,
    edge_count: edges.length,
    diff_data: { type: 'initial' },
  });

  console.log(`✅ 初始快照已保存`);
  console.log(`\n🎉 种子数据生成完成！`);
  console.log(`   主题ID: ${theme.id}`);
  console.log(`   节点: ${nodes.length}, 关系: ${edges.length}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('种子数据生成失败:', err.message);
  process.exit(1);
});
