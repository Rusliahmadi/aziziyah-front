fetch('https://your-backend-host.com/api/data')
  .then(response => response.json())
  .then(data => {
    const list = document.getElementById('data-list');
    data.forEach(item => {
      const li = document.createElement('li');
      li.textContent = JSON.stringify(item);
      list.appendChild(li);
    });
  })
  .catch(error => console.error('Error:', error));
