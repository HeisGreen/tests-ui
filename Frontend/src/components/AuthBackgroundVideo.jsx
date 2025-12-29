import React from "react";
import authVideo from "../assets/5841707-hd_1080_1920_24fps.mp4";

function AuthBackgroundVideo() {
  return (
    <video
      className="auth-background-video"
      autoPlay
      loop
      muted
      playsInline
      aria-hidden="true"
    >
      <source src={authVideo} type="video/mp4" />
    </video>
  );
}

export default AuthBackgroundVideo;
