import { connectMongo } from "../mongo.server";
import Announcement from "../models/Announcement";

const METAFIELD_NAMESPACE = "my_app";
const METAFIELD_KEY = "announcement";

const SHOP_ID_QUERY = `#graphql
  query ShopId {
    shop {
      id
    }
  }
`;

const METAFIELDS_SET_MUTATION = `#graphql
  mutation SetAnnouncementMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
        type
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

export function normalizeAnnouncementText(text) {
  if (typeof text !== "string") {
    throw new Error("Announcement text must be a string.");
  }

  const normalized = text.trim();
  if (!normalized) {
    throw new Error("Announcement text is required.");
  }

  return normalized;
}

export async function saveAnnouncementHistory({ shop, text }) {
  await connectMongo();
  return Announcement.create({ shop, text });
}

export async function getAnnouncementHistory(shop, limit = 20) {
  await connectMongo();
  return Announcement.find({ shop })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function setAnnouncementMetafield({ admin, text }) {
  const shopIdResponse = await admin.graphql(SHOP_ID_QUERY);
  const shopIdJson = await shopIdResponse.json();
  const ownerId = shopIdJson?.data?.shop?.id;

  if (!ownerId) {
    throw new Error("Could not resolve Shopify shop owner ID.");
  }

  const metafieldResponse = await admin.graphql(METAFIELDS_SET_MUTATION, {
    variables: {
      metafields: [
        {
          namespace: METAFIELD_NAMESPACE,
          key: METAFIELD_KEY,
          type: "single_line_text_field",
          ownerId,
          value: text,
        },
      ],
    },
  });

  const metafieldJson = await metafieldResponse.json();
  const userErrors = metafieldJson?.data?.metafieldsSet?.userErrors ?? [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => `${error.message} (${error.code})`).join("; "),
    );
  }

  return metafieldJson.data.metafieldsSet;
}
