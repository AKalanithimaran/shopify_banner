# Announcement Banner - Shopify App

Announcement Banner is an embedded Shopify app that lets a merchant type announcement text in the Shopify Admin, save every update to MongoDB for audit history, and sync the latest text to a Shopify Shop Metafield.

The storefront banner is rendered through a Theme App Extension App Embed Block, so the message appears live across the storefront without ScriptTags.

## Architecture / Data Flow Diagram

```text
Admin Dashboard (React/Polaris)
   -> POST /api/announcement (React Router / Remix-style backend)
   -> MongoDB (saves audit record: shop, text, createdAt)
   -> Shopify Admin GraphQL API
      -> metafieldsSet mutation
      -> namespace: my_app
      -> key: announcement
   -> Theme App Extension
      -> Liquid reads shop.metafields.my_app.announcement
   -> Displayed live as floating banner on storefront
```

## Tech Stack

- MongoDB with Mongoose
- React Router / Remix-style Shopify app backend
- React
- Node.js
- MERN-style architecture
- Shopify Polaris
- Shopify App Bridge
- Shopify Admin GraphQL API
- Shopify Theme App Extensions
- Prisma session storage for Shopify app sessions

ScriptTags were NOT used - this app uses Shop Metafields exclusively for frontend/backend data sync, per Shopify's current best practices. ScriptTags are deprecated.

## Features

- Admin dashboard to set announcement text.
- Audit history of all past announcements, timestamped and stored in MongoDB.
- Syncs the latest announcement to a Shopify Shop Metafield.
- Floating announcement banner on the storefront via an App Embed Block.
- Banner works across storefront pages once the app embed is enabled.
- Banner auto-adjusts page layout so it does not overlap the theme header, including sticky headers.
- Multi-tenant backend behavior: MongoDB history records are scoped by Shopify shop.

## Prerequisites

- Node.js `>=20.19 <22 || >=22.12`
- Shopify Partner account
- Shopify CLI installed:

  ```bash
  npm install -g @shopify/cli
  ```

- MongoDB database, either MongoDB Atlas or self-hosted
- MongoDB connection URI
- Shopify development store

## Local Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd announcement-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SCOPES=read_content,write_content
   HOST=your_tunnel_or_deployed_url
   SHOPIFY_APP_URL=your_tunnel_or_deployed_url
   MONGO_URI=your_mongodb_connection_string
   MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
   ```

   Note: this repository uses `read_content,write_content` because Shopify CLI rejects `read_metafields,write_metafields` as invalid scopes for this app configuration.

4. Start the app and Shopify tunnel:

   ```bash
   shopify app dev --store your-development-store.myshopify.com
   ```

   If the default theme extension port is already in use, run:

   ```bash
   shopify app dev --store your-development-store.myshopify.com --theme-app-extension-port 9294
   ```

5. Follow the Shopify CLI prompts to select your Partner organization and development store, then install the app.

## Enabling the Storefront Banner

1. In Shopify Admin, go to **Online Store > Themes > Customize**.
2. Click **App embeds** in the left sidebar.
3. Find **Announcement Banner** and toggle it ON.
4. Save the theme.
5. The banner will now display the text saved from the app's admin dashboard on every storefront page.

## Using the App

1. Open the app from **Shopify Admin > Apps > Announcement Banner**.
2. Type your announcement text in the input field.
3. Click **Save**.
4. The text is saved to MongoDB with a timestamp and synced to the Shopify Shop Metafield:
   - Namespace: `my_app`
   - Key: `announcement`
5. View the updated banner live on your storefront within a few seconds.
6. Past announcements are listed below the input field as an audit trail.

## Deployment

This app can be deployed on Render as a Web Service.

1. Connect the GitHub repository to a new Render Web Service.

2. Set the build command:

   ```bash
   npm run build
   ```

3. Set the start command:

   ```bash
   npm run start
   ```

4. Add these environment variables in Render's dashboard:

   ```env
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SCOPES=read_content,write_content
   HOST=https://shopify-banner-x0pk.onrender.com
   SHOPIFY_APP_URL=https://shopify-banner-x0pk.onrender.com
   MONGO_URI=your_mongodb_connection_string
   MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1
   ```

5. Once deployed, update `shopify.app.toml`:
   - `application_url`
   - `auth.redirect_urls`
   - app proxy URL, if used

6. Update the same URLs in the Shopify Partner Dashboard under the app's URL configuration.

7. Deploy the Theme App Extension separately from the CLI:

   ```bash
   shopify app deploy
   ```

   Theme App Extension deployment is independent of backend hosting on Render.

## Live Demo

- Deployed App URL: https://shopify-banner-x0pk.onrender.com
- Demo Video: [INSERT LOOM/YOUTUBE LINK HERE]

## Folder Structure

```text
announcement-app/
|-- app/
|   |-- models/
|   |   `-- Announcement.js
|   |-- routes/
|   |   |-- _index/
|   |   |   |-- route.jsx
|   |   |   `-- styles.module.css
|   |   |-- auth.$.jsx
|   |   |-- auth.login/
|   |   |   |-- error.server.jsx
|   |   |   `-- route.jsx
|   |   |-- app.jsx
|   |   |-- app._index.jsx
|   |   |-- api.announcement.jsx
|   |   |-- api.announcement.history.jsx
|   |   |-- webhooks.app.scopes_update.jsx
|   |   `-- webhooks.app.uninstalled.jsx
|   |-- services/
|   |   `-- announcement.server.js
|   |-- db.server.js
|   |-- entry.server.jsx
|   |-- mongo.server.js
|   |-- root.jsx
|   |-- routes.js
|   `-- shopify.server.js
|-- extensions/
|   `-- announcement-banner/
|       |-- blocks/
|       |   `-- announcement-banner.liquid
|       |-- locales/
|       |   `-- en.default.json
|       `-- shopify.extension.toml
|-- prisma/
|   |-- migrations/
|   |   `-- 20240530213853_create_session_table/
|   |       `-- migration.sql
|   `-- schema.prisma
|-- public/
|   `-- favicon.ico
|-- Dockerfile
|-- package.json
|-- package-lock.json
|-- README.md
|-- shopify.app.toml
|-- shopify.web.toml
|-- tsconfig.json
`-- vite.config.js
```

## Notes / Known Limitations

- Render free tier services may spin down after inactivity, causing a brief delay on the first request after idle periods.
- Multi-tenancy is supported: MongoDB announcement records are filtered by the current `shop`.
- The storefront banner depends on the Theme App Extension app embed being enabled in the active theme.
- The latest announcement is stored in a Shop Metafield at `my_app.announcement`; historical announcements remain in MongoDB.
- Local development may need `--theme-app-extension-port 9294` if port `9293` is already in use.
