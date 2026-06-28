import dns from "node:dns";
import mongoose from "mongoose";

let connectionPromise;
let lastMongoError;
let dnsConfigured = false;

function parseDnsServers(value) {
  return value
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
}

function configureMongoDns() {
  if (dnsConfigured) {
    return;
  }

  dnsConfigured = true;

  const configuredServers = parseDnsServers(process.env.MONGO_DNS_SERVERS || "");
  const localDefaultServers =
    process.env.NODE_ENV === "production" ? [] : ["8.8.8.8", "1.1.1.1"];
  const servers = configuredServers.length ? configuredServers : localDefaultServers;

  if (servers.length) {
    dns.setServers(servers);
  }
}

function buildFriendlyMongoError(error) {
  if (error?.code === "ECONNREFUSED") {
    return new Error(
      "MongoDB SRV lookup failed. The Atlas URI looks valid, but Node could not resolve its SRV records from this machine. Set MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1 in .env or check your DNS/network settings.",
    );
  }

  return error instanceof Error
    ? error
    : new Error("MongoDB connection failed.");
}

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to your .env file.");
  }

  if (!connectionPromise) {
    configureMongoDns();

    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        dbName: "announcement-banner",
      })
      .then((mongooseInstance) => {
        lastMongoError = undefined;
        console.log("MongoDB connected: announcement-banner");
        return mongooseInstance.connection;
      })
      .catch((error) => {
        lastMongoError = buildFriendlyMongoError(error);
        connectionPromise = undefined;
        console.error("MongoDB connection failed:", error);
        throw lastMongoError;
      });
  }

  return connectionPromise;
}

export function getMongoError() {
  return lastMongoError;
}
