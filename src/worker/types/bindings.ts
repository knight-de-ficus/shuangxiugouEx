export interface Bindings {
  DB: D1Database;
  FILES: KVNamespace;
  ADMIN_API_TOKEN: string;
  MODERATION_ADMIN_TOKEN: string;
  ADMIN_ROUTE_KEY: string;
  ABUSE_HASH_SALT: string;
}

export type AppEnv = {
  Bindings: Bindings;
};
