-- ============================================
-- 002 - Analyses & Assets Tables
-- ============================================

-- 分析文章表（主题级 + 节点级）
CREATE TABLE IF NOT EXISTS analyses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme_id    UUID REFERENCES themes(id) ON DELETE CASCADE,
    node_id     UUID REFERENCES nodes(id) ON DELETE CASCADE,
    type        TEXT NOT NULL DEFAULT 'thesis',  -- thesis | risk | conclusion | timeline | report
    title       TEXT,
    content     TEXT,           -- markdown 正文
    summary     TEXT,           -- 一句话摘要（用于字幕条/卡片）
    ai_model    VARCHAR(100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT analyses_has_target CHECK (theme_id IS NOT NULL OR node_id IS NOT NULL)
);

CREATE INDEX idx_analyses_theme ON analyses(theme_id);
CREATE INDEX idx_analyses_node ON analyses(node_id);
CREATE INDEX idx_analyses_type ON analyses(type);

-- 投资标的表
CREATE TABLE IF NOT EXISTS assets (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id           UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,           -- 标的名称
    ticker            TEXT,                    -- 股票代码 (如 TSLA)
    exchange          TEXT,                    -- 交易所 (NASDAQ / HKEX / SSE / SZSE)
    market_cap        FLOAT,                   -- 市值（亿元）
    is_listed         BOOLEAN DEFAULT true,    -- true=上市, false=未上市
    investment_thesis TEXT,                    -- 投资逻辑
    risk_factors      TEXT,                    -- 风险因素
    exposure_score    FLOAT DEFAULT 50.0,     -- 0-100 对该趋势的敞口
    upside_score      FLOAT DEFAULT 50.0,     -- 0-100 上行空间
    certainty_score   FLOAT DEFAULT 50.0,     -- 0-100 确定性
    ai_model          VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_node ON assets(node_id);

-- RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_analyses" ON analyses FOR SELECT USING (true);
CREATE POLICY "allow_write_analyses" ON analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_read_assets" ON assets FOR SELECT USING (true);
CREATE POLICY "allow_write_assets" ON assets FOR ALL USING (true) WITH CHECK (true);
