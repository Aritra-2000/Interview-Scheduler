import { google } from "googleapis";

export function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return client;
}

export async function insertCalendarEvent({ accessToken, refreshToken, event }: { accessToken: string; refreshToken?: string; event: any; }) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const res = await calendar.events.insert({ calendarId: "primary", requestBody: event });
  return res.data;
}
