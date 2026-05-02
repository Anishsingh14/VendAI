/* VendAI — Alerts & Profile/Settings Pages (Light Theme) */

const AlertsPage = {
  render() {
    return pageShell('alerts', `
      <div class="flex items-center justify-between mb-6">
        <div><h1 class="text-2xl font-semibold text-slate-900">Alerts</h1><p class="text-slate-500 text-sm mt-1">Recent stock alerts for all machines</p></div>
      </div>
      <div id="alerts-list"><div class="loading-spinner"></div></div>
    `);
  },
  async load() {
    try {
      const alerts = await API.getAlerts();
      const el = document.getElementById('alerts-list');
      if (!alerts.length) {
        el.innerHTML = `<div class="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <span class="material-symbols-outlined text-slate-300 text-5xl mb-4">notifications_off</span>
          <div class="text-slate-800 font-semibold mb-2">No alerts yet</div>
          <div class="text-slate-400 text-sm">Alerts fire when stock hits critical thresholds after CSV upload.</div>
        </div>`; return;
      }
      const iconMap = { WARNING: 'warning', CRITICAL: 'error', URGENT: 'crisis_alert' };
      const colorMap = { WARNING: ['bg-amber-100 text-amber-700 border-amber-200', 'text-amber-600'], CRITICAL: ['bg-red-100 text-red-700 border-red-200', 'text-red-600'], URGENT: ['bg-red-100 text-red-700 border-red-200', 'text-red-600'] };
      el.innerHTML = `<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table class="w-full"><thead><tr class="border-b border-slate-100 bg-slate-50">
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Product</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Machine</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Level</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Predicted Date</th>
          <th class="text-left text-[11px] uppercase tracking-wider text-slate-500 font-medium px-5 py-3">Sent</th>
        </tr></thead><tbody>${alerts.map(a => {
          const [badgeCls] = colorMap[a.alert_level] || ['bg-slate-100 text-slate-500 border-slate-200', ''];
          return `<tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
            <td class="px-5 py-4 text-sm text-slate-800 font-medium">${a.product_name}</td>
            <td class="px-5 py-4 text-sm text-slate-500 font-mono">${a.machine_id?.slice(0,8)}…</td>
            <td class="px-5 py-4"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${badgeCls} border">
              <span class="material-symbols-outlined text-[12px]">${iconMap[a.alert_level] || 'info'}</span>${a.alert_level}
            </span></td>
            <td class="px-5 py-4 text-sm text-slate-600 font-mono">${a.predicted_date || '—'}</td>
            <td class="px-5 py-4 text-sm text-slate-500">${new Date(a.sent_at).toLocaleString('en-IN')}</td>
          </tr>`}).join('')}</tbody></table>
      </div>`;
    } catch (e) { showToast(e.message, 'error'); }
  }
};

const ProfilePage = {
  render() {
    return pageShell('profile', `
      <div class="mb-6"><h1 class="text-2xl font-semibold text-slate-900">Settings</h1></div>
      <div id="profile-content"><div class="loading-spinner"></div></div>
    `);
  },
  async load() {
    try {
      const user = await API.getProfile();
      const initials = (user.name || 'V').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const el = document.getElementById('profile-content');
      el.innerHTML = `
        <!-- Profile Header -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-5 mb-6">
          <div class="w-16 h-16 rounded-full bg-primary-light border border-indigo-200 flex items-center justify-center text-xl font-bold text-primary">${initials}</div>
          <div><div class="text-lg font-semibold text-slate-900">${user.name || '—'}</div><div class="text-sm text-slate-500">${user.email || '—'}</div></div>
        </div>

        <!-- Account Info -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">person</span>Account Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="block text-sm text-slate-500 mb-2">Full Name</label>
              <input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" id="p-name" value="${user.name || ''}"></div>
            <div><label class="block text-sm text-slate-500 mb-2">City</label>
              <input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" id="p-city" value="${user.city || ''}"></div>
          </div>
          <button class="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-6 rounded-lg transition-colors mt-4 shadow-sm" id="btn-save-profile">Save Changes</button>
        </div>

        <!-- Email Settings -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">mail</span>Email Settings</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-slate-500 mb-2">Current Email</label>
              <input class="w-full bg-slate-100 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-400 text-sm cursor-not-allowed" value="${user.email || ''}" disabled>
            </div>
            <div>
              <label class="block text-sm text-slate-500 mb-2">New Email</label>
              <input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" id="p-new-email" placeholder="Enter new email address">
            </div>
          </div>
          <button class="bg-white border border-slate-200 hover:border-primary hover:bg-primary-light text-slate-700 hover:text-primary text-sm font-medium py-2.5 px-5 rounded-lg transition-colors mt-4 flex items-center gap-2" id="btn-change-email">
            <span class="material-symbols-outlined text-[16px]">swap_horiz</span>Change Email
          </button>
        </div>

        <!-- Password -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-primary">lock</span>Password</h3>
          <p class="text-sm text-slate-500 mb-4">To change your password, we'll send a reset link to your registered email address.</p>
          <button class="bg-white border border-slate-200 hover:border-primary hover:bg-primary-light text-slate-700 hover:text-primary text-sm font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2" id="btn-reset-password">
            <span class="material-symbols-outlined text-[16px]">key</span>Send Password Reset Link
          </button>
        </div>

        <!-- Alert Config -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[18px] text-amber-500">notifications</span>Alert Configuration</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-500">Alert Email</span><span class="text-slate-800">${user.alert_email || user.email || '—'}</span></div>
            <div class="flex justify-between items-center py-2"><span class="text-slate-500">Status</span><span class="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Active</span></div>
          </div>
          <button class="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm py-2.5 px-5 rounded-lg transition-colors mt-4 flex items-center gap-2" id="btn-test-alert"><span class="material-symbols-outlined text-[16px]">send</span>Send Test Alert</button>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white border border-red-200 rounded-xl p-6">
          <h3 class="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">warning</span>Danger Zone</h3>
          <p class="text-sm text-slate-500 mb-4">Sign out of your VendAI account.</p>
          <button class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium py-2.5 px-6 rounded-lg hover:bg-red-100 transition-colors" id="btn-logout">Sign Out</button>
        </div>`;

      // Save Profile
      document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
        const name = document.getElementById('p-name').value.trim();
        const city = document.getElementById('p-city').value.trim();
        try {
          await API.updateProfile({ name, city });
          const s = JSON.parse(localStorage.getItem('vendai_user') || '{}');
          localStorage.setItem('vendai_user', JSON.stringify({ ...s, name, city }));
          showToast('Profile updated!', 'success');
        } catch (e) { showToast(e.message, 'error'); }
      });

      // Change Email
      document.getElementById('btn-change-email')?.addEventListener('click', async () => {
        const newEmail = document.getElementById('p-new-email').value.trim();
        if (!newEmail) { showToast('Enter a new email address', 'error'); return; }
        if (!newEmail.includes('@')) { showToast('Invalid email format', 'error'); return; }

        showModal(`
          <h2 class="text-lg font-semibold text-slate-900 mb-2">Confirm Email Change</h2>
          <p class="text-sm text-slate-500 mb-2">Your login email and alert email will be changed to:</p>
          <p class="text-sm font-semibold text-primary mb-6">${newEmail}</p>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p class="text-xs text-amber-700 flex items-center gap-2"><span class="material-symbols-outlined text-[14px]">info</span>You will need to log in again with your new email after this change.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
            <button class="bg-primary hover:bg-primary-hover text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors" id="confirm-email-change">Change Email</button>
          </div>
        `);
        document.getElementById('confirm-email-change')?.addEventListener('click', async () => {
          try {
            await API.changeEmail(newEmail);
            closeModal();
            showToast('Email changed! Please log in again.', 'success');
            // Force re-login
            setTimeout(() => {
              API.clearAuth();
              Router.navigate('landing');
            }, 2000);
          } catch (e) {
            closeModal();
            showToast(e.message, 'error');
          }
        });
      });

      // Reset Password
      document.getElementById('btn-reset-password')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalHtml = btn.innerHTML;
        const email = user.email;
        if (!email) { showToast('No email found', 'error'); return; }
        try {
          btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span>Sending...';
          btn.disabled = true;
          await API.forgotPassword(email);
          showToast('Password reset link sent to your email!', 'success');
        } catch (err) { 
          showToast(err.message, 'error'); 
        } finally {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }
      });

      // Test Alert
      document.getElementById('btn-test-alert')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalHtml = btn.innerHTML;
        try { 
          btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">sync</span>Sending...';
          btn.disabled = true;
          const r = await API.sendTestAlert(); 
          showToast(r.message || 'Test alert sent!', 'success'); 
        } catch (err) { 
          showToast(err.message, 'error'); 
        } finally {
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }
      });

      // Logout
      document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await API.logout().catch(() => {});
        API.clearAuth();
        Router.navigate('landing');
      });
    } catch (e) { showToast(e.message, 'error'); }
  }
};
