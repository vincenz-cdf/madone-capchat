document.getElementById("sign-in-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch('/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Network response was not ok.');
        }
    })
    .then(data => {
        if (data.auth) {
            alert('Signin successful');
            window.location.href = '/capchat';
        } else {
            alert('Signin failed: ' + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});
