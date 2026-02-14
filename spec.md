## meetingmAIte

This is a desktop app that will run Google Meet calls in a webview within it.
While the meeting is running, there will be an AI agent will listen and
transcribe the audio + who is talking.

While doing this, the AI agent will analyse the meeting transcript and perform various actions.

### Pages

#### Landing page
First, a text box that allows for the entry of a Google Meet link. 

Underneath this, there is the option to add context to the meeting, either by writing text or uploading files, to help the agent better understand the meeting. 

Finally, a "Join Call" button that navigates to the **call page**.

#### Call page

There will be four subwindows within this.

- Left side, full height: **Call window**, the webview of the Google Meet meeting, with full controls
- Right side, top 1/4: **Transcript window**, Continuous scrolling transcript of the meeting dialogue, updated in realtime
- Right side, middle half: **Action window** Suggested actions by the agent - suggested questions, ability to add a reminder/calendar event, or context that the model thinks is relevant.
- Right side, bottom 1/4: **Interaction window**, option to interact with a subagent, with text entry box and message area for agent responses.

Key feature: "Whisper" mode. Hotkey "p" will auto-mute you and allow you to dictate to the agent - ask questions, set reminders, etc. Your speech will populate the **interaction window** in the screen and the prompt will be submitted when "p" is released.

Note: when the action window contains a tool call (e.g. set reminder), there should be approve/deny buttons

On call end, the app should navigate to the **end of call** page.

#### End of call page

A summary of the call and proposed/performed actions. An interaction window to ask follow up questions to the agent.

A "Finish" button that navigates to the **Landing page**.


