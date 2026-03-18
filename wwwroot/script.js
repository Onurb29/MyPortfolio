const button = document.getElementById('fetch-data');
const container = document.getElementById('data-container');

button.addEventListener('click', async () => {
  container.textContent = 'Loading...';

  try {
    const response = await fetch('/api/hello', { headers: { 'Accept': 'text/plain' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    container.textContent = text;
  } catch (err) {
    container.textContent = `Error: ${err.message ?? err}`;
  }
});
