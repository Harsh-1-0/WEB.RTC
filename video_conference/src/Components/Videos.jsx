import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

import {
  FaVideo,
  FaMicrophone,
  FaVideoSlash,
  FaMicrophoneSlash,
} from "react-icons/fa";

import { MdOutlineScreenShare, MdOutlineStopScreenShare } from "react-icons/md";

function Video() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(new MediaStream());
  const [socketId, setSocketId] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const roomId = localStorage.getItem("roomId");

  const [isRoomFull, setIsRoomFull] = useState(false);

  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(true);

  const [screenShare, setScreenShare] = useState(false);

  const [screenShareStream, setScreenShareStream] = useState(null);
  const screenShareVideoRef = useRef(null);

  const servers = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ],
  };

  useEffect(() => {
    // Initialize socket connection
    socket.current = io("https://sinallingserver.vercel.app/", {
      withCredentials: true,
    });

    // Handle socket connection events
    socket.current.on("connect", () => {
      console.log("Connected with ID:", socket.current.id);
      setSocketId(socket.current.id);

      // Join room after connection
      socket.current.emit("join", roomId);
    });

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setLocalStream(stream);

        // Initialize peer connection
        createPeerConnection();

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });

        // Create and send offer
        createAndSendOffer();
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    init();

    // Socket event listeners
    socket.current.on("offer", handleOffer);
    socket.current.on("answer", handleAnswer);
    socket.current.on("ice-candidate", handleIceCandidate);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (screenShareStream && screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = screenShareStream;
    }
  }, [screenShareStream]);

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection(servers);

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("ice-candidate", {
          candidate: event.candidate,
          to: roomId,
        });
      }
    };

    // Handle incoming tracks
    peerConnection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setRemoteStream(new MediaStream(remoteStream.getTracks()));
    };

    // Log connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.current.connectionState);
    };

    // Log ICE connection state changes
    peerConnection.current.oniceconnectionstatechange = () => {
      console.log(
        "ICE connection state:",
        peerConnection.current.iceConnectionState
      );
    };
  };

  const createAndSendOffer = async () => {
    try {
      if (!peerConnection.current) return;

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.current.emit("offer", {
        offer: offer,
        to: roomId,
      });
      console.log("Offer sent to room:", roomId);
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  };

  const handleOffer = async ({ offer, from }) => {
    try {
      console.log("Received offer from:", from);

      if (!peerConnection.current) {
        createPeerConnection();
      }

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.current.emit("answer", {
        answer: answer,
        to: from,
      });
      console.log("Answer sent to:", from);
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  };

  const handleAnswer = async ({ answer, from }) => {
    try {
      console.log("Received answer from:", from);
      await peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (err) {
      console.error("Error handling answer:", err);
    }
  };

  const handleIceCandidate = async ({ candidate, from }) => {
    try {
      console.log("Received ICE candidate from:", from);
      if (candidate && peerConnection.current) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  };

  const toggleMic = async () => {
    try {
      // Check if there's an audio track in the local stream
      if (!localStream || localStream.getAudioTracks().length === 0) {
        // Request microphone access
        console.log("Requesting microphone access...");
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Add the audio track to the existing local stream
        audioStream.getAudioTracks().forEach((track) => {
          localStream.addTrack(track);
          peerConnection.current?.addTrack(track, localStream);
        });

        // Update state to reflect microphone is on
        setMic(true);
      } else {
        // Toggle the audio track's enabled state
        localStream
          .getAudioTracks()
          .forEach((track) => (track.enabled = !track.enabled));
        setMic((prevState) => !prevState);
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const toggleVideo = () => {
    setVideo((prevState) => !prevState);
    localStream
      .getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenShare) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace current video track with screen share track
        const videoSender = peerConnection.current
          .getSenders()
          .find((sender) => sender.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        // Update screen share state and UI
        setScreenShareStream(screenStream);
        setScreenShare(true);

        // Handle stopping of screen share
        screenTrack.onended = () => {
          // Revert to local video track when screen sharing stops
          toggleScreenShare();
        };
      } else {
        // Stop screen sharing and revert to camera video track
        screenShareStream.getTracks().forEach((track) => track.stop());
        const videoTrack = localStream.getVideoTracks()[0];

        const videoSender = peerConnection.current
          .getSenders()
          .find((sender) => sender.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
        }

        // Update screen share state and UI
        setScreenShare(false);
        setScreenShareStream(null);
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
    }
  };

  return (
    <div className="text-white">
      <div className="relative h-screen w-screen">
        {/* Local Video */}
        <div
          className={`w-64 h-64 absolute z-20  ${
            screenShareStream ? "left-5 bottom-0" : "right-0 bottom-0"
          }`}
        >
          <video
            className="border-4 border-black"
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white rounded px-2 py-1">
            Local (ID: {socketId?.slice(0, 6)})
          </div>
        </div>

        {/* Main Video & Screen Share */}
        <div className="flex h-full w-full">
          <video
            className={`bg-black ${
              screenShareStream ? "w-1/4 flex items-start" : "w-full"
            } h-full`}
            ref={remoteVideoRef}
            autoPlay
            playsInline
          />

          {screenShareStream && (
            <div className="w-3/4 h-full relative">
              <video
                className="bg-black w-full h-full"
                ref={screenShareVideoRef}
                autoPlay
                playsInline
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                Screen Share
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute  z-10   flex gap-8 bottom-4 left-1/2 -translate-x-1/2 ">
        <button
          className="w-16 h-16 flex items-center justify-center border-black bg-black border-2 rounded-full"
          onClick={toggleMic}
        >
          {mic ? (
            <FaMicrophone className="text-3xl" />
          ) : (
            <FaMicrophoneSlash className="text-3xl" />
          )}
        </button>
        <button
          className="w-16 h-16 flex items-center justify-center border-black bg-black border-2 rounded-full"
          onClick={toggleVideo}
        >
          {video ? (
            <FaVideo className="text-3xl" />
          ) : (
            <FaVideoSlash className="text-3xl" />
          )}
        </button>
        <button
          className="w-16 h-16 flex items-center justify-center border-black bg-black border-2 rounded-full"
          onClick={toggleScreenShare}
        >
          {!screenShare ? (
            <MdOutlineScreenShare className="text-3xl" />
          ) : (
            <MdOutlineStopScreenShare className="text-3xl" />
          )}
        </button>
      </div>
    </div>
  );
}

export default Video;
