export interface Bindings {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export type AppEnv = {
  Bindings: Bindings;
};

