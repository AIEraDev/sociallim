"use client";

import { useEffect } from "react";

export default function FacebookSDK() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if Facebook App ID is configured
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId || appId === "YOUR_FACEBOOK_APP_ID") {
      console.warn("Facebook App ID not configured. Facebook login will not work.");
      return;
    }

    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      if (window.FB) {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });
        window.FB.AppEvents.logPageView();
        console.log("Facebook SDK initialized successfully");
      }
    };

    // Load Facebook SDK script
    const loadFacebookSDK = () => {
      const fjs = document.getElementsByTagName("script")[0];
      if (document.getElementById("facebook-jssdk")) return;

      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.onerror = () => {
        console.error("Failed to load Facebook SDK");
      };
      js.onload = () => {
        console.log("Facebook SDK script loaded");
      };
      fjs.parentNode?.insertBefore(js, fjs);
    };

    loadFacebookSDK();
  }, []);

  return null;
}
