import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Stock ─────────────────────────────────────────────────────────────────
export const postEntry = (payload) =>
  api.post('/entry', payload).then((r) => r.data);

// ── Inventory ─────────────────────────────────────────────────────────────
export const getInventory  = ()        => api.get('/inventory').then((r) => r.data);
export const postInventory = (payload) => api.post('/inventory', payload).then((r) => r.data);
export const getLowStock   = ()        => api.get('/inventory/low-stock').then((r) => r.data);
export const postRestock   = (payload) => api.post('/restock', payload).then((r) => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────
export const getUsage           = (days) => api.get('/usage', { params: days ? { days } : {} }).then((r) => r.data);
export const getUnmapped        = ()     => api.get('/unmapped').then((r) => r.data);
export const getActivity        = (limit = 20) => api.get('/activity', { params: { limit } }).then((r) => r.data);
export const postMap            = (unmappedId, ingredientName) =>
  api.post('/map', { ingredient_name: ingredientName }, { params: { unmapped_id: unmappedId } }).then((r) => r.data);
export const getAnalyticsSummary = ()                  => api.get('/analytics/summary').then((r) => r.data);
export const getTimeline         = (days = 30, ingredient) =>
  api.get('/analytics/timeline', { params: { days, ...(ingredient ? { ingredient } : {}) } }).then((r) => r.data);
export const getCategoryUsage    = (days)              =>
  api.get('/analytics/category', { params: days ? { days } : {} }).then((r) => r.data);

// ── Prediction ────────────────────────────────────────────────────────────
export const getPrediction  = (ingredient, lookbackDays = 30) =>
  api.get('/prediction', { params: { ingredient, lookback_days: lookbackDays } }).then((r) => r.data);
export const getAllForecasts = () => api.get('/forecasts').then((r) => r.data);

// ── Ingredients ───────────────────────────────────────────────────────────
export const getIngredients  = ()        => api.get('/ingredients').then((r) => r.data);
export const postIngredient  = (payload) => api.post('/ingredients', payload).then((r) => r.data);
export const getAliases      = (name)    => api.get(`/ingredients/${encodeURIComponent(name)}/aliases`).then((r) => r.data);
export const postAliases     = (name, aliases) =>
  api.post(`/ingredients/${encodeURIComponent(name)}/aliases`, { aliases }).then((r) => r.data);

// ── Health ────────────────────────────────────────────────────────────────
export const getHealth = () => api.get('/health').then((r) => r.data);

export default api;
