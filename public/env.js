// Runtime environment variables (override at container start)
window.__ENV__ = Object.assign({}, window.__ENV__ || {}, {
  API_URL: window.__ENV__?.API_URL || (typeof VITE_API_URL !== 'undefined' ? VITE_API_URL : undefined),
  WS_URL: window.__ENV__?.WS_URL || (typeof VITE_WS_URL !== 'undefined' ? VITE_WS_URL : undefined),
});


