import { create } from 'zustand';
import { themeApi, feedApi, commentApi } from '../services/api';

export const NODE_TYPE_MAP = {
  1: 'concept', 2: 'technology', 3: 'resource', 4: 'company',
  5: 'person', 6: 'concept', 7: 'concept',
};
export const EDGE_TYPE_MAP = {
  1: 'depends', 2: 'drives', 3: 'competes', 4: 'belongs', 5: 'drives',
};

export const useStore = create((set, get) => ({
  currentTheme: null,
  nodes: [],
  edges: [],
  comments: [],
  loading: false,
  error: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  cameraTarget: null,
  sidebarOpen: true,
  detailPanelOpen: false,
  rightPanelTab: 'detail',
  sidebarTab: 'lifecycle',

  fetchTheme: async (themeId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await themeApi.get(themeId);
      const mappedNodes = (data.nodes || []).map(n => ({
        id: n.id, name: n.name,
        type: NODE_TYPE_MAP[n.type] || 'concept',
        heat: n.influence_score || 50,
        scarcity: n.scarcity_score || 50,
        lifecycle: n.lifecycle_stage || 50,
        description: n.description || '',
        tags: n.tags || [],
        typeNum: n.type,
      }));
      const mappedEdges = (data.edges || []).map(e => ({
        id: e.id, source: e.source_node_id, target: e.target_node_id,
        type: EDGE_TYPE_MAP[e.type] || 'belongs',
        strength: (e.weight || 50) / 100,
      }));
      set({ currentTheme: data, nodes: mappedNodes, edges: mappedEdges, loading: false });
      try {
        const { data: comments } = await commentApi.getByTheme(themeId);
        set({ comments: comments || [] });
      } catch {}
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
  selectNode: (id) => set({ selectedNodeId: id, detailPanelOpen: !!id }),
  hoverNode: (id) => set({ hoveredNodeId: id }),
  flyToNode: (id) => {
    const node = get().nodes.find(n => n.id === id);
    if (node && node.x !== undefined) set({ cameraTarget: [node.x, node.y || 0, (node.z || 0) + 15] });
  },
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setPanelTab: (tab) => set({ rightPanelTab: tab }),
  closePanel: () => set({ selectedNodeId: null, detailPanelOpen: false }),
  feedData: async (themeId, content, sourceType, url) => {
    const { data } = await feedApi.feed({ theme_id: themeId, content, source_type: sourceType, source_url: url });
    if (data.extracted_nodes) await get().fetchTheme(themeId);
    return data;
  },
  addComment: async (data) => {
    const { data: comment } = await commentApi.create(data);
    set((state) => ({ comments: [comment, ...state.comments] }));
    return comment;
  },
  fetchNodeComments: async (nodeId) => {
    try { const { data } = await commentApi.getByNode(nodeId); return data; } catch { return []; }
  },
}));
