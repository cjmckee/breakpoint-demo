/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `staging` for the build served from /staging/; unset for the live game. */
  readonly VITE_CHANNEL?: string;
}
