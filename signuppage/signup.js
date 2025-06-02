const usernameBox = document.getElementsByClassName("username")[0];
const passwordBox = document.getElementsByClassName("password")[0];
const emailBox = document.getElementsByClassName("email")[0];
const signUpButton = document.getElementsByClassName("getstarted")[0];
const invalidUsername = document.getElementsByClassName("invalidUsername")[0];
const invalidEmail = document.getElementsByClassName("invalidEmail")[0];
const invalidPassword = document.getElementsByClassName("invalidPassword")[0];

const profanityList = [
  "ass","asshole","bastard","bitch","bloody","bollocks","brothel",
  "bugger", "cock", "crap", "cunt", "damn", "dick", "dildo", "dyke","fag", "faggot", "fuck", "fucker", "fucking", "goddamn", "hell", "homo", "jerk", "kike", "motherfucker", "nigga", "nigger", "piss", "prick", "pussy", "retard", "shit", "shitty", "slut", "spic","tard","twat","whore", "wank","wanker"
];

function usernameTooLong() {
  invalidUsername.textContent = "Username can't be over 22 characters";
}
function usernameTooShort() {
  invalidUsername.textContent = "Username can't be under 3 characters";
}
function usernameContainsProfanity() {
  invalidUsername.textContent = "Username can't contain profanity";
}
function goodPassCheck() {
  if (passwordBox.value.length < 8) {
    invalidPassword.textContent = "Password must be at least 8 characters";
    return false;
  } else if (passwordBox.value.length > 25) {
    invalidPassword.textContent = "Password can't be over 25 characters";
    return false;
  } else {
    invalidPassword.textContent = "";
    return true;
  }
}
function isValidEmail() {
  const strictRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValid = strictRegex.test(emailBox.value);

  if (!isValid) {
    invalidEmail.textContent = "Please enter a valid email address";
  } else {
    invalidEmail.textContent = "";
  }
  return isValid;
}
function checkAllValidations() {
  invalidUsername.textContent = "";
  invalidEmail.textContent = "";
  invalidPassword.textContent = "";

  let isUsernameValid = true;
  let isEmailValid = true;
  let isPasswordValid = true;

  const username = usernameBox.value.trim();
  if (username.length > 22) {
    usernameTooLong();
    isUsernameValid = false;
  } else if (username.length < 3) {
    usernameTooShort();
    isUsernameValid = false;
  } else {
    for (const profanity of profanityList) {
      if (username.toLowerCase().includes(profanity)) {
        usernameContainsProfanity();
        isUsernameValid = false;
        break;
      }
    }
  }

  isEmailValid = isValidEmail();
  isPasswordValid = goodPassCheck();

  return isUsernameValid && isEmailValid && isPasswordValid;
}

const backendUrl = "http://localhost:3000";

signUpButton.addEventListener("click", async function (e) {
  e.preventDefault();

  invalidUsername.textContent = "";
  invalidEmail.textContent = "";
  invalidPassword.textContent = "";

  if (!checkAllValidations()) return;

  const username = usernameBox.value.trim();
  const email = emailBox.value.trim();
  const password = passwordBox.value.trim();

  try {
    console.log('Checking credentials for:', username, email);
    const checkRes = await fetch(
      `${backendUrl}/api/checkcredentials?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`
    );
    if (!checkRes.ok) {
      throw new Error(`Check credentials failed with status ${checkRes.status}`);
    }

    const checkData = await checkRes.json();
    console.log('Check credentials response:', checkData);

    if (checkData.isUsernameInUse) {
      invalidUsername.textContent = "This username is already taken.";
      return;
    }

    if (checkData.isEmailInUse) {
      invalidEmail.textContent = "An account with this email already exists.";
      return;
    }

    // Create account
    console.log('Creating account...');
    const createRes = await fetch(`${backendUrl}/api/createaccount`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!createRes.ok) {
      throw new Error(`Create account failed with status ${createRes.status}`);
    }

    const createData = await createRes.json();
    console.log('Create account response:', createData);

 if (createData.created) {
  // Set cookie to remember username for 7 days
  document.cookie = `username=${encodeURIComponent(username)}; path=/; max-age=604800`; // 7 days

  alert("Account created successfully!");
  usernameBox.value = "";
  passwordBox.value = "";
  emailBox.value = "";
  window.location.href = "../dashboard/dashboard.html";
}

  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong while creating your account.");
  }
});