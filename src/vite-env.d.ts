/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMPILER_URL: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_WRITER_REPOSITORY_PATH: string;
  readonly VITE_REFERENCE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
