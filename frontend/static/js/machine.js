/* VendAI — Machine Pages (Light Theme) */

const MachinePage = {
  render() {
    return pageShell('machines', `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 class="text-2xl font-semibold text-slate-900">Machines</h1><p class="text-slate-500 text-sm mt-1">Manage all your registered vending machines</p></div>
        <button class="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto" id="add-machine-top"><span class="material-symbols-outlined text-[16px]">add</span>Add Machine</button>
      </div>
      <div id="machine-grid"><div class="loading-spinner"></div></div>
    `);
  },
  async load() {
    try {
      const machines = await API.getMachines();
      const el = document.getElementById('machine-grid');
      if (!machines.length) {
        el.innerHTML = `<div class="bg-white border border-slate-200 rounded-xl p-12 text-center"><span class="material-symbols-outlined text-slate-300 text-5xl mb-3">precision_manufacturing</span><div class="text-slate-800 font-semibold mb-1">No machines registered</div><div class="text-slate-400 text-sm">Get started by adding your first vending machine.</div></div>`;
      } else {
        el.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">${machines.map(m => `
          <div class="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:shadow-slate-100 hover:border-slate-300 transition-all group relative">
            <div class="flex items-center gap-4 mb-4 cursor-pointer" onclick="Router.navigate('machine-detail',{id:'${m.id}',name:'${m.name}',location:'${m.location}'})">
              <div class="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center"><span class="material-symbols-outlined text-primary">precision_manufacturing</span></div>
              <div>
                <div class="text-base font-semibold text-slate-800">${m.name}</div>
                <div class="text-sm text-slate-400 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span>${m.location}</div>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>ID: ${m.id.slice(0,8)}…</span>
              <div class="flex items-center gap-2">
                <button class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50" title="Delete Machine" data-delete-machine="${m.id}" data-machine-name="${m.name}">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
                <span class="material-symbols-outlined text-[18px] text-slate-300 cursor-pointer" onclick="Router.navigate('machine-detail',{id:'${m.id}',name:'${m.name}',location:'${m.location}'})">chevron_right</span>
              </div>
            </div>
          </div>`).join('')}</div>`;

        // Bind delete buttons
        document.querySelectorAll('[data-delete-machine]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const machineId = btn.dataset.deleteMachine;
            const machineName = btn.dataset.machineName;
            showModal(`
              <h2 class="text-lg font-semibold text-slate-900 mb-2">Delete Machine</h2>
              <p class="text-sm text-slate-500 mb-6">Are you sure you want to delete <strong class="text-slate-800">\${machineName}</strong>? This will deactivate the machine and all associated data. This action cannot be undone.</p>
              <div class="modal-actions">
                <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                <button class="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors" id="confirm-delete-machine">Delete Machine</button>
              </div>
            `);
            document.getElementById('confirm-delete-machine')?.addEventListener('click', async () => {
              try {
                await API.deleteMachine(machineId);
                closeModal();
                showToast('Machine deleted successfully', 'success');
                Router.navigate('machines');
              } catch (err) { showToast(err.message, 'error'); }
            });
          });
        });
      }

      // Bind add machine button
      document.getElementById('add-machine-top')?.addEventListener('click', () => {
        showModal(`<h2>Add New Machine</h2>
          <div class="form-group"><label class="form-label">Machine Name</label><input class="form-input" id="m-name" placeholder="e.g. Main Block Vending"></div>
          <div class="form-group"><label class="form-label">Location</label><input class="form-input" id="m-location" placeholder="e.g. Building A"></div>
          <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="m-save">Add Machine</button></div>`);
        document.getElementById('m-save')?.addEventListener('click', async () => {
          const name = document.getElementById('m-name').value.trim();
          const location = document.getElementById('m-location').value.trim();
          if (!name || !location) { showToast('Both fields required', 'error'); return; }
          try { await API.addMachine({ name, location }); closeModal(); showToast('Machine added!', 'success'); Router.navigate('machines'); }
          catch (e) { showToast(e.message, 'error'); }
        });
      });
    } catch (e) { showToast(e.message, 'error'); }
  }
};

const MachineDetailPage = {
  render(state) {
    return pageShell('machines', `
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <a class="hover:text-slate-700 cursor-pointer transition-colors" data-nav="machines">Machines</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-slate-700">${state.name}</span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-slate-900">${state.name}</h1>
            <p class="text-slate-500 text-sm mt-1 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">location_on</span>${state.location}</p>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button class="w-full sm:w-auto bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 text-sm font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2" id="add-product-btn">
              <span class="material-symbols-outlined text-[16px] text-emerald-600">add_circle</span>Add Product
            </button>
            <button class="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm" onclick="Router.navigate('upload',{machineId:'${state.id}',machineName:'${state.name}'})">
              <span class="material-symbols-outlined text-[16px]">upload_file</span>Upload CSV
            </button>
          </div>
        </div>
      </div>
      <div id="products-table"><div class="loading-spinner"></div></div>
    `);
  },
  async load(state) {
    try {
      const products = await API.getProducts(state.id);
      const el = document.getElementById('products-table');
      if (!products.length) {
        el.innerHTML = `<div class="bg-white border border-slate-200 rounded-xl p-12 text-center"><span class="material-symbols-outlined text-slate-300 text-5xl mb-3">inventory_2</span><div class="text-slate-800 font-semibold mb-1">No products yet</div><div class="text-slate-400 text-sm">Upload a CSV or manually add products to this machine.</div></div>`;
      } else {
      el.innerHTML = `<div class="bg-white border border-slate-200 rounded-xl overflow-x-auto w-full">
        <table class="w-full min-w-[600px]"><thead><tr class="border-b border-slate-100 bg-slate-50">
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Product</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Stock</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Priority</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Confidence</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Actions</th>
        </tr></thead><tbody>${products.map(p => {
          const pred = p.latest_prediction;
          const stockVal = p.stock_remaining != null ? p.stock_remaining : (pred ? pred.predicted_stock : null);
          const stockDisplay = stockVal != null ? Math.round(stockVal) : '—';

          const priorityBadge = p.is_priority
            ? '<span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">PRIORITY</span>'
            : '<span class="text-xs text-slate-400">—</span>';

          const confMap = { strong: ['bg-emerald-100 text-emerald-700 border-emerald-200', 'Strong'], building: ['bg-blue-100 text-blue-700 border-blue-200', 'Building'], low: ['bg-amber-100 text-amber-700 border-amber-200', 'Low'] };
          const dc = p.data_confidence || (pred ? pred.confidence_level : null);
          const [confCls, confLabel] = confMap[dc] || ['bg-slate-100 text-slate-500 border-slate-200', pred ? 'Low' : 'New'];

          const statusLabel = p.status === 'inactive' ? '<span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 ml-2">INACTIVE</span>' : '';
          return `<tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors ${p.status === 'inactive' ? 'opacity-50' : ''}">
            <td class="px-5 py-4 text-sm font-medium text-slate-800 cursor-pointer" onclick="Router.navigate('calendar',{machineId:'${state.id}',machineName:'${state.name}',productName:'${p.product_name}'})">${p.product_name}${statusLabel}</td>
            <td class="px-5 py-4 text-sm font-mono text-slate-600">${stockDisplay}</td>
            <td class="px-5 py-4">${priorityBadge}</td>
            <td class="px-5 py-4"><span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${confCls} border">${confLabel}</span></td>
            <td class="px-5 py-4">
              <div class="flex items-center gap-1">
                ${p.status !== 'inactive' ? `
                  <button class="${p.is_priority ? 'text-amber-500' : 'text-slate-400 hover:text-amber-600'} p-1.5 rounded-md hover:bg-amber-50 transition-colors" title="${p.is_priority ? 'Remove Priority' : 'Set Priority'}" data-toggle-priority="${p.id}" data-priority-val="${!p.is_priority}">
                    <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' ${p.is_priority ? 1 : 0};">star</span>
                  </button>
                  <button class="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Remove Product" data-deactivate-product="${p.id}" data-product-name="${p.product_name}">
                    <span class="material-symbols-outlined text-[16px]">remove_circle_outline</span>
                  </button>
                ` : `
                  <button class="text-slate-400 hover:text-emerald-600 p-1.5 rounded-md hover:bg-emerald-50 transition-colors" title="Restore Product" data-restore-product="${p.id}" data-product-name="${p.product_name}">
                    <span class="material-symbols-outlined text-[16px]">undo</span>
                  </button>
                `}
                <span class="material-symbols-outlined text-[18px] text-slate-300 cursor-pointer ml-1" onclick="Router.navigate('calendar',{machineId:'${state.id}',machineName:'${state.name}',productName:'${p.product_name}'})">chevron_right</span>
              </div>
            </td>
          </tr>`}).join('')}</tbody></table>
      </div>`;
      }

      // Bind Add Product button
      document.getElementById('add-product-btn')?.addEventListener('click', () => {
        showModal(`
          <h2 class="text-lg font-semibold text-slate-900 mb-1">Add Product</h2>
          <p class="text-sm text-slate-500 mb-5">Add a new product to <strong>${state.name}</strong></p>
          <div class="form-group"><label class="form-label">Product Name</label><input class="form-input" id="ap-name" placeholder="e.g. Pepsi 250ml"></div>
          <div class="form-group"><label class="form-label">Category</label>
            <select class="form-input" id="ap-category">
              <option value="beverage">Beverage</option>
              <option value="snack">Snack</option>
              <option value="chocolate">Chocolate</option>
              <option value="sanitary">Sanitary</option>
              <option value="medication">Medication</option>
              <option value="first-aid">First Aid</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <div class="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
              <span class="material-symbols-outlined text-[16px] text-primary">insights</span>Cold Start Setup
            </div>
            <p class="text-xs text-slate-400 mb-3">For products with no history, we'll estimate predictions using these values.</p>
            <div class="grid grid-cols-3 gap-3">
              <div><label class="form-label text-xs">Current Stock</label><input class="form-input" id="ap-stock" type="number" placeholder="e.g. 50" value="50"></div>
              <div><label class="form-label text-xs">Daily Sales (est.)</label><input class="form-input" id="ap-daily" type="number" placeholder="e.g. 5" value="5" step="0.5"></div>
              <div><label class="form-label text-xs">Max Capacity</label><input class="form-input" id="ap-capacity" type="number" placeholder="e.g. 100" value="100"></div>
            </div>
          </div>
          <div class="form-group"><label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" id="ap-priority" class="rounded border-slate-300"> Mark as Priority Product
          </label></div>
          <div class="modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="ap-save">Add Product</button></div>
        `);
        document.getElementById('ap-save')?.addEventListener('click', async () => {
          const product_name = document.getElementById('ap-name').value.trim();
          const category = document.getElementById('ap-category').value;
          const is_priority = document.getElementById('ap-priority').checked;
          const current_stock = parseFloat(document.getElementById('ap-stock').value) || 50;
          const estimated_daily_sales = parseFloat(document.getElementById('ap-daily').value) || 5;
          const max_capacity = parseFloat(document.getElementById('ap-capacity').value) || 100;
          if (!product_name) { showToast('Product name is required', 'error'); return; }
          try {
            await API.addProduct({ machine_id: state.id, product_name, category, is_priority, current_stock, estimated_daily_sales, max_capacity });
            closeModal();
            showToast('Product added with cold start predictions!', 'success');
            MachineDetailPage.load(state);
          } catch (e) { showToast(e.message, 'error'); }
        });
      });

      // Bind toggle priority
      document.querySelectorAll('[data-toggle-priority]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const productId = btn.dataset.togglePriority;
          const newVal = btn.dataset.priorityVal === 'true';
          try {
            await API.togglePriority(productId, newVal);
            showToast(`Priority ${newVal ? 'set' : 'removed'}`, 'success');
            MachineDetailPage.load(state);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });

      // Bind deactivate product
      document.querySelectorAll('[data-deactivate-product]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const productId = btn.dataset.deactivateProduct;
          const productName = btn.dataset.productName;
          showModal(`
            <h2 class="text-lg font-semibold text-slate-900 mb-2">Remove Product</h2>
            <p class="text-sm text-slate-500 mb-6">Are you sure you want to remove <strong class="text-slate-800">${productName}</strong>? The product will be deactivated but can be restored later.</p>
            <div class="modal-actions">
              <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
              <button class="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors" id="confirm-deactivate">Remove Product</button>
            </div>
          `);
          document.getElementById('confirm-deactivate')?.addEventListener('click', async () => {
            try {
              await API.deactivateProduct(productId);
              closeModal();
              showToast(`${productName} removed`, 'success');
              MachineDetailPage.load(state);
            } catch (err) { showToast(err.message, 'error'); }
          });
        });
      });

      // Bind restore product
      document.querySelectorAll('[data-restore-product]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const productId = btn.dataset.restoreProduct;
          const productName = btn.dataset.productName;
          try {
            await API.restoreProduct(productId);
            showToast(`${productName} restored`, 'success');
            MachineDetailPage.load(state);
          } catch (err) { showToast(err.message, 'error'); }
        });
      });

    } catch (e) { showToast(e.message, 'error'); }
  }
};
