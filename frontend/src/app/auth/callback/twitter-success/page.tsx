"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

const TwitterCallbackPage = () => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      return; // Wait for the session to be loaded
    }

    if (window.opener) {
      if (session) {
        window.opener.postMessage({ type: "TWITTER_AUTH_SUCCESS", session }, window.location.origin);
      } else {
        window.opener.postMessage({ type: "TWITTER_AUTH_ERROR" }, window.location.origin);
      }
      window.close();
    }
  }, [session, status]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {status === "loading" && <p>Please wait, authenticating...</p>}
      {status !== "loading" && !session && <p>Authentication failed. You may close this window.</p>}
      {status !== "loading" && session && <p>Authentication successful! You may close this window.</p>}
    </div>
  );
};

export default TwitterCallbackPage;
