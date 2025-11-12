// Facebook SDK TypeScript declarations
declare global {
  interface Window {
    FB: typeof FB;
    fbAsyncInit: () => void;
  }
}

declare const FB: {
  init(params: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }): void;

  login(
    callback: (response: {
      status: "connected" | "not_authorized" | "unknown";
      authResponse?: {
        accessToken: string;
        userID: string;
        expiresIn: number;
        signedRequest: string;
      };
    }) => void,
    options?: {
      scope?: string;
      return_scopes?: boolean;
      enable_profile_selector?: boolean;
      profile_selector_ids?: string;
    }
  ): void;

  logout(callback?: (response: any) => void): void;

  getLoginStatus(
    callback: (response: {
      status: "connected" | "not_authorized" | "unknown";
      authResponse?: {
        accessToken: string;
        userID: string;
        expiresIn: number;
        signedRequest: string;
      };
    }) => void,
    force?: boolean
  ): void;

  api(path: string, method?: "GET" | "POST" | "DELETE", params?: any, callback?: (response: any) => void): void;

  AppEvents: {
    logPageView(): void;
  };
};

export {};
