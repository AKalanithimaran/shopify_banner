import { authenticate } from "../shopify.server";
import {
  normalizeAnnouncementText,
  saveAnnouncementHistory,
  setAnnouncementMetafield,
} from "../services/announcement.server";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const body = await request.json();

  let text;
  try {
    text = normalizeAnnouncementText(body.text);
  } catch (error) {
    return Response.json(
      { success: false, step: "validation", error: error.message },
      { status: 400 },
    );
  }

  let savedAnnouncement;
  try {
    savedAnnouncement = await saveAnnouncementHistory({
      shop: session.shop,
      text,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        step: "mongodb",
        error: `MongoDB save failed: ${error.message}`,
      },
      { status: 500 },
    );
  }

  let metafieldResponse;
  try {
    metafieldResponse = await setAnnouncementMetafield({ admin, text });
  } catch (error) {
    return Response.json(
      {
        success: false,
        step: "shopify_metafield",
        savedAnnouncement,
        error: `Shopify metafield sync failed after MongoDB save: ${error.message}`,
      },
      { status: 502 },
    );
  }

  return Response.json({
    success: true,
    savedAnnouncement,
    metafieldResponse,
  });
};
