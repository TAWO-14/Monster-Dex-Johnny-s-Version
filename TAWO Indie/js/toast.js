let timer = null;

export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;

  clearTimeout(timer);

  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');

  timer = setTimeout(() => {
    el.classList.remove('show');
  }, 2200);
}