import fp from "fastify-plugin";
import { db, type DbType } from "../db/connection";

export default fp(async (fastify) => {
  fastify.decorate("db", db);
});

declare module "fastify" {
  interface FastifyInstance {
    db: DbType;
  }
}
