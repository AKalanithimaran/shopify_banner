import { authenticate } from "../shopify.server";
import { getAnnouncementHistory } from "../services/announcement.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const announcements = await getAnnouncementHistory(session.shop);

  return {
    announcements: announcements.map((item) => ({
      id: item._id.toString(),
      shop: item.shop,
      text: item.text,
      createdAt: item.createdAt,
    })),
  };
};
