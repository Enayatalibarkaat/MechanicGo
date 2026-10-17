const API = "https://api.telegram.org";
function config() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!token || !channelId) throw new Error("Telegram integration is missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID.");
  // This app sends private account details only to a Telegram channel/supergroup,
  // never to a personal user's chat ID.
  if (!/^-100\d+$/.test(channelId.trim())) {
    throw new Error("TELEGRAM_CHANNEL_ID is not a private channel ID. Set it to the channel's numeric ID (usually starts with -100), not a personal user ID.");
  }
  return { token, channelId: channelId.trim() };
}
export async function sendTelegramAlert(text: string) {
  const { token, channelId } = config();
  const response = await fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: channelId, text, parse_mode: "HTML", disable_web_page_preview: true })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.description || "Telegram alert failed.");
  return result.result;
}
export async function uploadTelegramFile(file: File, asPhoto = false) {
  const { token, channelId } = config();
  const form = new FormData();
  form.append("chat_id", channelId);
  form.append(asPhoto ? "photo" : "document", file, file.name || (asPhoto ? "upload.jpg" : "upload.bin"));
  const method = asPhoto ? "sendPhoto" : "sendDocument";
  const response = await fetch(`${API}/bot${token}/${method}`, { method: "POST", body: form });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.description || "Telegram file upload failed.");
  const message = result.result;
  const item = asPhoto ? message.photo?.[message.photo.length - 1] : message.document;
  if (!item?.file_id) throw new Error("Telegram did not return a file ID.");
  return { fileId: item.file_id as string, messageId: message.message_id as number, mimeType: file.type, fileName: file.name };
}
export async function getTelegramFile(fileId: string) {
  const { token } = config();
  const response = await fetch(`${API}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`, { cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok || !result.result?.file_path) throw new Error("Telegram file could not be found.");
  const fileResponse = await fetch(`https://api.telegram.org/file/bot${token}/${result.result.file_path}`, { cache: "no-store" });
  if (!fileResponse.ok) throw new Error("Telegram file download failed.");
  return { response: fileResponse, filePath: String(result.result.file_path) };
}
