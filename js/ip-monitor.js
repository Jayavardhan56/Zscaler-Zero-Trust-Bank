// ip-monitor.js - record and periodically check public IP; logout on change
(function(){
  // interval and api config
  const CHECK_INTERVAL_MS = 3 * 1000; // every 10s
  const IP_API = 'https://api.ipify.org?format=json'; // public IP provider

  let _timer = null;
  let _onChange = null;

  async function getPublicIP(){
    try {
      const r = await fetch(IP_API, {cache:'no-store'});
      if (!r.ok) throw new Error('ip fetch failed');
      const j = await r.json();
      return j.ip;
    } catch(e){
      console.warn('IP fetch error', e);
      // try backup service (uncomment if you want another)
      // const r2 = await fetch('https://api64.ipify.org?format=json');
      // const j2 = await r2.json(); return j2.ip;
      throw e;
    }
  }

  async function startMonitoring(onChange){
    if (_timer) return;
    _onChange = onChange || function(){};
    try {
      const initial = await getPublicIP();
      sessionStorage.setItem('ZT_LOGIN_IP', initial);
    } catch(e){
      console.warn('Could not obtain initial IP for monitoring.');
    }
    _timer = setInterval(async ()=>{
      try {
        const stored = sessionStorage.getItem('ZT_LOGIN_IP');
        const nowIP = await getPublicIP().catch(()=>null);
        if (!nowIP) return;
        if (stored && stored !== nowIP) {
          // IP changed
          _onChange(true);
        }
      } catch(e){
        console.warn('IP monitor error', e);
      }
    }, CHECK_INTERVAL_MS);
  }

  function stopMonitoring(){
    if (_timer) { clearInterval(_timer); _timer = null; }
  }

  // Make available globally
  window.IPMonitor = {
    getPublicIP,
    startMonitoring: startMonitoring,
    stop: stopMonitoring
  };
})();
