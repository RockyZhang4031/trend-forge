-- ============================================
-- Trend Forge - Database Schema
-- Database: Supabase (PostgreSQL)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Themes (主题)
-- ============================================
CREATE TABLE IF NOT EXISTS themes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    status      INTEGER NOT NULL DEFAULT 0,  -- 0=public 1=premium 2=private
    heat_score  FLOAT NOT NULL DEFAULT 50.0, -- 0-100 主题热度
    cover_image TEXT,
    owner_id    UUID,                        -- 预留：用户ID
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Nodes (节点)
-- ============================================
CREATE TABLE IF NOT EXISTS nodes (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id          UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    name              VARCHAR(200) NOT NULL,
    type              INTEGER NOT NULL,        -- 1=趋势 2=技术 3=资源 4=公司 5=人物 6=产业 7=事件
    description       TEXT,
    scarcity_score    FLOAT NOT NULL DEFAULT 50.0,   -- 0-100 稀缺度
    influence_score   FLOAT NOT NULL DEFAULT 50.0,   -- 0-100 影响力
    confidence_score  FLOAT NOT NULL DEFAULT 50.0,   -- 0-100 置信度
    lifecycle_stage   FLOAT NOT NULL DEFAULT 50.0,   -- 0-100 生命周期阶段 0=萌芽 100=衰退
    lifecycle_pos     FLOAT NOT NULL DEFAULT 50.0,   -- 0-100 当前位置
    market_size       FLOAT,                        -- 亿元
    growth_rate       FLOAT,                        -- 百分比
    metadata          JSONB DEFAULT '{}',           -- 扩展字段
    x                 FLOAT DEFAULT 0,
    y                 FLOAT DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nodes_theme ON nodes(theme_id);
CREATE INDEX idx_nodes_type ON nodes(type);

-- ============================================
-- 3. Edges (关系)
-- ============================================
CREATE TABLE IF NOT EXISTS edges (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id          UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    source_node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id    UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    type              INTEGER NOT NULL,      -- 1=依赖 2=推动 3=掌控 4=属于 5=引发
    weight            FLOAT NOT NULL DEFAULT 50.0,    -- 0-100 关系强度
    confidence_score  FLOAT NOT NULL DEFAULT 50.0,    -- 0-100 置信度
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edges_theme ON edges(theme_id);
CREATE INDEX idx_edges_source ON edges(source_node_id);
CREATE INDEX idx_edges_target ON edges(target_node_id);

-- ============================================
-- 4. Evidence (证据)
-- ============================================
CREATE TABLE IF NOT EXISTS evidence (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id           UUID REFERENCES nodes(id) ON DELETE CASCADE,
    edge_id           UUID REFERENCES edges(id) ON DELETE CASCADE,
    source_type       INTEGER NOT NULL,      -- 1=新闻 2=论文 3=用户输入 4=数据报告
    title             VARCHAR(500),
    content           TEXT,
    url               TEXT,
    extracted_summary TEXT,
    extracted_entities JSONB DEFAULT '{}',
    feed_time         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ai_model          VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_node ON evidence(node_id);
CREATE INDEX idx_evidence_edge ON evidence(edge_id);

-- ============================================
-- 5. Feeds (数据喂养记录)
-- ============================================
CREATE TABLE IF NOT EXISTS feeds (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id      UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    source_type   INTEGER NOT NULL,    -- 1=新闻 2=论文 3=用户输入 4=数据报告
    raw_content   TEXT NOT NULL,
    url           TEXT,
    status        INTEGER NOT NULL DEFAULT 0,  -- 0=pending 1=processing 2=done 3=failed
    result_summary TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at  TIMESTAMPTZ
);

CREATE INDEX idx_feeds_theme ON feeds(theme_id);
CREATE INDEX idx_feeds_status ON feeds(status);

-- ============================================
-- 6. Snapshots (快照)
-- ============================================
CREATE TABLE IF NOT EXISTS snapshots (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id    UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    feed_id     UUID REFERENCES feeds(id) ON DELETE SET NULL,
    node_count  INTEGER NOT NULL DEFAULT 0,
    edge_count  INTEGER NOT NULL DEFAULT 0,
    diff_data   JSONB NOT NULL DEFAULT '{}',  -- 增量数据
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_theme ON snapshots(theme_id);

-- ============================================
-- 7. Comments (评论)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id    UUID REFERENCES themes(id) ON DELETE CASCADE,
    node_id     UUID REFERENCES nodes(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL DEFAULT '匿名用户',
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_theme ON comments(theme_id);
CREATE INDEX idx_comments_node ON comments(node_id);

-- ============================================
-- 8. Users (预留)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) UNIQUE,
    name        VARCHAR(100),
    avatar      TEXT,
    role        INTEGER NOT NULL DEFAULT 0,  -- 0=visitor 1=user 2=premium 3=admin
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER themes_updated_at BEFORE UPDATE ON themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER nodes_updated_at BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security (Demo阶段先关闭)
-- ============================================
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Demo阶段：允许匿名读取
CREATE POLICY "allow_read_themes" ON themes FOR SELECT USING (true);
CREATE POLICY "allow_read_nodes" ON nodes FOR SELECT USING (true);
CREATE POLICY "allow_read_edges" ON edges FOR SELECT USING (true);
CREATE POLICY "allow_read_evidence" ON evidence FOR SELECT USING (true);
CREATE POLICY "allow_read_feeds" ON feeds FOR SELECT USING (true);
CREATE POLICY "allow_read_snapshots" ON snapshots FOR SELECT USING (true);
CREATE POLICY "allow_read_comments" ON comments FOR SELECT USING (true);

-- Demo阶段：允许匿名写入（后续改为仅认证用户可写）
CREATE POLICY "allow_write_themes" ON themes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_write_nodes" ON nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_write_edges" ON edges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_write_evidence" ON evidence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_write_feeds" ON feeds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_write_snapshots" ON snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_write_comments" ON comments FOR ALL USING (true) WITH CHECK (true);
