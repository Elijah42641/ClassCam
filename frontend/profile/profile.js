async function changePfp() {
  try {
    const response = await axios.post('http://localhost:3000/api/pfp-to-db', {
      username,
      profilePic
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
       withCredentials:true
    }
  );
    console.log("created account successfully");
  } 
  
  catch (error) {
    console.error(error);
  }
}