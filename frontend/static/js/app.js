/* VendAI — Landing, Login, Signup Pages (Light Theme) */

const LandingPage = {
  render() {
    return `
    <div class="min-h-screen bg-white flex flex-col font-sans">
      <nav class="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div class="flex justify-between items-center h-16 px-6 max-w-7xl mx-auto">
          <div class="flex items-center gap-8">
            <a class="text-xl font-bold text-slate-900 tracking-tighter flex items-center gap-2"><span class="material-symbols-outlined text-primary">bolt</span>VendAI</a>
            <div class="hidden md:flex gap-1">
              <a class="text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-3 py-1.5 transition-all" href="#features">Features</a>
              <a class="text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg px-3 py-1.5 transition-all" href="#how-it-works">How It Works</a>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <a class="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer" id="nav-login">Log In</a>
            <a class="text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg px-4 py-2 transition-colors cursor-pointer shadow-sm" id="nav-signup">Get Started Free</a>
          </div>
        </div>
      </nav>
      <main class="flex-grow">
        <section class="pt-32 pb-20 px-6 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-white to-white -z-10"></div>
          <div class="max-w-4xl mx-auto text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light border border-indigo-200 text-primary text-xs font-mono font-medium tracking-wider mb-8">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>AI-POWERED INVENTORY INTELLIGENCE
            </div>
            <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900">
              Know before you <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">run out.</span>
            </h1>
            <p class="text-xl md:text-2xl text-slate-500 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
              Smart stockout predictions for campus vending machines. Upload your data and our AI predicts exactly when each product will deplete.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a class="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-indigo-200 cursor-pointer" id="hero-signup">Start Predicting Free</a>
              <a class="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-lg transition-all cursor-pointer" href="#how-it-works">See How It Works</a>
            </div>
            <p class="mt-6 text-sm text-slate-400">No credit card · No hardware · 100% free</p>
          </div>
        </section>
        <section class="py-24 px-6 max-w-7xl mx-auto" id="features">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Everything you need to stay stocked.</h2>
            <p class="text-slate-500 text-lg">Powerful features wrapped in a simple interface.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${[
              ['online_prediction','Predict Stockouts','Advanced ML analyzes historical sales data to forecast exactly when machines will run empty.'],
              ['notifications_active','Smart Alerts','Receive proactive email notifications before critical inventory levels are reached.'],
              ['star','Priority Products','Sanitary pads and medication get automatic CRITICAL escalation — never let essentials run out.'],
              ['upload_file','CSV Upload','Seamlessly import your existing inventory reports. Smart column auto-mapper included.'],
              ['calendar_month','Seasonal Intelligence','Detects campus rhythms — finals week, holidays, events — adjusting predictions automatically.'],
              ['money_off','Zero Cost','Supabase + Flask + free tiers. No hidden costs, no credit card required.']
            ].map(([icon, title, desc]) => `
              <div class="bg-white p-8 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all">
                <div class="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-6">
                  <span class="material-symbols-outlined text-primary">${icon}</span>
                </div>
                <h3 class="text-lg font-semibold mb-3 text-slate-900">${title}</h3>
                <p class="text-slate-500 leading-relaxed text-sm">${desc}</p>
              </div>`).join('')}
          </div>
        </section>
        <section class="py-24 bg-slate-50 border-y border-slate-200" id="how-it-works">
          <div class="max-w-5xl mx-auto px-6">
            <div class="text-center mb-16">
              <h2 class="text-3xl md:text-4xl font-bold mb-4 text-slate-900">How it works</h2>
              <p class="text-slate-500 text-lg">Three steps from reactive to predictive.</p>
            </div>
            <div class="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-0">
              <div class="hidden md:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-slate-200 -translate-y-1/2 z-0"></div>
              ${[['1','Upload Data','Export a CSV from your existing system and drop it into VendAI.'],
                 ['2','AI Analyzes','Our engine processes historical trends, seasonality, and product velocity.'],
                 ['3','Get Predictions','View a dashboard showing exactly what to restock and when.']
              ].map(([num, title, desc]) => `
                <div class="relative z-10 flex flex-col items-center text-center w-full md:w-1/3 px-4">
                  <div class="w-16 h-16 rounded-full bg-white border-2 border-primary flex items-center justify-center text-xl font-bold mb-6 shadow-lg shadow-indigo-100 text-primary">${num}</div>
                  <h4 class="text-lg font-semibold text-slate-900 mb-2">${title}</h4>
                  <p class="text-sm text-slate-500">${desc}</p>
                </div>`).join('')}
            </div>
          </div>
        </section>
        <section class="py-24 px-6">
          <div class="max-w-5xl mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-12 text-center shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div class="relative z-10">
              <h2 class="text-4xl font-bold text-white mb-6">Stop guessing. Start predicting.</h2>
              <p class="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">Join campus operators who are eliminating stockouts with intelligent inventory forecasting.</p>
              <a class="inline-flex px-8 py-4 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-lg transition-colors shadow-xl cursor-pointer" id="cta-signup">Create Free Account</a>
            </div>
          </div>
        </section>
      </main>
      <footer class="py-12 bg-slate-50 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
          <div class="flex flex-col gap-3">
            <a class="text-lg font-black text-slate-900 flex items-center gap-2"><span class="material-symbols-outlined text-primary">bolt</span>VendAI</a>
            <p class="text-xs text-slate-400">&copy; 2026 VendAI. Prediction for Every Machine.</p>
            <p class="text-xs text-slate-400">Built by Anish Singh</p>
          </div>
        </div>
      </footer>
    </div>`;
  },
  bind() {
    document.getElementById('nav-login')?.addEventListener('click', () => Router.navigate('login'));
    document.getElementById('nav-signup')?.addEventListener('click', () => Router.navigate('signup'));
    document.getElementById('hero-signup')?.addEventListener('click', () => Router.navigate('signup'));
    document.getElementById('cta-signup')?.addEventListener('click', () => Router.navigate('signup'));
  }
};

const LoginPage = {
  render() {
    return `
    <div class="min-h-screen bg-slate-50 flex font-sans">
      <div class="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 bg-white border-r border-slate-200">
        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-2xl">bolt</span><span class="text-xl font-bold text-slate-900">VendAI</span></div>
        <div>
          <h2 class="text-4xl font-bold text-slate-900 leading-tight mb-4">Inventory intelligence,<br>delivered.</h2>
          <p class="text-slate-500 text-lg max-w-md">Predict stockouts before they happen. AI-powered forecasting for campus vending machines.</p>
        </div>
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <p class="text-slate-600 italic text-sm mb-3">"VendAI helped me cut emergency restocking trips by 60%. The prediction calendar is a game-changer."</p>
          <p class="text-slate-400 text-xs font-medium">— Raj Mehta, Campus Operator</p>
        </div>
      </div>
      <div class="w-full lg:w-[45%] flex items-center justify-center p-8">
        <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div class="flex items-center gap-2 lg:hidden mb-8"><span class="material-symbols-outlined text-primary">bolt</span><span class="text-lg font-bold text-slate-900">VendAI</span></div>
          <h1 class="text-2xl font-semibold text-slate-900 mb-2">Welcome back</h1>
          <p class="text-slate-500 text-sm mb-8">Sign in to your vending dashboard</p>
          <div id="login-error"></div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-600 mb-2">Email address</label>
            <div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
            <input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" type="email" id="login-email" placeholder="you@example.com"></div>
          </div>
          <div class="mb-2">
            <label class="block text-sm font-medium text-slate-600 mb-2">Password</label>
            <div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
            <input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-10 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" type="password" id="login-password" placeholder="Your password">
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] cursor-pointer hover:text-slate-600 transition-colors" id="toggle-login-password" title="Toggle Password Visibility">visibility</span></div>
          </div>
          <div class="text-right mb-6"><a class="text-xs text-primary hover:text-primary-hover cursor-pointer transition-colors" id="forgot-link">Forgot password?</a></div>
          <button class="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-colors text-sm shadow-sm" id="login-btn">Sign In</button>
          <div class="text-center mt-6 text-sm text-slate-500">Don't have an account? <a class="text-primary hover:text-primary-hover cursor-pointer font-medium" id="go-signup">Sign up</a></div>
        </div>
      </div>
    </div>`;
  },
  bind() {
    document.getElementById('toggle-login-password')?.addEventListener('click', (e) => {
      const input = document.getElementById('login-password');
      if (input.type === 'password') {
        input.type = 'text';
        e.target.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        e.target.textContent = 'visibility';
      }
    });

    document.getElementById('go-signup')?.addEventListener('click', () => Router.navigate('signup'));
    document.getElementById('login-btn')?.addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errEl = document.getElementById('login-error');
      errEl.innerHTML = '';
      try {
        document.getElementById('login-btn').textContent = 'Signing in...';
        document.getElementById('login-btn').disabled = true;
        const res = await API.login({ email, password });
        API.setAuth(res.access_token, res.user.id);
        localStorage.setItem('vendai_user', JSON.stringify(res.user));
        Router.navigate('dashboard');
      } catch (e) {
        errEl.innerHTML = `<div class="bg-danger-light border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">error</span>${e.message}</div>`;
        document.getElementById('login-btn').textContent = 'Sign In';
        document.getElementById('login-btn').disabled = false;
      }
    });
    document.getElementById('forgot-link')?.addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      if (!email) { showToast('Enter your email first', 'error'); return; }
      try { await API.forgotPassword(email); showToast('Reset link sent to your email', 'success'); }
      catch (e) { showToast(e.message, 'error'); }
    });
  }
};

const SignupPage = {
  render() {
    return `
    <div class="min-h-screen bg-slate-50 flex font-sans">
      <div class="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 bg-white border-r border-slate-200">
        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-2xl">bolt</span><span class="text-xl font-bold text-slate-900">VendAI</span></div>
        <div>
          <h2 class="text-4xl font-bold text-slate-900 leading-tight mb-4">Start predicting stockouts<br>in under 15 minutes.</h2>
          <p class="text-slate-500 text-lg max-w-md">Upload your CSV → Map columns → AI starts training immediately.</p>
        </div>
        <div></div>
      </div>
      <div class="w-full lg:w-[45%] flex items-center justify-center p-8">
        <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div class="flex items-center gap-2 lg:hidden mb-8"><span class="material-symbols-outlined text-primary">bolt</span><span class="text-lg font-bold text-slate-900">VendAI</span></div>
          <h1 class="text-2xl font-semibold text-slate-900 mb-2">Create your account</h1>
          <p class="text-slate-500 text-sm mb-8">Start your free vending intelligence dashboard</p>
          <div id="signup-error"></div>
          <div class="mb-4"><label class="block text-sm font-medium text-slate-600 mb-2">Full Name</label><div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span><input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" type="text" id="su-name" placeholder="Anish Singh"></div></div>
          <div class="mb-4"><label class="block text-sm font-medium text-slate-600 mb-2">City</label><div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span><input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" type="text" id="su-city" placeholder="Bhopal"></div></div>
          <div class="mb-4"><label class="block text-sm font-medium text-slate-600 mb-2">Email address</label><div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span><input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" type="email" id="su-email" placeholder="you@example.com"></div></div>
          <div class="mb-4"><label class="block text-sm font-medium text-slate-600 mb-2">Password</label><div class="relative"><span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span><input class="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 pl-10 pr-10 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors" type="password" id="su-password" placeholder="Min 8 characters"><span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] cursor-pointer hover:text-slate-600 transition-colors" id="toggle-su-password" title="Toggle Password Visibility">visibility</span></div></div>
          <p class="text-xs text-slate-400 mb-6">By signing up you agree to our Terms & Conditions.</p>
          <button class="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-colors text-sm shadow-sm" id="signup-btn">Create Account</button>
          <div class="text-center mt-6 text-sm text-slate-500">Already have an account? <a class="text-primary hover:text-primary-hover cursor-pointer font-medium" id="go-login">Sign in</a></div>
        </div>
      </div>
    </div>`;
  },
  bind() {
    document.getElementById('toggle-su-password')?.addEventListener('click', (e) => {
      const input = document.getElementById('su-password');
      if (input.type === 'password') {
        input.type = 'text';
        e.target.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        e.target.textContent = 'visibility';
      }
    });

    document.getElementById('go-login')?.addEventListener('click', () => Router.navigate('login'));
    document.getElementById('signup-btn')?.addEventListener('click', async () => {
      const name = document.getElementById('su-name').value.trim();
      const city = document.getElementById('su-city').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const password = document.getElementById('su-password').value;
      const errEl = document.getElementById('signup-error');
      errEl.innerHTML = '';
      if (!name || !city || !email || !password) {
        errEl.innerHTML = `<div class="bg-warning-light border border-amber-200 text-warning text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">warning</span>All fields are required</div>`;
        return;
      }
      try {
        document.getElementById('signup-btn').textContent = 'Creating account...';
        document.getElementById('signup-btn').disabled = true;
        await API.signup({ name, city, email, password });
        showToast('Account created! Check your email to verify.', 'success');
        Router.navigate('login');
      } catch (e) {
        errEl.innerHTML = `<div class="bg-danger-light border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">error</span>${e.message}</div>`;
        document.getElementById('signup-btn').textContent = 'Create Account';
        document.getElementById('signup-btn').disabled = false;
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = !!localStorage.getItem('vendai_token');
  let hash = window.location.hash.replace('#', '');
  
  // Clean up any stray URLs that shouldn't load directly via hash
  if (!hash) {
    hash = isLoggedIn ? 'dashboard' : 'landing';
  }
  
  // Replace the initial state so the first 'back' works properly
  history.replaceState({ page: hash, state: {} }, '', '#' + hash);
  Router.render(hash);
});
