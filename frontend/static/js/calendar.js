/* VendAI — Calendar View Page (Light Theme + Bright Colors + Restock) */

const CalendarPage = {
  render(state) {
    return pageShell('machines', `
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <a class="hover:text-slate-700 cursor-pointer transition-colors" data-nav="dashboard">Dashboard</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <button class="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors" onclick="Router.navigate('machine-detail', {id:'${state.machineId}', name:'${state.machineName ? state.machineName.replace(/'/g, "\\'") : ''}'})">
          <span class="text-sm font-medium">${state.machineName || 'Machine'}</span>
          </button>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-slate-700">${state.productName || 'Product'}</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold text-slate-900">${state.productName}</h1>
              <span id="priority-tag"></span>
            </div>
            <p class="text-slate-500 text-sm mt-1">${state.machineName} · Stock prediction calendar</p>
          </div>
          <button class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm" id="restock-btn">
            <span class="material-symbols-outlined text-[16px]">add_shopping_cart</span>Restock
          </button>
        </div>
      </div>
      <div id="calendar-content"><div class="loading-spinner"></div></div>
    `);
  },

  async load(state) {
    // Bind restock button
    document.getElementById('restock-btn')?.addEventListener('click', () => {
      showModal(`
        <h2 class="text-lg font-semibold text-slate-900 mb-1">Restock Product</h2>
        <p class="text-sm text-slate-500 mb-5">Record a restock for <strong>${state.productName}</strong> at <strong>${state.machineName}</strong></p>
        <div class="form-group">
          <label class="form-label">Quantity Added</label>
          <input class="form-input" id="restock-qty" type="number" placeholder="e.g. 50" min="1" value="50">
        </div>
        <p class="text-xs text-slate-400 mb-4">This will update today's stock level and retrain predictions to reflect the new supply.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
          <button class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors" id="confirm-restock">
            <span class="material-symbols-outlined text-[14px] align-middle mr-1">check</span>Confirm Restock
          </button>
        </div>
      `);
      document.getElementById('confirm-restock')?.addEventListener('click', async () => {
        const qty = parseFloat(document.getElementById('restock-qty').value);
        if (!qty || qty <= 0) { showToast('Enter a valid quantity', 'error'); return; }
        const btn = document.getElementById('confirm-restock');
        btn.textContent = 'Processing...';
        btn.disabled = true;
        try {
          await API.restock({
            machine_id: state.machineId,
            product_name: state.productName,
            restock_qty: qty
          });
          closeModal();
          showToast(`Restocked ${qty} units — predictions updating`, 'success');
          CalendarPage.load(state);  // Reload calendar
        } catch (e) {
          showToast(e.message, 'error');
          btn.textContent = 'Confirm Restock';
          btn.disabled = false;
        }
      });
    });

    try {
      const data = await API.getCalendar(state.machineId, state.productName);
      const el = document.getElementById('calendar-content');

      if (data.is_priority) {
        document.getElementById('priority-tag').innerHTML = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">PRIORITY</span>';
      }

      const confScore = Math.round((data.model_confidence_score || 0) * 100);
      const dataConf = data.data_confidence || 'low';
      const confMap = { strong: ['bg-emerald-100 text-emerald-700 border-emerald-200', 'Strong'], building: ['bg-blue-100 text-blue-700 border-blue-200', 'Building'], low: ['bg-amber-100 text-amber-700 border-amber-200', 'Low'] };
      const [confCls, confLabel] = confMap[dataConf] || confMap.low;

      // Current season based on month
      const seasonMap = {1:'Winter',2:'Winter',3:'Summer',4:'Summer',5:'Summer',6:'Monsoon',7:'Monsoon',8:'Monsoon',9:'Monsoon',10:'Festive',11:'Festive',12:'Festive'};
      const seasonIcons = {Winter:'ac_unit',Summer:'wb_sunny',Monsoon:'water_drop',Festive:'celebration'};
      const currentSeason = seasonMap[new Date().getMonth()+1];

      el.innerHTML = `
        <!-- Badges Row -->
        <div class="flex flex-wrap gap-3 mb-6">
          <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${confCls} border">Data: ${confLabel}</span>
          <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${confScore > 70 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : confScore > 40 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'} border">Model confidence: ${confScore}%</span>
          <span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200"><span class="material-symbols-outlined text-[12px]">${seasonIcons[currentSeason]}</span>Season: ${currentSeason}</span>
          ${data.first_yellow_date ? `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200"><span class="material-symbols-outlined text-[12px]">warning</span>Yellow from ${data.first_yellow_date}</span>` : ''}
          ${data.first_red_date ? `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-200"><span class="material-symbols-outlined text-[12px]">error</span>Critical from ${data.first_red_date}</span>` : ''}
        </div>

        <!-- Calendar Card -->
        <div class="bg-white border border-slate-200 rounded-xl mb-6">
          <div class="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <span class="text-base font-semibold text-slate-800">${new Date(data.year, data.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</span>
            <div class="flex gap-4 text-[11px]">
              <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded bg-green-500 shadow-sm"></span><span class="text-slate-500 font-medium">Healthy</span></span>
              <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded bg-amber-500 shadow-sm"></span><span class="text-slate-500 font-medium">~50%</span></span>
              <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded bg-red-500 shadow-sm"></span><span class="text-slate-500 font-medium">Critical</span></span>
              <span class="flex items-center gap-1.5"><span class="w-4 h-4 rounded bg-slate-800 shadow-sm"></span><span class="text-slate-500 font-medium">Stockout</span></span>
            </div>
          </div>
          <div class="calendar-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-day-header">${d}</div>`).join('')}${this.renderCalendarDays(data.calendar_days)}</div>
        </div>

        <!-- Confidence Guide -->
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">help</span>Confidence Guide</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-center gap-3"><span class="inline-flex px-3 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 min-w-[120px]">Days 1–14: High</span><span class="text-slate-500">Daily color coding based on RF model prediction</span></div>
            <div class="flex items-center gap-3"><span class="inline-flex px-3 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 min-w-[120px]">Days 15–30: Medium</span><span class="text-slate-500">Weekly average — less precise but directionally correct</span></div>
          </div>
        </div>`;
    } catch (e) {
      document.getElementById('calendar-content').innerHTML = `<div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">error</span>Failed to load calendar: ${e.message}</div>`;
    }
  },

  renderCalendarDays(days) {
    if (!days?.length) return '';
    const firstDayOfWeek = new Date(days[0].date).getDay();
    const empties = '<div class="cal-day empty"></div>'.repeat(firstDayOfWeek);
    const statusClass = { green: 'status-green', yellow: 'status-yellow', red: 'status-red', black: 'status-black', historical: 'past', unknown: '' };
    const daysHTML = days.map(d => {
      const cls = ['cal-day', d.is_today ? 'today' : '', d.is_past ? 'past' : '', statusClass[d.status] || ''].filter(Boolean).join(' ');
      const tooltip = d.stock_pct != null ? `${d.stock_pct}% remaining` : '';
      return `<div class="${cls}" title="${tooltip}">${d.day}</div>`;
    }).join('');
    return empties + daysHTML;
  }
};
