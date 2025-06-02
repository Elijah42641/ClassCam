document.querySelector('.getstarted').addEventListener('click', async () => {
  const email = document.querySelector('.username').value.trim();
  const password = document.querySelector('.password').value.trim();

  const usernameError = document.querySelector('.invalidUsername');
  const passwordError = document.querySelector('.invalidPassword');

  // Clear previous error messages
  usernameError.textContent = '';
  passwordError.textContent = '';

  try {
   const response = await fetch('http://localhost:3000/api/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

let data;
try {
  data = await response.json();
} catch (e) {
  console.error('Failed to parse JSON:', e);
  usernameError.textContent = 'Invalid response from server';
  return;
}

if (!response.ok) {
  usernameError.textContent = data?.error || 'Sign-in failed';
  return;
}

    // On success, set cookie for 7 days to remember user
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `signedInUser=${encodeURIComponent(data.username)}; expires=${expires}; path=/`;

    // Redirect or update UI after sign-in
    alert(`Welcome back, ${data.username}!`);
    // window.location.href = '/dashboard'; // Uncomment to redirect
  } catch (err) {
    console.error('Sign-in error:', err);
    usernameError.textContent = 'Server error. Please try again later.';
  }
});
