import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { themeApi } from './services/api';
import TrendGraph from './components/Graph/TrendGraph';
import LifecycleChart from './components/Graph/LifecycleChart';
import NodeDetail from './components/Panels/NodeDetail';
import CommentSection from './components/Comments/CommentSection';
import FeedPanel from './components/Panels/FeedPanel';
import Toolbar from './components/Common/Toolbar';

export default function App() {
  const {
    currentTheme,
    nodes,
    edges,
    loading,
    error,
    selectedNode,
    rightPanelOpen,
    rightPanelTab,
    fetchTheme,
    selectNode,
    closePanel,
    setPanelTab,
  } = useStore();

  const [leftPanelTab, setLeftPanelTab] = useState('lifecycle'); // lifecycle | feed
  const [themeId, setThemeId] = useState(null);

  useEffect(() => {
    // 从 URL 获取 themeId，或自动获取第一个主题
    const params = new URLSearchParams(window.location.search);
    const id = params.get('theme');
    
    if (id) {
      setThemeId(id);
      fetchTheme(id).catch(() => {
        console.log('Failed to load theme:', id);
      });
    } else {
      // 没有指定 theme，自动获取第一个
      themeApi.getAll().then(({ data }) => {
        if (data && data.length > 0) {
          const firstTheme = data[0];
          setThemeId(firstTheme.id);
          fetchTheme(firstTheme.id).catch(() => {
            console.log('Failed to load theme:', firstTheme.id);
          });
        }
      }).catch(() => {
        console.log('Backend not configured yet, running in offline mode');
      });
    }
  }, []);

  // Demo 模式（后端未连接时）
  const isDemo = !currentTheme && !loading;

  return (
    <div className="flex h-screen bg-forge-bg text-forge-text">
      {/* ---- Left Sidebar ---- */}
      <aside className="w-80 border-r border-forge-border bg-forge-surface flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-forge-border">
          <h1 className="text-xl font-bold text-forge-primary">Trend Forge</h1>
          <p className="text-xs text-forge-muted mt-1">人类发展进程 · 可视化推演</p>
        </div>

        {/* Theme Info */}
        <div className="p-4 border-b border-forge-border">
          <h2 className="text-lg font-semibold">
            {currentTheme?.name || '机器人发展探索'}
          </h2>
          <p className="text-sm text-forge-muted mt-1">
            {currentTheme?.description || 'Demo 模式 - 后端未连接'}
          </p>
          {currentTheme && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-forge-muted">热度</span>
              <div className="flex-1 h-1.5 bg-forge-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-forge-primary rounded-full"
                  style={{ width: `${currentTheme.heat_score}%` }}
                />
              </div>
              <span className="text-xs text-forge-text">{currentTheme.heat_score?.toFixed(0)}</span>
            </div>
          )}
        </div>

        {/* Left Tabs */}
        <div className="flex border-b border-forge-border">
          <button
            onClick={() => setLeftPanelTab('lifecycle')}
            className={`flex-1 py-2 text-xs font-medium ${
              leftPanelTab === 'lifecycle'
                ? 'text-forge-primary border-b-2 border-forge-primary'
                : 'text-forge-muted'
            }`}
          >
            生命周期
          </button>
          <button
            onClick={() => setLeftPanelTab('feed')}
            className={`flex-1 py-2 text-xs font-medium ${
              leftPanelTab === 'feed'
                ? 'text-forge-primary border-b-2 border-forge-primary'
                : 'text-forge-muted'
            }`}
          >
            喂养数据
          </button>
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-hidden">
          {leftPanelTab === 'lifecycle' ? (
            <div className="p-2 h-full">
              <div className="h-48">
                <LifecycleChart nodes={nodes} />
              </div>
              <div className="p-2 text-xs text-forge-muted">
                <p>节点总数: {nodes.length}</p>
                <p>关系总数: {edges.length}</p>
              </div>
            </div>
          ) : (
            <FeedPanel themeId={themeId} />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-forge-border text-xs text-forge-muted text-center">
          Trend Forge v1.0 · 配置环境变量以启用完整功能
        </div>
      </aside>

      {/* ---- Main Graph Area ---- */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border bg-forge-surface">
          <div className="text-sm text-forge-muted">
            {loading ? '加载中...' : `${nodes.length} 节点 · ${edges.length} 关系`}
          </div>
          <Toolbar theme={currentTheme} />
        </div>

        {/* Graph */}
        <div id="trend-graph-container" className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-error/20 text-error rounded-lg text-sm border border-error/40">
              {error}
            </div>
          )}
          {isDemo && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-forge-warning/20 text-forge-warning rounded-lg text-sm border border-forge-warning/40">
              ⚠️ 后端未连接，正在以离线模式运行。请配置 .env 文件后重启。
            </div>
          )}
          <TrendGraph nodes={nodes} edges={edges} onSelectNode={selectNode} />
        </div>
      </main>

      {/* ---- Right Panel ---- */}
      {rightPanelOpen && selectedNode && (
        <aside className="w-96 border-l border-forge-border bg-forge-surface">
          <NodeDetail
            node={selectedNode}
            onClose={closePanel}
            onTabChange={setPanelTab}
            comments={[]}
          />
          {rightPanelTab === 'comments' && (
            <div className="h-96">
              <CommentSection themeId={themeId} nodeId={selectedNode.id} />
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
