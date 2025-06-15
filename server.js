import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";
import path from "path";

// Charger les variables d'environnement depuis .env.server
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger spécifiquement le fichier .env.server
config({ path: resolve(__dirname, ".env.server") });

const app = express();
const port = process.env.PORT || 3001;

// Afficher les variables d'environnement chargées (pour le débogage)
console.log("Configuration LiveKit chargée:", {
  LIVEKIT_URL: process.env.LIVEKIT_URL,
  PORT: process.env.PORT,
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY
    ? "***" + process.env.LIVEKIT_API_KEY.slice(-4)
    : "non défini",
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET
    ? "***" + process.env.LIVEKIT_API_SECRET.slice(-4)
    : "non défini",
});

// Middleware
app.use(cors());
app.use(express.json());

// Générer un token LiveKit
app.post("/api/token", async (req, res) => {
  try {
    console.log("Requête reçue sur /api/token avec le corps:", req.body);
    console.log("Variables d'environnement chargées:", {
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY
        ? "***" + process.env.LIVEKIT_API_KEY.slice(-4)
        : "non défini",
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET
        ? "***" + process.env.LIVEKIT_API_SECRET.slice(-4)
        : "non défini",
      LIVEKIT_URL: process.env.LIVEKIT_URL || "non défini",
      PORT: process.env.PORT || "non défini",
    });

    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({
        error: "Missing roomName or participantName",
        received: { roomName, participantName },
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return res.status(500).json({
        error: "Server misconfiguration. Check environment variables.",
      });
    }

    // Créer un token d'accès avec les permissions de base
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: "10m", // 10 minutes
    });

    // Ajouter les autorisations de base
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    // Générer le token JWT
    const token = await at.toJwt();

    res.json({
      token,
      url: wsUrl,
    });
  } catch (error) {
    console.error("Erreur lors de la génération du token:", error);
    res.status(500).json({
      error: "Erreur interne du serveur",
      details: error.message,
    });
  }
});

// Servir les fichiers statiques du build de production
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "dist")));

  // Gérer le mode history de Vue Router
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`LiveKit URL: ${process.env.LIVEKIT_URL}`);
  console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
});
