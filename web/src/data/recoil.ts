import { atom, AtomEffect, DefaultValue, selector } from "recoil";
import { v4 as uuidv4 } from "uuid";

import { ConnectionConfig } from "@/data/client";

type LocalStorageEffectConfig<T> = {
  encode: (v: T) => string;
  decode: (v: string) => T;
};

const localStorageEffect =
  <T>(
    { encode, decode }: LocalStorageEffectConfig<T> = {
      encode: JSON.stringify,
      decode: JSON.parse,
    }
  ): AtomEffect<T> =>
  ({ setSelf, onSet, node }) => {
    const key = `recoil.localstorage.${node.key}`;
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      setSelf(decode(savedValue));
    }

    onSet((newValue, _, isReset) => {
      isReset
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, encode(newValue));
    });
  };

const searchParamEffect =
  (searchParam: string): AtomEffect<string | null> =>
  ({ setSelf }) => {
    const { location } = window;
    if (location) {
      const search = new URLSearchParams(location.search);
      setSelf(search.get(searchParam) || new DefaultValue());
    }
  };

export const showWelcomeMessage = atom({
  key: "showWelcomeMessage",
  default: true,
  effects: [localStorageEffect()],
});

export const userSessionID = atom({
  key: "userID",
  default: uuidv4(),
  effects: [localStorageEffect()],
});

export const connectionHost = atom({
  key: "connectionHost",
  default: "http://127.0.0.1",
  effects: [localStorageEffect()],
});

export const connectionUser = atom({
  key: "connectionUser",
  default: "admin",
  effects: [localStorageEffect()],
});

export const connectionPassword = atom({
  key: "connectionPassword",
  default: "",
  effects: [localStorageEffect()],
});

export const connectionDatabase = atom({
  key: "connectionDatabase",
  default: "telco",
  effects: [localStorageEffect()],
});

export const portalDatabase = atom({
  key: "portalDatabase",
  default: "telco",
  effects: [searchParamEffect("database")],
});

export const portalHostname = atom({
  key: "portalHostname",
  default: null,
  effects: [searchParamEffect("hostname")],
});

export const portalCredentials = atom({
  key: "portalCredentials",
  default: null,
  effects: [searchParamEffect("credentials")],
});

export const portalConnectionConfig = selector<ConnectionConfig | undefined>({
  key: "portalConnectionConfig",
  get: async ({ get }) => {
    const portalHostnameValue = get(portalHostname);
    const portalCredentialsValue = get(portalCredentials);
    const portalDatabaseValue = get(portalDatabase);

    if (portalCredentialsValue) {
      let decodedCredentials;
      try {
        decodedCredentials = window.atob(portalCredentialsValue);
      } catch (e) {
        console.log(
          "Failed to decode Portal credentials, falling back to local config."
        );
      }
      if (portalHostnameValue && decodedCredentials && portalDatabaseValue) {
        const { username, password } = JSON.parse(decodedCredentials);
        if (username && password) {
          return {
            host: `https://${portalHostnameValue}`,
            user: username,
            password,
            database: portalDatabaseValue,
          };
        }
      }
    }
  },
});

export const connectionConfig = selector<ConnectionConfig>({
  key: "connectionConfig",
  get: ({ get }) => {
    const portalConfig = get(portalConnectionConfig);
    if (portalConfig) {
      return portalConfig;
    }

    const host = get(connectionHost);
    const user = get(connectionUser);
    const password = get(connectionPassword);
    const database = get(connectionDatabase);
    return { host, user, password, database };
  },
  cachePolicy_UNSTABLE: {
    eviction: "most-recent",
  },
});

export const simulatorEnabled = atom<boolean>({
  key: "simulatorEnabled",
  default: true,
  effects: [localStorageEffect()],
});

export const databaseDrawerIsOpen = atom({
  key: "databaseDrawerIsOpen",
  default: false,
});

export const resettingSchema = atom({
  key: "resettingSchema",
  default: false,
});

export const analystApiKey = atom({
  key: "analystApiKey",
  default: "",
  effects: [localStorageEffect()],
});

export const analystEndpointUrl = atom({
  key: "analystEndpointUrl",
  default: "",
  effects: [localStorageEffect()],
});

export const analystChatOpen = atom({
  key: "analystChatOpen",
  default: false,
  effects: [localStorageEffect()],
});

export const analystChatMessages = atom<Array<{
  role: "user" | "assistant";
  content: string;
  result?: any;
  processingSteps?: Array<{ type: "status" | "query" | "reasoning"; content: string }>;
  isStreaming?: boolean;
  streamingSteps?: Array<{ type: "status" | "query" | "reasoning"; content: string; timestamp: number }>;
}>>({
  key: "analystChatMessages",
  default: [],
  effects: [localStorageEffect()],
});

export const analystSessionId = atom({
  key: "analystSessionId",
  default: crypto.randomUUID(),
  effects: [localStorageEffect()],
});

export const analystChatSize = atom({
  key: "analystChatSize",
  default: { width: 450, height: 600 },
  effects: [localStorageEffect()],
});

export const analystPendingQuestion = atom<string | null>({
  key: "analystPendingQuestion",
  default: null,
});

export const tickDurationMs = atom<number | undefined>({
  key: "tickDurationMs",
  default: undefined,
});

export const timeWindow = atom<string>({
  key: "timeWindow",
  default: "2h",
  effects: [localStorageEffect()],
});
