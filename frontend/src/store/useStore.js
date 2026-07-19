import { create } from 'zustand';
import { themeApi, feedApi, commentApi } from '../services/api';

export const useStore = create((set, get) => ({
  // ---- State ----
  currentTheme: null,
  nodes: [],
  edges: [],
  comments: [],
  feeds: [],
  selectedNode: null,
  loading: false,
  error: null,
  rightPanelOpen: false,
  rightPanelTab: 'detail', // detail | comments | feed

  // ---- Actions ----
  fetchTheme: async (themeId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await themeApi.get(themeId);
      set({
        currentTheme: data,
        nodes: data.nodes || [],
        edges: data.edges || [],
        loading: false,
      });
      // 同时加载评论
      const { data: comments } = await commentApi.getByTheme(themeId);
      set({ comments });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  selectNode: (node) => {
    set({ selectedNode: node, rightPanelOpen: true, rightPanelTab: 'detail' });
  },

  closePanel: () => {
    set({ rightPanelOpen: false, selectedNode: null });
  },

  setPanelTab: (tab) => set({ rightPanelTab: tab }),

  feedData: async (themeId, content, sourceType = 3, url = null) => {
    try {
      const { data } = await feedApi.feed({
        theme_id: themeId,
        source_type: sourceType,
        raw_content: content,
        url,
      });
      // 重新加载主题数据
      await get().fetchTheme(themeId);
      return data;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  addComment: async (data) => {
    try {
      const { data: comment } = await commentApi.create(data);
      set((state) => ({ comments: [comment, ...state.comments] }));
      return comment;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  fetchNodeComments: async (nodeId) => {
    try {
      const { data } = await commentApi.getByNode(nodeId);
      return data;
    } catch (err) {
      return [];
    }
  },

  updateNodePositions: async (positions) => {
    try {
      await nodeApi.batchPositions(positions);
    } catch (err) {
      console.error('Failed to save positions:', err);
    }
  },
}));
