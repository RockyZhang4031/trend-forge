import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { themeApi } from './services/api';
import ForceGraphScene from './components/Scene/ForceGraphScene';
import HolographicSidebar from './components/HUD/HolographicSidebar';
import TopStatusBar from './components/HUD/TopStatusBar';
import NodeDetailHUD from './components/HUD/NodeDetailHUD';
import BottomConsole from './components/HUD/BottomConsole';

export default function App() {
  const store = useStore();
  const [themeId, setThemeId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: themes } = await themeApi.getAll();
        if (themes && themes.length > 0) {
          const id = themes[0].id;
          setThemeId(id);
          await store.fetchTheme(id);
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: '#05070A' }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-mono text-[#8B95A5] tracking-wider">INITIALIZING TREND FORGE...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: '#05070A' }}>
      {/* 3D 画布层 */}
      <ForceGraphScene nodes={store.nodes} edges={store.edges} />

      {/* 2D UI 覆盖层 */}
      <HolographicSidebar themeId={themeId} />
      <TopStatusBar />
      <NodeDetailHUD themeId={themeId} />
      <BottomConsole />
    </div>
  );
}
