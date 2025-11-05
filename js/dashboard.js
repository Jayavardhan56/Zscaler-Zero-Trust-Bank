// dashboard.js - connect UI to storage, auth, transfer, IP monitor, security
(function(){
  function q(id){ return document.getElementById(id); }
  function showMsg(el, text, cls){ el.textContent = text || ''; el.className = cls ? 'msg ' + cls : 'msg'; }

  function loadProfile(){
    const s = Auth.getSession();
    if (!s) { location.href = 'index.html'; return null; }
    const user = StorageAPI.findUser(s.username);
    if (!user) { Auth.clearSession(); location.href = 'index.html'; return null; }
    q('userName').textContent = `${user.displayName} (${user.username})`;
    q('userBal').textContent = '₹' + Number(user.balance).toFixed(2);
    return user;
  }

  function renderHistory(user){
    // 🔄 Always refetch the latest copy from storage to ensure fresh history
    const freshUser = StorageAPI.findUser(user.username);
    const tbody = q('historyTable').querySelector('tbody');
    tbody.innerHTML = '';
    const items = (freshUser.history || []);
    if (!items.length){
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="color:var(--muted)">No transactions yet</td>';
      tbody.appendChild(tr);
      return;
    }
    for (const it of items){
      const tr = document.createElement('tr');
      const when = new Date(it.when || Date.now()).toLocaleString();
      const type = it.type || (it.amount >= 0 ? 'credit':'debit');
      const other = it.other || '';
      const amt = (it.amount >= 0 ? '+' : '') + Number(it.amount).toFixed(2);
      const bal = (it.balanceAfter !== undefined) ? '₹' + Number(it.balanceAfter).toFixed(2) : '-';
      tr.innerHTML = `<td>${when}</td><td>${type}</td><td>${other}</td><td>${amt}</td><td>${bal}</td>`;
      tbody.appendChild(tr);
    }
  }

  function updateSessionCountdown(){
    const s = Auth.getSession();
    const el = q('sessCountdown');
    if (!s) { el.textContent = 'expired'; return; }
    const ms = s.expiresAt - Date.now();
    if (ms <= 0) { el.textContent = 'expired'; Auth.clearSession(); location.href = 'index.html'; return; }
    const m = Math.floor(ms/60000), sec = Math.floor((ms%60000)/1000);
    el.textContent = `${m}m ${sec}s`;
  }

  async function updateCurrentIP(){
    const el = q('curIP');
    const ip = sessionStorage.getItem('ZT_LOGIN_IP') || '—';
    el.textContent = ip;
    // show live fetch optionally
    try {
      const ipNow = await window.IPMonitor.getPublicIP().catch(()=>null);
      if (ipNow) el.textContent = ipNow;
    } catch(e){}
  }

  document.addEventListener('DOMContentLoaded', () => {
    const s = Auth.getSession();
    if (!s) { location.href = 'index.html'; return; }

    // start security idle timer
    Security.start();

    // start IP monitor callback if not already started
    window.IPMonitor.startMonitoring((changed) => {
      if (changed) {
        alert('Public IP changed. Logging out for security.');
        Auth.clearSession();
        location.href = 'index.html';
      }
    });

    // set up UI
    q('logoutBtn').addEventListener('click', ()=> {
      if (confirm('Logout?')) {
        Auth.clearSession();
        location.href='index.html';
      }
    });

    q('refreshBtn').addEventListener('click', ()=> {
      const u = loadProfile();
      if (u) renderHistory(u); // ✅ now re-fetches updated history
      updateCurrentIP();
    });

    // transfer handler
    q('transferForm').addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const to = q('toUser').value.trim();
      const amount = Number(q('amount').value);
      const msg = q('txMsg'); showMsg(msg,'','');
      if (!to || !amount || amount <=0) {
        showMsg(msg,'Enter valid recipient and amount','error'); return;
      }
      const s = Auth.getSession();
      if (!s) { location.href='index.html'; return; }

      const res = TransferAPI.doTransfer(s.username, to, amount);
      if (!res.ok) { showMsg(msg, res.error || 'Transfer failed','error'); return; }

      showMsg(msg,'Transfer successful','success');
      q('toUser').value=''; q('amount').value='';
      
      // 🔄 Fetch updated user info & render fresh history
      const updatedUser = StorageAPI.findUser(s.username);
      if (updatedUser) {
        loadProfile();
        renderHistory(updatedUser);
      }
    });

    q('clearHist').addEventListener('click', ()=> {
      if (!confirm('Clear your history?')) return;
      const s = Auth.getSession();
      if (!s) return;
      const r = TransferAPI.clearUserHistory(s.username);
      if (r.ok) {
        alert('History cleared');
        const u = loadProfile();
        if (u) renderHistory(u);
      }
    });

    // initial render + timers
    const user = loadProfile();
    if (user) renderHistory(user);
    updateSessionCountdown();
    updateCurrentIP();
    setInterval(updateSessionCountdown, 1000);
    setInterval(updateCurrentIP, 15*1000);
  });
})();
