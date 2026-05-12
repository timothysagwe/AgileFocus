import { base } from './base-path.js';

const listeners = new Set();

function stripBase(path) {
  if (base === '/') return path;
  if (path.startsWith(base)) {
    return '/' + path.slice(base.length);
  }
  return path;
}

let currentPath = stripBase(window.location.pathname);

export function getPath() {
  return currentPath;
}

export function navigate(path) {
  const fullPath = base.replace(/\/$/, '') + path;
  history.pushState(null, '', fullPath);
  currentPath = path;
  listeners.forEach(fn => fn(path));
}

export function onPathChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

window.addEventListener('popstate', () => {
  currentPath = stripBase(window.location.pathname);
  listeners.forEach(fn => fn(currentPath));
});
