export interface Bindings {
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_API_TOKEN: string;
  ABUSE_HASH_SALT: string;
}

export type AppEnv = {
  Bindings: Bindings;
};
