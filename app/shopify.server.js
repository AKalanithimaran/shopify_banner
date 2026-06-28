import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

function resolveAppUrl() {
  const configuredUrl =
    process.env.SHOPIFY_APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.HOST ||
    "";

  if (!configuredUrl) {
    return "";
  }

  const appUrl = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(appUrl)) {
    const renderUrl = process.env.RENDER_EXTERNAL_URL;

    if (renderUrl) {
      return renderUrl.startsWith("http") ? renderUrl : `https://${renderUrl}`;
    }

    throw new Error(
      "Production app URL cannot be localhost. Set SHOPIFY_APP_URL and HOST to your Render service URL.",
    );
  }

  return appUrl;
}

function resolveCustomShopDomain() {
  if (!process.env.SHOP_CUSTOM_DOMAIN) {
    return undefined;
  }

  return process.env.SHOP_CUSTOM_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

if (!process.env.SHOPIFY_API_KEY) {
  console.warn("SHOPIFY_API_KEY is missing. Copy the Client ID from your app's Dev Dashboard settings.");
}

if (!process.env.SHOPIFY_API_SECRET) {
  console.warn(
    "SHOPIFY_API_SECRET is missing. Copy the Client Secret from your app's Dev Dashboard settings.",
  );
}

const appUrl = resolveAppUrl();
const customShopDomain = resolveCustomShopDomain();

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: (process.env.SCOPES || "read_content,write_content")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(customShopDomain ? { customShopDomains: [customShopDomain] } : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
