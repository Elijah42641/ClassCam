console.log("profile frontend js is running");

let username;

async function checkUserSignedIn() {
 try {
    const response = await axios.post('/api/usersignedin', {
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
       withCredentials:true
    }
  );
  console.log("page run without error");
  if (response.status===401) {
        window.location.href="../signinpage/signin.html";
  };

    username = response.data.username;

  } 

  catch (err) {
if(err.response.status===401) {
    console.log("redirect");
    window.location.href="../signinpage/signin.html";
}
else {
   console.error(err);
}
  }
}

    const profilePic = document.getElementById("pfpInsert");

async function changePfp() {
  try {
      const formData = new FormData();

  formData.append("username", username);
  formData.append("profilePic", profilePic.files[0]);

  console.log(formData);

    const response = await axios.post('http://localhost:3000/api/pfp-to-db', formData, {
      headers: {
      },
       withCredentials:true
  });

    console.log("updated profile successfully");
  } 
  
  catch (error) {
    console.error("upload failed:", error);
  }
}

window.onload = () => {
    console.log("page loaded");
    checkUserSignedIn();
}

document.getElementById("pfpInsert").addEventListener("input", () => {
    console.log("pfp submitted");
    changePfp();
});