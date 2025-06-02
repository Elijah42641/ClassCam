function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function loadUserStats() {
  const username = getCookie('username');

  if (!username) {
    console.error('Username cookie not found');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/userstats?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }

    const data = await response.json();

    document.querySelector('.upcomingMeetingsStat').textContent = data.upcoming;
    document.querySelector('.attendedMeetingsStat').textContent = data.attended;
    document.querySelector('.activeSubscriptionsStat').textContent = data.subscriptions;
    document.querySelector('.meetingsCreatedStat').textContent = data.created;

  } catch (err) {
    console.error('Error loading user stats:', err);
  }
}

window.addEventListener("load", function() {
loadUserStats();
console.log('123');
});