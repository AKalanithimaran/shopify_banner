import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: "announcements",
    versionKey: false,
  },
);

export default mongoose.models.Announcement ||
  mongoose.model("Announcement", announcementSchema);
