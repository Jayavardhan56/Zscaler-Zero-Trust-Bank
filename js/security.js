// security.js - inactivity auto-logout (uses Auth.getSession)
(function(){
  const IDLE_LIMIT_MS = 3 * 60 * 1000; // 3 minutes idle -> logout
  let idleTimer = null;

  function resetTimer(){
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      alert('Logged out due to inactivity.');
      Auth.clearSession();
      location.href = 'index.html';
    }, IDLE_LIMIT_MS);
  }

  function start() {
    ['mousemove','mousedown','keypress','touchstart','click'].forEach(ev=>{
      window.addEventListener(ev, resetTimer, {passive:true});
    });
    resetTimer();
  }

  window.Security = { start };
})();
