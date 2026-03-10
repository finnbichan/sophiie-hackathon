# MeetingmAIte

MeetingmAIte is a real-time meeting assistant that transcribes your meetings and provides live analysis. It can suggest questions, set reminders or to-do items, and schedule future meetings.

MeetingmAIte was built in the 2026 Sophiie AI hackathon. The focus of the hackathon was on smooth interaction with the agent, which inspired me to focus on voice interactions and unprompted actions.

## Features

*   **Real-time Transcription:** Get a live transcript of your meeting.
*   **"Whisper" Functionality:** Press and hold the 'p' key to mute yourself and ask the AI assistant a question using your voice.
*   **Text-based Interaction:** You can also interact with the assistant using traditional text input.
*   **Live Analysis:** The AI assistant provides real-time insights and suggests reminders or actions. (incomplete)
*   **Action Items:** Create reminders and to-do items directly from the meeting. (incomplete)
*   **Integrations:** Integrate with your calendar to schedule follow-up meetings seamlessly. (incomplete)
*   **Post-Meeting Review:** After the call, you can review the analysis and ask the assistant follow-up questions. (incomplete)

## Tech Stack

*   **Electron Forge**
*   **React**
*   **TypeScript**
*   **Whereby** for video calling
*   **Groq** for AI-powered analysis
*   **Deepgram** for real-time transcription

## Getting Started

### Prerequisites

*   Node.js and npm
*   API keys for Groq, Deepgram, Whereby

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/finnbichan/sophiie-hackathon
    ```
2.  Navigate to the project directory:
    ```bash
    cd sophiie-hackathon
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```
4.  Set up your environment variables by copying the example file:
    ```bash
    cp .env.example .env
    ```
5.  Add your API keys to the `.env` file.

### Usage

To start the application, run the following command:

```bash
npm start
```
