/* VendAI — Upload Wizard Page (Light Theme) */

const UploadPage = {
  _step: 1,
  _file: null,
  _headers: [],
  _machineId: null,

  render(state) {
    this._step = 1; this._file = null; this._headers = [];
    this._machineId = state?.machineId || null;
    const machineName = state?.machineName || 'Machine';
    return pageShell('upload', `
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <a class="hover:text-slate-700 cursor-pointer transition-colors" data-nav="dashboard">Dashboard</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-slate-700">Upload → ${machineName}</span>
        </div>
        <h1 class="text-2xl font-semibold text-slate-900">Upload Inventory Data</h1>
        <p class="text-slate-500 text-sm mt-1">Import a CSV file. We'll map columns and train predictions automatically.</p>
      </div>
      <div class="flex items-center gap-4 mb-8">
        ${[['1','Upload File'],['2','Map Columns'],['3','Processing']].map(([n,l], i) => `
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i+1 <= this._step ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'} transition-colors" id="step-${n}-dot">${n}</div>
            <span class="text-sm ${i+1 <= this._step ? 'text-slate-800 font-medium' : 'text-slate-400'}" id="step-${n}-label">${l}</span>
          </div>
          ${i < 2 ? '<div class="flex-1 h-0.5 bg-slate-200 rounded"></div>' : ''}`).join('')}
      </div>
      <div id="upload-content">
        <div class="dropzone-area" id="dropzone">
          <span class="material-symbols-outlined text-5xl text-slate-300 mb-4">cloud_upload</span>
          <p class="text-slate-700 font-medium text-lg mb-2">Drop your CSV file here</p>
          <p class="text-slate-400 text-sm mb-4">or click to browse</p>
          <input type="file" accept=".csv" class="hidden" id="csv-input">
          <button class="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm" id="browse-btn">Browse Files</button>
        </div>
      </div>
    `);
  },

  bind(state) {
    const dropzone = document.getElementById('dropzone');
    const input = document.getElementById('csv-input');
    document.getElementById('browse-btn')?.addEventListener('click', () => input.click());
    input?.addEventListener('change', e => { if (e.target.files[0]) this._handleFile(e.target.files[0]); });
    dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone?.addEventListener('drop', e => { e.preventDefault(); dropzone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) this._handleFile(e.dataTransfer.files[0]); });
  },

  async _handleFile(file) {
    this._file = file;
    const text = await file.text();
    const firstLine = text.split('\n')[0];
    this._headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
    this._showStep2();
  },

  _showStep2() {
    this._step = 2;
    this._updateSteps();
    const required = ['date', 'product_name', 'stock_remaining', 'units_consumed', 'stock_added'];
    document.getElementById('upload-content').innerHTML = `
      <div class="bg-white border border-slate-200 rounded-xl p-6">
        <h2 class="text-base font-semibold text-slate-800 mb-1">Map Columns</h2>
        <p class="text-slate-400 text-sm mb-6">Match your CSV columns to VendAI fields.</p>
        <div class="overflow-x-auto">
          <table class="w-full"><thead><tr class="border-b border-slate-100 bg-slate-50">
            <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">VendAI Field</th>
            <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Your CSV Column</th>
          </tr></thead><tbody>
          ${required.map(f => {
            const auto = this._headers.find(h => h.toLowerCase().replace(/[^a-z]/g,'').includes(f.replace(/_/g,'')));
            return `<tr class="border-b border-slate-50"><td class="px-5 py-4 text-sm font-mono text-slate-700">${f}</td>
            <td class="px-5 py-4"><select class="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors w-full max-w-xs" data-field="${f}">
              <option value="">— Select —</option>
              ${this._headers.map(h => `<option value="${h}" ${h === auto ? 'selected' : ''}>${h}</option>`).join('')}
            </select></td></tr>`;
          }).join('')}
          </tbody></table>
        </div>
        <button class="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-6 rounded-lg transition-colors mt-6 shadow-sm" id="submit-mapping">Upload & Train</button>
      </div>`;
    document.getElementById('submit-mapping')?.addEventListener('click', () => this._submitUpload());
  },

  async _submitUpload() {
    const mapping = {};
    document.querySelectorAll('[data-field]').forEach(sel => {
      if (sel.value) mapping[sel.dataset.field] = sel.value;
    });
    if (Object.keys(mapping).length < 5) { showToast('Please map all required columns', 'error'); return; }
    this._step = 3; this._updateSteps();
    document.getElementById('upload-content').innerHTML = `
      <div class="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <div class="loading-spinner"></div>
        <p class="text-slate-700 font-medium mt-4">Processing CSV & training model…</p>
        <p class="text-slate-400 text-sm mt-2">This may take 15–30 seconds depending on data size.</p>
      </div>`;
    try {
      // Step 1: Upload the file to get a temp_filename on the server
      const formData = new FormData();
      formData.append('file', this._file);
      formData.append('machine_id', this._machineId);
      const detectRes = await fetch(`${API_BASE}/upload/detect-columns`, {
        method: 'POST',
        headers: { 'X-User-ID': API._userId },
        body: formData
      });
      const detectData = await detectRes.json();
      if (!detectRes.ok) throw new Error(detectData.error || 'Upload failed');

      // Step 2: Process with column mapping
      const res = await API.processUpload({
        temp_filename: detectData.temp_filename,
        machine_id: this._machineId,
        column_mapping: mapping
      });
      this._showReport(res);
    } catch (e) {
      document.getElementById('upload-content').innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <span class="material-symbols-outlined text-red-600 text-3xl">error</span>
          <div>
            <div class="text-red-800 font-semibold">Upload failed</div>
            <div class="text-red-600 text-sm">${e.message}</div>
          </div>
        </div>`;
    }
  },

  _showReport(res) {
    document.getElementById('upload-content').innerHTML = `
      <div class="bg-white border border-slate-200 rounded-xl p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center"><span class="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span></div>
          <div>
            <div class="text-lg font-semibold text-slate-800">Upload Complete</div>
            <div class="text-sm text-slate-400">${res.rows_loaded || res.rows_processed || 0} rows processed · ${res.products_detected || res.products_found || 0} products detected</div>
          </div>
        </div>
        ${(res.data_health || res.health_report) ? (() => { const h = res.data_health || res.health_report; return `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          ${[['Rows Used', h.rows_used || '—'],['Duplicates Removed', h.duplicates_removed || 0],['Gaps Filled', h.gaps_filled || 0],['Quality', h.quality_score || 'N/A']].map(([l,v]) => `
            <div class="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
              <div class="text-xl font-bold text-slate-900">${v}</div>
              <div class="text-[11px] text-slate-400 font-medium uppercase tracking-wide">${l}</div>
            </div>`).join('')}
        </div>`; })() : ''}
        <div class="flex gap-3">
          <button class="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors shadow-sm" onclick="Router.navigate('machine-detail',{id:'${this._machineId}',name:''})">View Products</button>
          <button class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 px-5 rounded-lg transition-colors" data-nav="dashboard">Back to Dashboard</button>
        </div>
      </div>`;
  },

  _updateSteps() {
    for (let i = 1; i <= 3; i++) {
      const dot = document.getElementById(`step-${i}-dot`);
      const label = document.getElementById(`step-${i}-label`);
      if (dot) {
        dot.className = `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i <= this._step ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`;
      }
      if (label) {
        label.className = `text-sm ${i <= this._step ? 'text-slate-800 font-medium' : 'text-slate-400'}`;
      }
    }
  }
};
