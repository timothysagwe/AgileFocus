const listeners = new Set();

let currentPath = window.location.pathname;

export function getPath() {
  return currentPath;
}

export function navigate(path) {
  history.pushState(null, '', path);
  currentPath = path;
  listeners.forEach(fn => fn(path));
}

export function onPathChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

window.addEventListener('popstate', () => {
  currentPath = window.location.pathname;
  listeners.forEach(fn => fn(currentPath));
});
