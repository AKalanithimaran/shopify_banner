import { useCallback, useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  DataTable,
  InlineStack,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return {
    history: [],
  };
};

export default function AnnouncementDashboard() {
  const app = useAppBridge();
  const { history: initialHistory } = useLoaderData();
  const [text, setText] = useState("");
  const [history, setHistory] = useState(initialHistory ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchWithAuth = useCallback(
    async (input, init = {}) => {
      const token = await app.idToken();
      const headers = new Headers(init.headers || {});
      headers.set("Authorization", `Bearer ${token}`);
      headers.set("X-Requested-With", "XMLHttpRequest");

      return fetch(input, {
        ...init,
        headers,
      });
    },
    [app],
  );

  const rows = history.map((item) => [
    item.text,
    new Date(item.createdAt).toLocaleString(),
  ]);

  const refreshHistory = useCallback(async () => {
    const response = await fetchWithAuth("/api/announcement/history");
    const data = await response.json();

    if (response.ok) {
      setHistory(data.announcements);
    }
  }, [fetchWithAuth]);

  const handleSave = async () => {
    setIsSaving(true);
    setNotice(null);

    try {
      const response = await fetchWithAuth("/api/announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Announcement save failed.");
      }

      setText("");
      setNotice({
        tone: "success",
        title: "Announcement saved and synced to the storefront.",
      });
      await refreshHistory();
    } catch (error) {
      setNotice({
        tone: "critical",
        title: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        await refreshHistory();
      } catch {
        setHistory([]);
      }
    };

    loadHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (notice?.tone === "success") {
      const timeout = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [notice]);

  return (
    <Page title="Announcement Banner">
      <BlockStack gap="400">
        {notice ? (
          <Banner tone={notice.tone} title={notice.title} onDismiss={() => setNotice(null)} />
        ) : null}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Storefront message
            </Text>
            <TextField
              label="Announcement Text"
              value={text}
              onChange={setText}
              autoComplete="off"
              maxLength={255}
              showCharacterCount
            />
            <InlineStack align="end">
              <Button variant="primary" loading={isSaving} onClick={handleSave}>
                Save
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Saved history
            </Text>
            <DataTable
              columnContentTypes={["text", "text"]}
              headings={["Text", "Timestamp"]}
              rows={rows}
              footerContent={
                rows.length
                  ? "Showing the latest 20 saved announcements."
                  : "No announcements saved yet."
              }
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
