
const KEY = 'fatec-admin-session';

function isAuthenticated() {
  return !!localStorage.getItem(KEY);
}
function getUser() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}
function setUser(userObj) {
  localStorage.setItem(KEY, JSON.stringify(userObj));
}
function clear() {
  localStorage.removeItem(KEY);
}

window.Session = { isAuthenticated, getUser, setUser, clear };
