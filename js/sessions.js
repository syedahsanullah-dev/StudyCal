/* =========================================
   WEEKLY MEETINGS DATA & LOGIC
   ========================================= */

// 1. Your Data Hub - Edit teachers, times, and links here!
const weeklyMeetings = [
    {
        teacher: "Prof. Alan Turing (Theory)",
        day: "Monday & Wed - 10:00 AM",
        link: "https://zoom.us/j/your-link-here",
        borderColor: "#4CAF50" // Green
    },
    {
        teacher: "Dr. Ada Lovelace (Practical)",
        day: "Tuesday - 2:00 PM",
        link: "https://meet.google.com/your-link-here",
        borderColor: "#2196F3" // Blue
    },
    {
        teacher: "Sir Tim Berners-Lee (Web)",
        day: "Friday - 11:30 AM",
        link: "https://teams.microsoft.com/your-link-here",
        borderColor: "#FF9800" // Orange
    }
];

// 2. The function that builds the HTML cards
function renderMeetings() {
    const container = document.getElementById('meetings-container');
    
    // Safety check: if the container isn't on the page, don't run the code
    if (!container) return; 

    let htmlContent = '';
    
    weeklyMeetings.forEach(meeting => {
        htmlContent += `
            <div class="meeting-card" style="border-top: 4px solid ${meeting.borderColor}">
                <div class="meeting-details">
                    <h3>${meeting.teacher}</h3>
                    <p class="meeting-time">🕒 ${meeting.day}</p>
                </div>
                <a href="${meeting.link}" target="_blank" rel="noopener noreferrer" class="join-btn">
                    Join Meeting
                </a>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
}

// 3. Make sure it runs when the page loads!
// (If you already have a DOMContentLoaded event in your file, 
// just add renderMeetings(); inside it instead of making a new one)
document.addEventListener('DOMContentLoaded', () => {
    renderMeetings();
});