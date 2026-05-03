/* VendAI — UI Utilities: Sidebar, Page Shell, Toast, Modal (Light Theme) */

function showToast(msg, type = 'default', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function showModal(html) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${html}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}

function closeModal() {
  document.querySelector('.modal-overlay')?.remove();
}

function sidebarHTML(activePage = 'dashboard') {
  const user = JSON.parse(localStorage.getItem('vendai_user') || '{}');
  const initials = (user.name || 'V').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'machines', icon: 'precision_manufacturing', label: 'Machines' },
    { id: 'upload', icon: 'upload_file', label: 'Upload Data' },
    { id: 'insights', icon: 'insights', label: 'Insights' },
    { id: 'alerts', icon: 'notifications', label: 'Alerts' },
    { id: 'profile', icon: 'settings', label: 'Settings' },
  ];

  const navHTML = navItems.map(n => {
    const isActive = activePage === n.id;
    const activeClass = isActive
      ? 'bg-primary-light text-primary border-l-2 border-primary font-semibold'
      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50';
    return `
      <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg ${activeClass} transition-all cursor-pointer group text-sm" data-nav="${n.id}">
        <span class="material-symbols-outlined ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'} transition-colors text-[20px]">${n.icon}</span>
        <span>${n.label}</span>
      </a>`;
  }).join('');

  return `
    <!-- Mobile Sidebar Backdrop -->
    <div class="fixed inset-0 bg-slate-900/50 z-40 hidden md:hidden" id="mobile-sidebar-backdrop"></div>
    
    <nav id="app-sidebar" class="fixed left-0 top-0 h-full w-[240px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300">
      <div class="p-6 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="material-symbols-outlined text-primary text-xl">bolt</span>
          <span class="text-xl font-bold tracking-tight text-slate-900">VendAI</span>
        </div>
        <button class="md:hidden text-slate-400 hover:text-slate-700" id="close-sidebar">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="px-5 pb-3">
        <span class="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-semibold">Vending Intelligence</span>
      </div>
      <div class="flex-1 flex flex-col gap-0.5 px-3 mt-1">
        ${navHTML}
      </div>
      <div class="mt-auto px-4 py-4 border-t border-slate-100">
        <div class="flex items-center gap-3 cursor-pointer rounded-lg hover:bg-slate-50 p-2 transition-colors" data-nav="profile">
          <div class="w-8 h-8 rounded-full bg-primary-light border border-indigo-200 flex items-center justify-center text-xs font-semibold text-primary shrink-0">${initials}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-800 truncate">${user.name || 'Vendor'}</div>
            <div class="text-[11px] text-slate-400 truncate">${user.email || ''}</div>
          </div>
        </div>
      </div>
    </nav>`;
}

function bindSidebarNav() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      Router.navigate(el.dataset.nav);
      // Close sidebar on mobile after navigation
      document.getElementById('app-sidebar')?.classList.add('-translate-x-full');
      document.getElementById('mobile-sidebar-backdrop')?.classList.add('hidden');
    });
  });
  
  // Mobile sidebar toggle logic
  document.getElementById('open-sidebar')?.addEventListener('click', () => {
    document.getElementById('app-sidebar')?.classList.remove('-translate-x-full');
    document.getElementById('mobile-sidebar-backdrop')?.classList.remove('hidden');
  });
  
  document.getElementById('close-sidebar')?.addEventListener('click', () => {
    document.getElementById('app-sidebar')?.classList.add('-translate-x-full');
    document.getElementById('mobile-sidebar-backdrop')?.classList.add('hidden');
  });
  
  document.getElementById('mobile-sidebar-backdrop')?.addEventListener('click', () => {
    document.getElementById('app-sidebar')?.classList.add('-translate-x-full');
    document.getElementById('mobile-sidebar-backdrop')?.classList.add('hidden');
  });
}

function pageShell(activePage, contentHTML) {
  const user = JSON.parse(localStorage.getItem('vendai_user') || '{}');
  const initials = (user.name || 'V').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const pageTitle = {
    dashboard: 'Dashboard', machines: 'Machines', upload: 'Upload Data',
    insights: 'Insights', alerts: 'Alerts', profile: 'Settings'
  }[activePage] || 'VendAI';

  return `
    <div class="flex h-screen bg-canvas overflow-hidden">
      ${sidebarHTML(activePage)}
      <div class="flex-1 flex flex-col md:ml-[240px] w-full h-screen overflow-hidden">
        <header class="sticky top-0 h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md flex justify-between items-center px-4 md:px-6 z-30 shrink-0">
          <div class="flex items-center gap-3">
            <button class="md:hidden text-slate-500 hover:text-slate-800 p-1 rounded-md" id="open-sidebar">
              <span class="material-symbols-outlined">menu</span>
            </button>
            <span class="text-base font-semibold text-slate-800">${pageTitle}</span>
          </div>
          <div class="flex items-center gap-3">
            <button class="text-slate-400 hover:text-slate-700 transition-colors relative p-2 rounded-lg hover:bg-slate-50" data-nav="alerts">
              <span class="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button class="w-8 h-8 rounded-full bg-primary-light border border-indigo-200 flex items-center justify-center text-primary text-xs font-semibold hover:bg-indigo-100 transition-colors" data-nav="profile">${initials}</button>
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-6 lg:p-8">
          <div class="max-w-[1440px] mx-auto">
            ${contentHTML}
          </div>
        </main>
      </div>
    </div>`;
}
