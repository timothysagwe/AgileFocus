const subscribers = new Set();

export function getPath() {
  const base = import.meta.env.BASE_URL || '/';
  const p = window.location.pathname;
  if (p.startsWith(base)) return '/' + p.slice(base.length).replace(/^\/+/, '');
  return p;
}

export function navigate(href) {
  const base = import.meta.env.BASE_URL || '/';
  const full = base.replace(/\/+$/, '') + '/' + href.replace(/^\//, '');
  history.pushState(null, '', full);
  subscribers.forEach(fn => fn(getPath()));
}

export function onPathChange(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

window.addEventListener('popstate', () => {
  subscribers.forEach(fn => fn(getPath()));
});
