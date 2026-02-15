import React, { useEffect, useRef, useState } from 'react';
import { WherebyClient, RemoteParticipantState } from '@whereby.com/core';
import './CallWindow.css';

interface CallWindowProps {
  meetLink: string; // This will actually be the Whereby room URL
  onAudioStreamReady?: (stream: MediaStream) => void; // Callback to pass the audio stream
}

const CallWindow: React.FC<CallWindowProps> = ({ meetLink, onAudioStreamReady }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null); // For a single remote participant for simplicity
  const localMediaClientRef = useRef<ReturnType<WherebyClient['getLocalMedia']> | null>(null); // To store localMediaClient
  const userMediaStreamRef = useRef<MediaStream | null>(null); // To store localStream from getUserMedia
  const [isMuted, setIsMuted] = useState(false); // State for mute status
  const [isCameraOff, setIsCameraOff] = useState(false); // State for camera status

  useEffect(() => {
    console.log('useEffect: CallWindow mounting or meetLink/onAudioStreamReady changed');

    if (!meetLink) {
      console.log('useEffect: No meetLink provided, returning.');
      return;
    }

    let client: WherebyClient | null = null;
    let roomConnectionClient: ReturnType<WherebyClient['getRoomConnection']> | null = null;
    let localMediaClient: ReturnType<WherebyClient['getLocalMedia']> | null = null;

    const setupWhereby = async () => {
      console.log('setupWhereby: Starting setup...');
      try {
        // 1. Get local media stream directly using Web API
        console.log('setupWhereby: Requesting local media...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        userMediaStreamRef.current = stream; // Store the stream in ref
        console.log('setupWhereby: Local media obtained.');

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMediaStreamRef.current;
        }

        const audioTrack = userMediaStreamRef.current.getAudioTracks()[0];
        if (audioTrack && onAudioStreamReady) {
          const audioStream = new MediaStream([audioTrack]);
          onAudioStreamReady(audioStream);
          console.log('setupWhereby: Audio stream passed to onAudioStreamReady.');
        }

        // 2. Initialize WherebyClient
        console.log('setupWhereby: Initializing WherebyClient...');
        client = new WherebyClient();
        roomConnectionClient = client.getRoomConnection();
        localMediaClient = client.getLocalMedia();
        localMediaClientRef.current = localMediaClient; // Store localMediaClient in ref
        console.log('setupWhereby: WherebyClient initialized.');

        // 3. Initialize RoomConnectionClient with roomUrl and local media options
        console.log('setupWhereby: Initializing RoomConnectionClient with roomUrl:', meetLink);
        roomConnectionClient.initialize({
          roomUrl: meetLink,
          localMediaOptions: {
            audio: true,
            video: true,
          },
        });
        console.log('setupWhereby: RoomConnectionClient initialized.');

        // 4. Join the room
        console.log('setupWhereby: Joining room...');
        await roomConnectionClient.joinRoom();
        console.log('setupWhereby: Joined room successfully.');

        // 5. Handle remote participants' media
        console.log('setupWhereby: Subscribing to remote participants...');
        roomConnectionClient.subscribeToRemoteParticipants((participants: RemoteParticipantState[]) => {
          console.log('subscribeToRemoteParticipants: Participants updated:', participants);
          const remoteParticipantWithVideo = participants.find(
            (p) => p.stream && p.stream.getVideoTracks().length > 0
          );

          if (remoteVideoRef.current && remoteParticipantWithVideo && remoteParticipantWithVideo.stream) {
            remoteVideoRef.current.srcObject = remoteParticipantWithVideo.stream;
            remoteVideoRef.current.play();
            console.log('subscribeToRemoteParticipants: Remote video started.');
          } else if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
            console.log('subscribeToRemoteParticipants: Remote video cleared.');
          }
        });
        console.log('setupWhereby: Setup finished successfully.');

      } catch (error) {
        console.error("setupWhereby: Error setting up Whereby:", error);
        // Handle error, maybe display an error message to the user
      }
    };

    setupWhereby();

    // Cleanup function for useEffect
    return () => {
      console.log('useEffect Cleanup: Starting cleanup...');
      if (roomConnectionClient) {
        roomConnectionClient.leaveRoom();
        console.log('useEffect Cleanup: roomConnectionClient.leaveRoom() called.');
      }
      if (localMediaClientRef.current) { // Use ref for cleanup
        localMediaClientRef.current.stopMedia();
        console.log('useEffect Cleanup: localMediaClient.stopMedia() called.');
      }
      if (userMediaStreamRef.current) { // Use ref for cleanup
        userMediaStreamRef.current.getTracks().forEach(track => track.stop());
        console.log('useEffect Cleanup: userMediaStream tracks stopped.');
      }
      if (client) {
        client.destroy();
        console.log('useEffect Cleanup: Whereby client destroyed.');
      }
      console.log('useEffect Cleanup: Finished cleanup.');
    };
  }, [meetLink, onAudioStreamReady]);

  const toggleMute = () => {
    if (localMediaClientRef.current && userMediaStreamRef.current) {
      const audioTrack = userMediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        console.log(`toggleMute: Before explicit set, audioTrack.enabled: ${audioTrack.enabled}`);
        audioTrack.enabled = isMuted; // If isMuted is true, we want to enable (unmute), if false, disable (mute)

        localMediaClientRef.current.toggleMicrophone(); // Call Whereby SDK's toggleMicrophone

        setIsMuted((prev) => {
          console.log(`toggleMute: After toggle, audioTrack.enabled: ${audioTrack.enabled}. New isMuted state: ${!prev}`);
          return !prev;
        });
      } else {
        console.warn('toggleMute: No audio track found in local stream.');
      }
    } else {
      console.warn('localMediaClient or userMediaStream not available to toggle microphone.');
    }
  };

  const toggleCamera = () => {
    if (localMediaClientRef.current && userMediaStreamRef.current) {
      const videoTrack = userMediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        console.log(`toggleCamera: Before explicit set, videoTrack.enabled: ${videoTrack.enabled}`);
        // Manually toggle the enabled state of the video track
        videoTrack.enabled = isCameraOff; // If isCameraOff is true, disable the track, else enable

        localMediaClientRef.current.toggleCamera(); // Call Whereby SDK's toggleCamera

        // Re-assign srcObject to potentially force the video element to re-evaluate the stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMediaStreamRef.current;
        }

        setIsCameraOff((prev) => {
          console.log(`toggleCamera: After toggle, videoTrack.enabled: ${videoTrack.enabled}. New isCameraOff state: ${!prev}`);
          return !prev;
        });
      } else {
        console.warn('toggleCamera: No video track found in local stream.');
      }
    } else {
      console.warn('localMediaClient or userMediaStream not available to toggle camera.');
    }
  };

  return (
    <div className="call-window-container">
      {meetLink ? (
        <div className="whereby-core-container">
          <video ref={remoteVideoRef} autoPlay playsInline className="local-video" />
          <video ref={localVideoRef} autoPlay muted playsInline className="remote-video" />
          
          <div className="call-controls">
            <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
            <button onClick={toggleCamera}>{isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}</button>
          </div>
        </div>
      ) : (
        <div className="no-meet-link">
          Please provide a Whereby room link to start the call.
        </div>
      )}
    </div>
  );
};

export default CallWindow;