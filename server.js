import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const app = express();
const port = process.env.PORT || 8787;
app.use(express.json({ limit: "35mb" }));

let cachedToken = "";
let tokenExpiresAt = 0;
const tokenCachePath = path.join(os.tmpdir(), "spotpost_spotify_token.json");
const dataDir = path.join(os.tmpdir(), "spotpost-data");
const ordersDbPath = path.join(dataDir, "order-snapshots.db.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readOrderDb() {
  ensureDataDir();
  if (!fs.existsSync(ordersDbPath)) {
    return { items: {} };
  }
  try {
    const raw = fs.readFileSync(ordersDbPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { items: {} };
    if (!parsed.items || typeof parsed.items !== "object") return { items: {} };
    return parsed;
  } catch {
    return { items: {} };
  }
}

function writeOrderDb(db) {
  ensureDataDir();
  const tmpPath = `${ordersDbPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmpPath, ordersDbPath);
}

app.post("/api/order-snapshots", (req, res) => {
  try {
    const snapshot = req.body?.snapshot;
    const requestedId = String(req.body?.id || "").trim().toLowerCase();
    if (!snapshot || typeof snapshot !== "object") {
      return res.status(400).json({ error: { message: "Missing snapshot payload." } });
    }

    const payload = JSON.stringify(snapshot);
    if (Buffer.byteLength(payload, "utf8") > 25 * 1024 * 1024) {
      return res.status(413).json({ error: { message: "Snapshot payload too large." } });
    }

    const id = /^[a-f0-9]{16}$/.test(requestedId)
      ? requestedId
      : crypto.randomBytes(8).toString("hex");
    const db = readOrderDb();
    db.items[id] = {
      snapshot,
      createdAt: new Date().toISOString(),
    };
    writeOrderDb(db);
    return res.json({ id });
  } catch (error) {
    return res.status(500).json({
      error: {
        message:
          error instanceof Error ? error.message : "Could not save order snapshot.",
      },
    });
  }
});

app.get("/api/order-snapshots/:id", (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!/^[a-f0-9]{16}$/i.test(id)) {
      return res.status(400).json({ error: { message: "Invalid snapshot id." } });
    }

    const db = readOrderDb();
    const entry = db.items?.[id];
    if (!entry) {
      return res.status(404).json({ error: { message: "Snapshot not found." } });
    }

    return res.json({ snapshot: entry.snapshot || null, createdAt: entry.createdAt || null });
  } catch (error) {
    return res.status(500).json({
      error: {
        message:
          error instanceof Error ? error.message : "Could not load order snapshot.",
      },
    });
  }
});

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  try {
    if (fs.existsSync(tokenCachePath)) {
      const fileData = JSON.parse(fs.readFileSync(tokenCachePath, "utf8"));
      if (fileData.token && now < fileData.expiresAt - 30_000) {
        cachedToken = fileData.token;
        tokenExpiresAt = fileData.expiresAt;
        return cachedToken;
      }
    }
  } catch (e) {
    // Ignore read errors
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment.",
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Spotify token request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600) * 1000;

  try {
    fs.writeFileSync(
      tokenCachePath,
      JSON.stringify({ token: cachedToken, expiresAt: tokenExpiresAt }),
    );
  } catch (e) {
    // Ignore write errors
  }

  return cachedToken;
}

app.get("/api/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "track");
    const limit = "10";

    if (!q) {
      return res.status(400).json({ error: { message: "Missing search query." } });
    }

    const allowedTypes = new Set(["track", "album", "track,album", "album,track"]);
    if (!allowedTypes.has(type)) {
      return res.status(400).json({ error: { message: "Invalid type parameter." } });
    }

    const token = await getAccessToken();
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", q);
    url.searchParams.set("type", type);
    url.searchParams.set("limit", limit);

    const spotifyResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await readJsonOrText(spotifyResponse);
    if (!spotifyResponse.ok) {
      if (payload.data) {
        return res.status(spotifyResponse.status).json(payload.data);
      }
      return res.status(spotifyResponse.status).json({
        error: {
          message:
            payload.text || `Spotify request failed with ${spotifyResponse.status}.`,
        },
      });
    }

    if (!payload.data) {
      return res.status(502).json({
        error: {
          message: "Spotify returned a non-JSON response.",
        },
      });
    }

    return res.json(payload.data);
  } catch (error) {
    return res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : "Unexpected server error.",
      },
    });
  }
});

app.get("/api/lyrics", async (req, res) => {
  try {
    const track = String(req.query.track || "").trim();
    const artist = String(req.query.artist || "").trim();

    if (!track || !artist) {
      return res.status(400).json({
        error: { message: "Missing track or artist query parameter." },
      });
    }

    const result = await fetchLyrics(track, artist);
    if (!result?.lyrics) {
      return res.status(404).json({
        error: { message: "Lyrics were not found for this song." },
      });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : "Lyrics lookup failed.",
      },
    });
  }
});

app.get("/api/spotify-code", async (req, res) => {
  try {
    const uri = String(req.query.uri || "").trim();
    const bg = normalizeHexColor(String(req.query.bg || "FFFFFF"));
    const bars = normalizeHexColor(String(req.query.bars || "111111"));

    if (!uri) {
      return res.status(400).json({ error: { message: "Missing uri parameter." } });
    }

    const encodedUri = encodeURIComponent(uri);
    const sourceUrl = `https://scannables.scdn.co/uri/plain/png/${bg}/${bars}/640/${encodedUri}`;
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "SpotPost/1.0",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: { message: "Spotify code fetch failed." },
      });
    }

    const data = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(data);
  } catch {
    return res.status(502).json({ error: { message: "Spotify code unavailable." } });
  }
});

async function fetchLyrics(track, artist) {
  const cleanTrack = sanitizeTitle(track);
  const cleanArtist = sanitizeArtist(artist);

  const direct = await fetchFromLrcLibGet(cleanTrack, cleanArtist);
  if (direct?.lyrics) return direct;

  const search = await fetchFromLrcLibSearch(cleanTrack, cleanArtist);
  if (search?.lyrics) return search;

  const searchQ = await fetchFromLrcLibSearchByQuery(cleanTrack, cleanArtist);
  if (searchQ?.lyrics) return searchQ;

  const fallback = await fetchFromLyricsOvh(cleanTrack, cleanArtist);
  if (fallback?.lyrics) return fallback;
  return null;
}

async function fetchFromLrcLibGet(track, artist) {
  const url = new URL("https://lrclib.net/api/get");
  url.searchParams.set("track_name", track);
  url.searchParams.set("artist_name", artist);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SpotPost/1.0" },
  });
  if (!response.ok) return null;

  const payload = await readJsonOrText(response);
  const data = payload.data || {};
  const rawLyrics = data.plainLyrics || stripTimestampLyrics(data.syncedLyrics || "");
  const cleaned = normalizeLyrics(rawLyrics);
  if (!cleaned) return null;

  return {
    lyrics: cleaned,
    source: "lrclib",
  };
}

async function fetchFromLrcLibSearch(track, artist) {
  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("track_name", track);
  url.searchParams.set("artist_name", artist);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SpotPost/1.0" },
  });
  if (!response.ok) return null;

  const payload = await readJsonOrText(response);
  const list = Array.isArray(payload.data) ? payload.data : [];
  const best = list.find((item) => item?.plainLyrics || item?.syncedLyrics);
  if (!best) return null;

  const rawLyrics =
    best.plainLyrics || stripTimestampLyrics(String(best.syncedLyrics || ""));
  const cleaned = normalizeLyrics(rawLyrics);
  if (!cleaned) return null;

  return {
    lyrics: cleaned,
    source: "lrclib-search",
  };
}

async function fetchFromLrcLibSearchByQuery(track, artist) {
  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("q", `${artist} ${track}`);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SpotPost/1.0" },
  });
  if (!response.ok) return null;

  const payload = await readJsonOrText(response);
  const list = Array.isArray(payload.data) ? payload.data : [];
  const best = list.find((item) => item?.plainLyrics || item?.syncedLyrics);
  if (!best) return null;

  const rawLyrics =
    best.plainLyrics || stripTimestampLyrics(String(best.syncedLyrics || ""));
  const cleaned = normalizeLyrics(rawLyrics);
  if (!cleaned) return null;

  return {
    lyrics: cleaned,
    source: "lrclib-query",
  };
}

async function fetchFromLyricsOvh(track, artist) {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(
    artist,
  )}/${encodeURIComponent(track)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SpotPost/1.0" },
  });
  if (!response.ok) return null;

  const payload = await readJsonOrText(response);
  const cleaned = normalizeLyrics(payload.data?.lyrics || "");
  if (!cleaned) return null;

  return {
    lyrics: cleaned,
    source: "lyrics.ovh",
  };
}

function sanitizeTitle(value) {
  return String(value || "")
    .replace(/\((feat|ft)\.?.*?\)/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeArtist(value) {
  return String(value || "")
    .split(",")[0]
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripTimestampLyrics(synced) {
  return synced
    .split("\n")
    .map((line) => line.replace(/\[[^\]]+\]/g, "").trim())
    .filter(Boolean)
    .join("\n");
}

function normalizeHexColor(value) {
  const cleaned = String(value || "")
    .replace(/[^a-fA-F0-9]/g, "")
    .toUpperCase();
  if (cleaned.length === 6) return cleaned;
  if (cleaned.length === 3) {
    return cleaned
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  return "FFFFFF";
}

function normalizeLyrics(raw) {
  const lines = String(raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 18);

  if (!lines.length) return "";
  return lines.join("\n");
}

async function readJsonOrText(response) {
  const raw = await response.text();
  try {
    return {
      data: JSON.parse(raw),
      text: "",
    };
  } catch {
    return {
      data: null,
      text: raw.slice(0, 180).trim(),
    };
  }
}

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Spotify API server listening on http://localhost:${port}`);
  });
}

export default app;
