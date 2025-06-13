<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <!-- En-tête -->
    <header class="mb-6 text-center">
      <h1 class="text-2xl font-bold">ClipLive - Visionnage</h1>
      <p v-if="roomName" class="text-gray-400">Room: {{ roomName }}</p>
    </header>

    <!-- Lecteur vidéo -->
    <div class="max-w-4xl mx-auto bg-black rounded-xl overflow-hidden">
      <div class="relative w-full aspect-video bg-black">
        <video 
          ref="videoRef" 
          autoplay
          playsinline
          muted
          class="w-full h-full"
        ></video>
        
        <!-- État de chargement -->
        <div v-if="!isLive" class="absolute inset-0 flex items-center justify-center bg-black/50">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p class="mt-2 text-white">En attente du flux vidéo...</p>
          </div>
        </div>
        
        <!-- Indicateur EN DIRECT -->
        <div v-if="isLive" class="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-sm font-medium">
          EN DIRECT
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg max-w-2xl mx-auto">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Room, Track } from 'livekit-client';

const route = useRoute();
const videoRef = ref(null);
const room = ref(null);
const isLive = ref(false);
const error = ref('');
const roomName = ref('');

// Configuration LiveKit
const livekitUrl = import.meta.env.VITE_LIVEKIT_WS_URL || 'wss://clipstudio-vdf7emf1.livekit.cloud';

// Props du composant
const props = defineProps({
  room: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  }
});

// Log des propriétés reçues
console.log('Watch component mounted with props:', {
  room: props.room,
  token: props.token ? 'token-present' : 'token-missing'
});

// Gestion des pistes vidéo
const handleTrackSubscribed = (track, publication, participant) => {
  console.log('Piste reçue:', {
    kind: track.kind,
    id: track.sid,
    participant: participant.identity,
    isMuted: track.isMuted,
    isEnabled: track.isEnabled,
    readyState: track.mediaStreamTrack.readyState
  });

  if (track.kind === Track.Kind.Video) {
    if (!videoRef.value) {
      console.error('Élément vidéo non trouvé');
      return;
    }
    
    console.log('Configuration de la piste vidéo...');
    const videoElement = videoRef.value;
    
    // Créer un nouveau MediaStream avec la piste
    const mediaStream = new MediaStream([track.mediaStreamTrack]);
    
    // Vérifier si la piste contient des données
    const videoTrack = mediaStream.getVideoTracks()[0];
    if (!videoTrack) {
      console.error('Aucune piste vidéo trouvée dans le MediaStream');
      return;
    }
    
    console.log('Piste vidéo détectée avec les capacités:', {
      width: videoTrack.getSettings().width,
      height: videoTrack.getSettings().height,
      frameRate: videoTrack.getSettings().frameRate,
      readyState: videoTrack.readyState
    });
    
    // Configurer l'élément vidéo
    videoElement.playsInline = true;
    videoElement.muted = true; // Important pour la lecture automatique
    videoElement.srcObject = mediaStream;
    
    // Essayer de lire la vidéo
    const playPromise = videoElement.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Lecture vidéo démarrée avec succès');
          isLive.value = true;
        })
        .catch(err => {
          console.error('Erreur lors de la lecture vidéo:', err);
          // Essayer avec une approche différente
          videoElement.muted = true;
          videoElement.play()
            .then(() => {
              console.log('Lecture réussie après activation du mode muet');
              isLive.value = true;
            })
            .catch(e => {
              console.error('Échec de la lecture vidéo:', e);
              error.value = 'Impossible de lire le flux vidéo';
            });
        });
    }
  }
};

// Nettoyage des ressources
const cleanup = async () => {
  if (room.value) {
    try {
      await room.value.disconnect();
    } catch (e) {
      console.error('Erreur lors de la déconnexion:', e);
    }
  }
  
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  
  isLive.value = false;
};

// Connexion à la room
const connectToRoom = async () => {
  if (!props.room || !props.token) {
    const errorMsg = 'Paramètres de salle ou de jeton manquants';
    console.error(errorMsg);
    error.value = errorMsg;
    return;
  }
  
  roomName.value = props.room;
  const token = props.token;
  console.log('Tentative de connexion à la room:', roomName.value);
  
  try {
    // Créer une nouvelle instance Room
    const newRoom = new Room({
      // Désactiver temporairement pour le débogage
      adaptiveStream: false,
      dynacast: false,
      // Activer les logs détaillés
      logger: console,
      logLevel: 'debug',
    });
    
    // Configurer les gestionnaires d'événements
    newRoom
      .on('trackSubscribed', handleTrackSubscribed)
      .on('trackUnsubscribed', (track) => {
        console.log('Piste désinscrite:', track.sid, track.kind);
        if (track.kind === Track.Kind.Video) {
          isLive.value = false;
          if (videoRef.value) {
            videoRef.value.srcObject = null;
          }
        }
      })
      .on('trackPublished', (publication, participant) => {
        try {
          console.log('Piste publiée par participant:', {
            participant: participant?.identity || 'inconnu',
            trackSid: publication?.trackSid || 'inconnu',
            kind: publication?.kind || 'inconnu'
          });
        } catch (error) {
          console.error('Erreur lors de la journalisation de la piste publiée:', error);
        }
      })
      .on('participantConnected', (participant) => {
        try {
          console.log('Nouveau participant connecté:', participant?.identity || 'inconnu');
          
          // Vérifier si le participant a des pistes à s'abonner
          if (participant?.tracks) {
            try {
              // Convertir en tableau de manière sécurisée
              const tracks = Array.isArray(participant.tracks) 
                ? participant.tracks 
                : (participant.tracks instanceof Map || participant.tracks instanceof Set)
                  ? Array.from(participant.tracks.values())
                  : [];
              
              console.log(`Nombre de pistes pour le participant: ${tracks.length}`);
              
              tracks.forEach((publication, index) => {
                if (publication?.track) {
                  console.log(`Piste [${index}]:`, {
                    trackSid: publication.trackSid || 'inconnu',
                    kind: publication.kind || 'inconnu',
                    isSubscribed: publication.isSubscribed,
                    isMuted: publication.isMuted
                  });
                }
              });
            } catch (trackError) {
              console.error('Erreur lors de la lecture des pistes du participant:', trackError);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la gestion de la connexion du participant:', error);
        }
      })
      .on('connected', () => {
        console.log('Connecté à la room avec succès');
        try {
          if (newRoom?.participants) {
            const participants = Array.isArray(newRoom.participants)
              ? newRoom.participants
              : (newRoom.participants instanceof Map || newRoom.participants instanceof Set)
                ? Array.from(newRoom.participants.keys())
                : [];
            console.log(`Nombre de participants dans la room: ${participants.length}`);
            console.log('Liste des participants:', participants);
          } else {
            console.log('Aucun participant dans la room');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des participants:', error);
        }
      })
      .on('disconnected', () => {
        console.log('Déconnecté de la room');
        isLive.value = false;
        error.value = 'Déconnecté de la diffusion';
      });
    
    // Options de connexion
    const connectOptions = {
      autoSubscribe: true,
      maxRetries: 3,
      timeout: 10000,
      // Désactiver le stockage local pour éviter les conflits entre onglets
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      },
      // Ajouter un identifiant unique pour chaque participant
      participantIdentity: `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    };
    
    console.log('Connexion à la room avec les options:', connectOptions);
    
    // Se connecter à la room
    await newRoom.connect(livekitUrl, token, connectOptions);
    
    // Vérifier les participants existants
    try {
      console.log('État de la room après connexion:', {
        sid: newRoom.sid,
        name: newRoom.name,
        state: newRoom.state,
        serverRegion: newRoom.serverRegion
      });
      
      // Vérifier si newRoom.participants est un Map ou un objet itérable
      if (newRoom.participants && typeof newRoom.participants === 'object') {
        try {
          // Essayer de convertir en tableau de différentes manières selon le type
          const participantsArray = Array.isArray(newRoom.participants) 
            ? newRoom.participants 
            : (newRoom.participants.values ? Array.from(newRoom.participants.values()) : []);
            
          console.log(`Nombre de participants dans la room: ${participantsArray.length}`);
          
          participantsArray.forEach((participant, index) => {
            if (participant) {
              console.log(`[${index}] Participant:`, {
                identity: participant.identity,
                sid: participant.sid,
                metadata: participant.metadata,
                audioTracks: participant.audioTracks?.size || 0,
                videoTracks: participant.videoTracks?.size || 0,
                tracksCount: participant.tracks?.size || 0
              });
              
              // Afficher les informations sur les pistes vidéo
              if (participant.videoTracks) {
                participant.videoTracks.forEach((publication, trackId) => {
                  console.log(`  Piste vidéo [${trackId}]:`, {
                    trackSid: publication.trackSid,
                    kind: publication.kind,
                    isSubscribed: publication.isSubscribed,
                    isMuted: publication.isMuted,
                    track: publication.track ? 'présente' : 'absente'
                  });
                });
              }
            }
          });
        } catch (participantError) {
          console.error('Erreur lors de la lecture des participants:', participantError);
        }
      } else {
        console.warn('Aucun participant trouvé ou participants non itérable');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des participants:', error);
    }
    
    // Stocker la référence
    room.value = newRoom;
    isLive.value = true;
    
  } catch (err) {
    console.error('Erreur de connexion:', err);
    error.value = `Erreur de connexion: ${err.message || 'Erreur inconnue'}`;
    isLive.value = false;
    
    // Nettoyer en cas d'erreur
    if (room.value) {
      try {
        await room.value.disconnect();
      } catch (e) {
        console.error('Erreur lors de la déconnexion après erreur:', e);
      }
      room.value = null;
    }
  }
};

// Gestion de l'interaction utilisateur pour débloquer l'audio
const handleInteraction = () => {
  if (videoRef.value) {
    videoRef.value.muted = false;
    videoRef.value.play().catch(e => console.error('Erreur de lecture audio:', e));
  }
};

// Cycle de vie du composant
onMounted(() => {
  console.log('Montage du composant Watch');
  console.log('Paramètres de la route:', { room: props.room, token: props.token });
  
  if (!props.room || !props.token) {
    error.value = 'Paramètres de salle ou de jeton manquants';
    return;
  }
  
  connectToRoom();
  
  // Ajouter les écouteurs d'événements pour le déblocage audio
  document.addEventListener('click', handleInteraction, { once: true });
  document.addEventListener('touchend', handleInteraction, { once: true });
});

// Surveiller les changements de paramètres de route
watch(() => [props.room, props.token], () => {
  if (props.room && props.token) {
    console.log('Nouveaux paramètres détectés:', { room: props.room, token: props.token });
    connectToRoom();
  }
});

// Nettoyage lors du démontage du composant
onUnmounted(async () => {
  console.log('Démontage du composant Watch');
  
  // Supprimer les écouteurs d'événements
  document.removeEventListener('click', handleInteraction);
  document.removeEventListener('touchend', handleInteraction);
  
  // Nettoyer la connexion à la salle si nécessaire
  if (room.value) {
    room.value.disconnect();
  }
  
  // Nettoyer les autres ressources
  await cleanup();
});
</script>

<style scoped>
video {
  background-color: #000;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
