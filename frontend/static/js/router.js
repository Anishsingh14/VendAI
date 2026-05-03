/* VendAI — SPA Router */

const Router = {
  state: {},

  navigate(page, state = {}, replace = false) {
    this.state = state;
    if (replace) {
      history.replaceState({ page, state }, '', '#' + page);
    } else {
      history.pushState({ page, state }, '', '#' + page);
    }
    this.render(page);
  },

  render(page) {
    const app = document.getElementById('app');
    const isLoggedIn = !!localStorage.getItem('vendai_token');

    const publicPages = ['landing', 'login', 'signup'];
    if (!isLoggedIn && !publicPages.includes(page)) {
      this.navigate('landing', {}, true);
      return;
    }
    if (isLoggedIn && publicPages.includes(page)) {
      this.navigate('dashboard', {}, true);
      return;
    }

    switch (page) {
      case 'landing':   app.innerHTML = LandingPage.render(); LandingPage.bind(); break;
      case 'login':     app.innerHTML = LoginPage.render(); LoginPage.bind(); break;
      case 'signup':    app.innerHTML = SignupPage.render(); SignupPage.bind(); break;
      case 'dashboard': app.innerHTML = DashboardPage.render(); DashboardPage.load(); break;
      case 'machines':  app.innerHTML = MachinePage.render(); MachinePage.load(); break;
      case 'machine-detail': 
        if (!this.state || !this.state.id || this.state.id === 'undefined') { this.navigate('machines', {}, true); return; }
        app.innerHTML = MachineDetailPage.render(this.state); MachineDetailPage.load(this.state); break;
      case 'calendar':  
        if (!this.state || !this.state.machineId || this.state.machineId === 'undefined') { this.navigate('dashboard', {}, true); return; }
        app.innerHTML = CalendarPage.render(this.state); CalendarPage.load(this.state); break;
      case 'upload':    
        if (!this.state || !this.state.machineId || this.state.machineId === 'undefined') { this.navigate('machines', {}, true); return; }
        app.innerHTML = UploadPage.render(this.state); UploadPage.bind(this.state); break;
      case 'insights':  app.innerHTML = InsightsPage.render(); InsightsPage.load(); break;
      case 'alerts':    app.innerHTML = AlertsPage.render(); AlertsPage.load(); break;
      case 'profile':   app.innerHTML = ProfilePage.render(); ProfilePage.load(); break;
      default:          this.navigate('dashboard', {}, true); return; // return here to avoid double execution on default
    }

    setTimeout(bindSidebarNav, 0);
  }
};

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.page) {
    Router.state = event.state.state || {};
    Router.render(event.state.page);
  } else {
    let hash = window.location.hash.replace('#', '');
    if (!hash) hash = !!localStorage.getItem('vendai_token') ? 'dashboard' : 'landing';
    Router.state = {};
    Router.render(hash);
  }
});
