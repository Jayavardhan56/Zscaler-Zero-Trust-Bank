// storage.js - localStorage DB for users & data (Fixed)
(function(){
  const KEY = 'ZT_BANK_USERS_V2';

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch(e){ return null; }
  }

  function write(v){
    localStorage.setItem(KEY, JSON.stringify(v));
  }

  function createSampleUsers(force=false){
    if (read() && !force) return;
    const users = [
      { username: 'alice', displayName:'Alice Johnson', password:'alice123', balance:5000, history:[], meta:{} },
      { username: 'bob', displayName:'Bob Martinez', password:'bob123', balance:3200, history:[], meta:{} },
      { username: 'charlie', displayName:'Charlie Rao', password:'charlie123', balance:10000, history:[], meta:{} }
    ];
    write(users);
  }

  function allUsers(){
    return read() || [];
  }

  function findUser(username){
    if (!username) return null;
    const users = allUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  function updateUser(user){
    if (!user || !user.username) return;
    const users = allUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx !== -1) {
      // merge new fields but keep existing metadata if missing
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    write(users);
  }

  function saveUsers(list){
    write(list);
  }

  window.StorageAPI = { createSampleUsers, allUsers, findUser, updateUser, saveUsers };

  // Auto-init sample users if none exist
  if (!read()) createSampleUsers();
})();
