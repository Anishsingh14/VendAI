/* VendAI — Insights Page (Light Theme) */

const InsightsPage = {
  _machineId: null,

  render(state) {
    this._machineId = state?.machineId || null;
    return pageShell('insights', `
      <div class="flex items-center justify-between mb-6">
        <div><h1 class="text-2xl font-semibold text-slate-900">Insights</h1><p class="text-slate-500 text-sm mt-1">Sales intelligence derived from your inventory data</p></div>
      </div>
      <div id="machine-selector" class="mb-6"></div>
      <div id="insights-content"><div class="loading-spinner"></div></div>
    `);
  },

  async load(state) {
    try {
      const machines = await API.getMachines();
      const sel = document.getElementById('machine-selector');
      if (!machines.length) {
        sel.innerHTML = `<div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">info</span>No machines found. Add a machine and upload data first.</div>`;
        document.getElementById('insights-content').innerHTML = ''; return;
      }
      if (!this._machineId) this._machineId = machines[0].id;
      sel.innerHTML = `<div class="flex items-center gap-3">
        <span class="text-sm text-slate-500">Machine:</span>
        <select class="bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" id="machine-select">
          ${machines.map(m => `<option value="${m.id}" ${m.id === this._machineId ? 'selected' : ''}>${m.name} — ${m.location}</option>`).join('')}
        </select></div>`;
      document.getElementById('machine-select')?.addEventListener('change', e => { this._machineId = e.target.value; this._loadInsights(); });
      this._loadInsights();
    } catch (e) { showToast(e.message, 'error'); }
  },

  async _loadInsights() {
    const el = document.getElementById('insights-content');
    el.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const data = await API.getInsights(this._machineId);
      if (data.error) { el.innerHTML = `<div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">info</span>${data.error}</div>`; return; }

      const seasonIcons = { Summer: 'wb_sunny', Monsoon: 'water_drop', Winter: 'ac_unit', Festive: 'celebration' };

      el.innerHTML = `
        <p class="text-xs text-slate-400 mb-6">Based on ${data.days_analyzed} days of data · Updated ${data.updated_at ? new Date(data.updated_at).toLocaleDateString('en-IN') : 'N/A'}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Top Sellers -->
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-amber-500 text-[18px]">emoji_events</span>Top Sellers</h3>
            ${data.top_sellers?.length ? data.top_sellers.map(s => `
              <div class="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">${s.rank}</span>
                  <span class="text-sm text-slate-700 font-medium">${s.product}</span>
                </div>
                <span class="text-sm font-mono text-slate-500">${s.units_per_week}/wk</span>
              </div>`).join('') : '<p class="text-sm text-slate-400">No data yet</p>'}
          </div>
          <!-- Bottom Sellers -->
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-slate-400 text-[18px]">trending_down</span>Least Movers</h3>
            ${data.bottom_sellers?.length ? data.bottom_sellers.map(s => `
              <div class="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div class="flex items-center gap-3">
                  <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">${s.rank}</span>
                  <span class="text-sm text-slate-700 font-medium">${s.product}</span>
                </div>
                <span class="text-sm font-mono text-slate-500">${s.units_per_week}/wk</span>
              </div>`).join('') : '<p class="text-sm text-slate-400">No data yet</p>'}
          </div>
        </div>
        <!-- Seasonal -->
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-amber-500 text-[18px]">wb_sunny</span>Seasonal Intelligence</h3>
          ${data.seasonal_insights?.length ? `
            <p class="text-xs text-slate-400 mb-4">Patterns with ≥20% deviation from average — automatically detected from your data.</p>
            <div class="space-y-3">${data.seasonal_insights.map(s => `
              <div class="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                <span class="material-symbols-outlined text-xl ${s.direction === 'MORE' ? 'text-emerald-600' : 'text-red-500'}">${seasonIcons[s.season] || 'analytics'}</span>
                <span class="text-sm text-slate-600"><strong class="text-slate-800">${s.product}</strong> sells <strong class="${s.direction === 'MORE' ? 'text-emerald-600' : 'text-red-600'}">${s.pct_change}% ${s.direction}</strong> in <strong class="text-slate-800">${s.season}</strong></span>
              </div>`).join('')}</div>
          ` : `<div class="text-center py-8"><span class="material-symbols-outlined text-slate-300 text-4xl mb-3">wb_sunny</span><div class="text-slate-800 font-medium mb-1">More data needed</div><div class="text-slate-400 text-sm">Upload at least 60 days of data to see seasonal patterns.</div></div>`}
        </div>`;
    } catch (e) {
      el.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">error</span>Failed to load insights: ${e.message}</div>`;
    }
  }
};
