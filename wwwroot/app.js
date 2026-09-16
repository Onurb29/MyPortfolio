const buttons = document.querySelectorAll('[data-panel]');
const panels = document.querySelectorAll('.panel, .lab-panel');
buttons.forEach(button => {
  button.setAttribute('aria-controls', button.dataset.panel);
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.addEventListener('click', () => {
    buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    panels.forEach(p => p.classList.remove('active'));
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    const panel = document.getElementById(button.dataset.panel);
    if (panel) panel.classList.add('active');
    window.dispatchEvent(new Event('architecture-layout'));
  });
});

