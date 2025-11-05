// transfer.js - transfer logic & history records
(function(){
  function fmtTime(ts){ return new Date(ts).toLocaleString(); }

  function addHistory(username, entry){
    const u = StorageAPI.findUser(username);
    if (!u) return;
    u.history = u.history || [];
    u.history.unshift(entry);
    if (u.history.length > 500) u.history.length = 500;
    StorageAPI.updateUser(u);
  }

  function doTransfer(fromUser, toUser, amount){
    amount = Number(amount);
    if (!fromUser || !toUser) return { ok:false, error:'Missing usernames' };
    if (!Number.isFinite(amount) || amount <= 0) return { ok:false, error:'Invalid amount' };
    if (fromUser.toLowerCase() === toUser.toLowerCase()) return { ok:false, error:'Cannot transfer to self' };
    const from = StorageAPI.findUser(fromUser);
    const to = StorageAPI.findUser(toUser);
    if (!from) return { ok:false, error:'Sender not found' };
    if (!to) return { ok:false, error:'Recipient not found' };
    if (from.balance < amount) return { ok:false, error:'Insufficient funds' };

    from.balance = Number((from.balance - amount).toFixed(2));
    to.balance = Number((to.balance + amount).toFixed(2));
  // Persist updated balances first so history entries reflect the correct stored state.
  StorageAPI.updateUser(from);
  StorageAPI.updateUser(to);

  const ts = Date.now();
  addHistory(from.username, { when: ts, type:'debit', other: to.username, amount: -amount, balanceAfter: from.balance });
  addHistory(to.username, { when: ts, type:'credit', other: from.username, amount: amount, balanceAfter: to.balance });
    return { ok:true, from, to, when:ts };
  }

  function clearUserHistory(username){
    const u = StorageAPI.findUser(username);
    if (!u) return { ok:false };
    u.history = [];
    StorageAPI.updateUser(u);
    return { ok:true };
  }

  window.TransferAPI = { doTransfer, clearUserHistory, fmtTime };
})();
