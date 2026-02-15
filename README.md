### Participant

| Field | Your Answer |
|-------|-------------|
| **Name** | Finn|
| **University / Employer** | N/A |

### Project

| Field | Your Answer |
|-------|-------------|
| **Project Name** | MeetingmAIte|
| **One-Line Description** | Meeting copilot designed to keep your focus on the meeting.|
| **Demo Video Link** | https://www.loom.com/share/1d6a68613a514f70949e051817c8f27b|
| **Tech Stack** |Electron Forge, React, Whereby for video calling |
| **AI Provider(s) Used** | Groq, Deepgram |

### About Your Project

#### What does it do?

A realtime meeting assistant. MeetingmAIte transcribes your meeting and provides live analysis, suggesting questions, setting reminders/To Do items, and scheduling future meetings.

As well as that, the app offers "Whisper" functionality - hold down the 'p' hotkey to mute yourself and ask your AI agent a question via voice. Traditional text prompting is also available.

After the meeting, review the analysis and ask the agent follow up questions about the meeting.

#### How does the interaction work?

The analysis is autonomous - no action required to trigger it, just confirm or reject proposed actions.

The 'p' hotkey allows you to 'whisper' to the agent - ask a question without breaking eye contact.

#### What makes it special?

The Whisper hotkey is most special - ask questions to your agent without breaking eye contact.

The analysis functionality is unfortunately incomplete.

#### How to run it

Untested

```bash
git clone https://github.com/finnbichan/sophiie-hackathon
cd https://github.com/finnbichan/sophiie-hackathon
npm install
cp .env.example .env  # add your API keys
npm start
```

#### Architecture / Technical Notes

The original plan was to embed Google Meet in the application - however I had to pivot to Whereby in order to access the live audio, leading to a lot of time setting up custom video calls (hence the unfinished state).

