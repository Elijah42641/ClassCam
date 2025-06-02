import { Pool } from 'pg';

const app = express();
const pool = new Pool({
  user: 'postgres',     
  host: 'localhost',    
  database: 'postgres',   
  password: 'Ninja1107', 
  port: 5432,           
});

async function getCreateAndSetMeetingData(meeting) {
    try {
        const [timeRes, categoryRes, titleRes, descriptionRes, pplSignedUpSoFarRes, timeEstimationRes] = await Promise.all([
            client.query(`SELECT time from meetings WHERE meeting=${meeting}`),
            client.query(`SELECT category from meetings WHERE meeting=${meeting}`),
            client.query(`SELECT title from meetings WHERE meeting=${meeting}`),
            client.query(`SELECT description from meetings WHERE meeting=${meeting}`),
            client.query(`SELECT pplSignedUpSoFar from meetings WHERE meeting=${meeting}`),
            client.query(`SELECT timeEstimation from meetings WHERE meeting=${meeting}`)
        ]);

        const time = timeRes.rows[0].time;
        const category = categoryRes.rows[0].category;
        const title = titleRes.rows[0].title;
        const description = descriptionRes.rows[0].description;
        const pplSignedUpSoFar = pplSignedUpSoFarRes.rows[0].pplSignedUpSoFar;
        const timeEstimation = timeEstimationRes.rows[0].timeEstimation;

        const meetingsGrid = document.querySelector(".meetings-grid");
        const meetingCard = document.createElement('div');
        meetingCard.classList.add("meeting-card");

        const cardHeader = document.createElement('div');
        cardHeader.classList.add("card-header");
        meetingCard.appendChild(cardHeader);

        const meetingTime = document.createElement('span');
        meetingTime.classList.add("meeting-time");
        meetingTime.textContent = time;
        cardHeader.appendChild(meetingTime);

        const meetingCategory = document.createElement('span');
        meetingCategory.classList.add("meeting-category");
        meetingCategory.textContent = category;
        if (category === "work") meetingCategory.classList.add("work-category");
        else if (category === "business") meetingCategory.classList.add("business-category");
        else if (category === "personal") meetingCategory.classList.add("personal-category");
        else if (category === "social") meetingCategory.classList.add("social-category");
        cardHeader.appendChild(meetingCategory);

        const cardContent = document.createElement('div');
        cardContent.classList.add("card-content");
        meetingCard.appendChild(cardContent);

        const meetingTitle = document.createElement('h3');
        meetingTitle.classList.add("meeting-title");
        meetingTitle.textContent = title;
        cardContent.appendChild(meetingTitle);

        const meetingDescription = document.createElement('p');
        meetingDescription.classList.add("meeting-description");
        meetingDescription.textContent = description;
        cardContent.appendChild(meetingDescription);

        const meetingMeta = document.createElement('div');
        meetingMeta.classList.add("meeting-meta");
        cardContent.appendChild(meetingMeta);

        const usersSignedUpSoFar = document.createElement('span');
        usersSignedUpSoFar.classList.add("participants");
        usersSignedUpSoFar.innerHTML = `<i class="fas fa-users"></i>${pplSignedUpSoFar}`;
        meetingMeta.appendChild(usersSignedUpSoFar);

        const length = document.createElement('span');
        length.classList.add("duration");
        length.innerHTML = `<i class="fas fa-clock"></i>${timeEstimation}`;
        meetingMeta.appendChild(length);

        const joinButtonCTAContainer = document.createElement('div');
        joinButtonCTAContainer.classList.add("card-footer");
        meetingCard.appendChild(joinButtonCTAContainer);

        const joinButtonCTA = document.createElement('button');
        joinButtonCTA.classList.add("join-btn");
        joinButtonCTA.innerHTML = `Join Now <i class="fas fa-arrow-right"></i>`;
        joinButtonCTAContainer.appendChild(joinButtonCTA);

        meetingsGrid.appendChild(meetingCard);
    }
    catch (err) {
        console.error("Error creating meeting:", err);
    }
}