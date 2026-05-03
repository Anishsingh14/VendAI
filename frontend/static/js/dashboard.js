/* VendAI — Dashboard Page (Light Theme) */

const DashboardPage = {
  render() {
    const user = JSON.parse(localStorage.getItem('vendai_user') || '{}');
    return pageShell('dashboard', `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div><h1 class="text-2xl font-semibold text-slate-900">Welcome back, ${(user.name || 'there').split(' ')[0]}</h1><p class="text-slate-500 text-sm mt-1">Overview of your vending machines</p></div>
        <button class="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors shadow-sm w-full sm:w-auto text-center" id="add-machine-top-btn">Add Machine</button>
      </div>
      <div id="stats-row" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 class="text-base font-semibold text-slate-800">Your Machines</h2>
              <button class="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors" id="add-machine-btn">
                <span class="material-symbols-outlined text-[16px]">add</span>Add Machine
              </button>
            </div>
            <div id="machines-list" class="divide-y divide-slate-100"><div class="loading-spinner"></div></div>
          </div>
        </div>
        <div>
          <div class="bg-white border border-slate-200 rounded-xl">
            <div class="p-5 border-b border-slate-100"><h2 class="text-base font-semibold text-slate-800">Recent Activity</h2></div>
            <div id="activity-timeline" class="p-5"><div class="loading-spinner"></div></div>
          </div>
        </div>
      </div>
    `);
  },

  async load() {
    // Add Machine binding moved to top to ensure it's bound even if API calls fail
    const handleAddMachine = () => {
      showModal(`
        <h2>Add New Machine</h2>
        <div class="form-group"><label class="form-label">Machine Name</label><input class="form-input" id="m-name" placeholder="e.g. Main Block Vending"></div>
        <div class="form-group"><label class="form-label">Location</label><input class="form-input" id="m-location" placeholder="e.g. Building A, Ground Floor"></div>
        <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="m-save">Add Machine</button></div>`);
      document.getElementById('m-save')?.addEventListener('click', async () => {
        const name = document.getElementById('m-name').value.trim();
        const location = document.getElementById('m-location').value.trim();
        if (!name || !location) { showToast('Both fields required', 'error'); return; }
        try { await API.addMachine({ name, location }); closeModal(); showToast('Machine added!', 'success'); Router.navigate('dashboard'); }
        catch (e) { showToast(e.message, 'error'); }
      });
    };
    
    document.getElementById('add-machine-btn')?.addEventListener('click', handleAddMachine);
    document.getElementById('add-machine-top-btn')?.addEventListener('click', handleAddMachine);

    try {
      const machines = await API.getMachines();

      // Stats
      let totalProducts = 0, priorityCount = 0, alertCount = 0;
      for (const m of machines) {
        const prods = await API.getProducts(m.id).catch(() => []);
        totalProducts += prods.length;
        priorityCount += prods.filter(p => p.is_priority).length;
      }
      const alerts = await API.getAlerts().catch(() => []);
      alertCount = alerts.length;

      document.getElementById('stats-row').innerHTML = [
        ['precision_manufacturing', machines.length, 'Machines', 'text-primary bg-primary-light'],
        ['inventory_2', totalProducts, 'Products', 'text-emerald-600 bg-emerald-50'],
        ['star', priorityCount, 'Priority', 'text-amber-600 bg-amber-50'],
        ['notifications_active', alertCount, 'Alerts', 'text-red-600 bg-red-50'],
      ].map(([icon, val, label, cls]) => `
        <div class="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-md hover:shadow-slate-100 transition-all">
          <div class="w-11 h-11 rounded-lg ${cls.split(' ').slice(1).join(' ')} flex items-center justify-center">
            <span class="material-symbols-outlined ${cls.split(' ')[0]}">${icon}</span>
          </div>
          <div><div class="text-2xl font-bold text-slate-900">${val}</div><div class="text-xs text-slate-400 font-medium">${label}</div></div>
        </div>`).join('');

      // Machine List
      const ml = document.getElementById('machines-list');
      if (!machines.length) {
        ml.innerHTML = `<div class="p-10 text-center"><span class="material-symbols-outlined text-slate-300 text-5xl mb-3">precision_manufacturing</span><div class="text-slate-800 font-semibold mb-1">No machines yet</div><div class="text-slate-400 text-sm">Click "Add Machine" to register your first vending machine.</div></div>`;
      } else {
        ml.innerHTML = machines.map(m => {
          const safeName = m.name.replace(/'/g, "\\'");
          const safeLoc = m.location.replace(/'/g, "\\'");
          return `
          <div class="flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors" onclick="Router.navigate('machine-detail',{id:'${m.id}',name:'${safeName}',location:'${safeLoc}'})">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center"><span class="material-symbols-outlined text-primary text-[20px]">precision_manufacturing</span></div>
              <div>
                <div class="text-sm font-medium text-slate-800">${m.name}</div>
                <div class="text-xs text-slate-400">${m.location}</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-slate-300 text-[20px]">chevron_right</span>
          </div>`;
        }).join('');
      }

      // Activity Timeline
      const tl = document.getElementById('activity-timeline');
      if (alerts.length) {
        tl.innerHTML = alerts.slice(0, 5).map(a => {
          const colorMap = { CRITICAL: 'red', WARNING: 'amber', URGENT: 'red' };
          const c = colorMap[a.alert_level] || 'slate';
          return `<div class="flex gap-3 pb-4 last:pb-0">
            <div class="w-2 h-2 rounded-full mt-1.5 bg-${c}-500 shrink-0"></div>
            <div><div class="text-sm text-slate-700"><strong class="font-semibold">${a.product_name}</strong> — ${a.alert_level}</div>
            <div class="text-xs text-slate-400">${new Date(a.sent_at).toLocaleString('en-IN')}</div></div>
          </div>`;
        }).join('');
      } else {
        tl.innerHTML = '<p class="text-sm text-slate-400">No recent activity</p>';
      }

    } catch (e) { showToast(e.message, 'error'); }
  }
};
