import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Générer un token LiveKit
app.post('/api/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ 
        error: 'Missing roomName or participantName',
        received: { roomName, participantName }
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return res.status(500).json({ 
        error: 'Server misconfiguration. Check environment variables.'
      });
    }

    // Créer un token d'accès avec les permissions de base
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '10m', // 10 minutes
    });

    // Ajouter les autorisations de base
    at.addGrant({ 
      roomJoin: true, 
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });

    // Générer le token JWT
    const token = await at.toJwt();
    
    res.json({
      token,
      url: wsUrl
    });
  } catch (error) {
    console.error('Erreur lors de la génération du token:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`LiveKit URL: ${process.env.LIVEKIT_URL}`);
});
