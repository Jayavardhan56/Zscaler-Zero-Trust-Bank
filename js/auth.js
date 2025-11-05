// auth.js - local auth + session + hooks for future Auth0
(function(){
  const SESSION_KEY = 'ZT_BANK_SESSION_V2';
  // default session timeout (ms)
  const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  function now(){ return Date.now(); }

  function setSession(username){
    const sess = {
      username,
      issuedAt: now(),
      expiresAt: now() + SESSION_TIMEOUT_MS,
      token: 'zt-'+Math.random().toString(36).slice(2,10)
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    return sess;
  }

  function getSession(){
    const s = sessionStorage.getItem(SESSION_KEY);
    if (!s) return null;
    try {
      const obj = JSON.parse(s);
      if (Date.now() > obj.expiresAt) { clearSession(); return null; }
      return obj;
    } catch(e){ return null; }
  }

  function clearSession(){
    sessionStorage.removeItem(SESSION_KEY);
    // also stop ip monitor
    if (window.IPMonitor && window.IPMonitor.stop) window.IPMonitor.stop();
  }

  // Local login
  async function loginLocal(username, password){
    if (!username || !password) return { ok:false, error:'Enter credentials' };
    const user = StorageAPI.findUser(username);
    if (!user) return { ok:false, error:'User not found' };
    // simple password check
    if (password !== user.password) {
      return { ok:false, error:'Invalid username or password' };
    }
    // create session
    const s = setSession(user.username);

    // get public IP and start IP monitor
    const ip = await window.IPMonitor && window.IPMonitor.getPublicIP().catch(()=>null);
    if (ip) {
      sessionStorage.setItem('ZT_LOGIN_IP', ip);
      // start periodic check
      window.IPMonitor.startMonitoring((changed) => {
        if (changed) {
          alert('Your public IP changed — logging out for security.');
          clearSession();
          location.href = 'index.html';
        }
      });
    } else {
      // IP was not obtained — app continues but warn user
      console.warn('Public IP unobtainable — IP-based session protection disabled.');
    }

    return { ok:true, session: s };
  }

  // Hook for future Auth0 login (placeholder)
  async function loginWithAuth0(){ 
    // When you plug Auth0: call your auth login flow -> then call setSession(authenticatedUsername)
    alert('Auth0 login flow not configured in this build. Use local login or ask me to enable Auth0 now.');
  }

  // Expose utils for dashboard
  window.Auth = {
    loginLocal,
    loginWithAuth0,
    setSession,
    getSession,
    clearSession,
    SESSION_TIMEOUT_MS
  };
})();
