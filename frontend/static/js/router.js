/* VendAI — SPA Router */

const Router = {
  state: {},

  navigate(page, state = {}) {
    this.state = state;
    this.render(page);
  },

  render(page) {
    const app = document.getElementById('app');
    const isLoggedIn = !!localStorage.getItem('vendai_token');

    // Guard: redirect to login if not authenticated
    const publicPages = ['landing', 'login', 'signup'];
    if (!isLoggedIn && !publicPages.includes(page)) {
      this.render('landing');
      return;
    }
    if (isLoggedIn && publicPages.includes(page)) {
      this.render('dashboard');
      return;
    }

    switch (page) {
      case 'landing':   app.innerHTML = LandingPage.render(); LandingPage.bind(); break;
      case 'login':     app.innerHTML = LoginPage.render(); LoginPage.bind(); break;
      case 'signup':    app.innerHTML = SignupPage.render(); SignupPage.bind(); break;
      case 'dashboard': app.innerHTML = DashboardPage.render(); DashboardPage.load(); break;
      case 'machines':  app.innerHTML = MachinePage.render(); MachinePage.load(); break;
      case 'machine-detail': app.innerHTML = MachineDetailPage.render(this.state); MachineDetailPage.load(this.state); break;
      case 'calendar':  app.innerHTML = CalendarPage.render(this.state); CalendarPage.load(this.state); break;
      case 'upload':    app.innerHTML = UploadPage.render(this.state); UploadPage.bind(this.state); break;
      case 'insights':  app.innerHTML = InsightsPage.render(); InsightsPage.load(); break;
      case 'alerts':    app.innerHTML = AlertsPage.render(); AlertsPage.load(); break;
      case 'profile':   app.innerHTML = ProfilePage.render(); ProfilePage.load(); break;
      default:          this.render('dashboard');
    }

    // Bind sidebar nav after render
    setTimeout(bindSidebarNav, 0);
  }
};
