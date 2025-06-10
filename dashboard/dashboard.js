const upcomingMeetingsStat=document.querySelector(".upcomingMeetingsStat");
const attendedMeetingsStat=document.querySelector(".attendedMeetingsStat");
const activeSubscriptionsStat=document.querySelector(".activeSubscriptionsStat");
const meetingsCreatedStat=document.querySelector(".meetingsCreatedStat");

async function happeningwithaccount() {
  try {
      const response = await axios.post(
      'http://localhost:3000/api/happeningwithaccount',{}, { 
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    console.log(response.data.username);

    console.log("api successful");
    upcomingMeetingsStat.textContent=response.data.upcoming_meetings;
    attendedMeetingsStat.textContent=response.data.attendedMeetingsStat;
    activeSubscriptionsStat.textContent=response.data.activeSubscriptionsStat;
    meetingsCreatedStat.textContent=response.data.meetings_created;

  } 
  catch (error) {    
      console.error(error);
    
    if(error.response?.status===401) {
        window.location.href="../signinpage/signin.html";
    }
    else if (error.response?.status===200){
        console.log("user is authenticated");
    }
}
 } 
 window.onload=()=>{
    console.log("page loaded");
    happeningwithaccount();
 }