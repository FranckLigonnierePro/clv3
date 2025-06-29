<template>
  <div
    class="block-container absolute cursor-move select-none"
    :style="blockStyle"
    @mousedown.stop="emit('interaction', $event, block.id, 'move')"
  >
    <!-- Image container -->
    <div 
      ref="imageContainerRef" 
      class="relative"
      :style="imageContainerStyle"
    >
      <!-- Image with hardware acceleration -->
      <img
        ref="imageRef"
        :src="block.src"
        :alt="block.alt || 'Image'"
        class="block will-change-transform cursor-move"
        :style="imageStyle"
        @load="handleImageLoad"
        @mousedown.stop="emit('interaction', $event, block.id, 'move')"
      />
      
      <!-- Border overlay with exact image dimensions -->
      <div 
        v-if="imageLoaded"
        :class="['absolute inset-0 pointer-events-none', { 'border-2 border-blue-500 z-10': isActive, 'border-2 border-transparent hover:border-gray-400': !isActive }]"
        :style="borderStyle"
      ></div>
    </div>

    <!-- Poignées de redimensionnement et rotation -->
    <template v-if="isActive && imageLoaded">
      <!-- Poignées d'angle -->
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize z-20"
        :style="getHandleStyle('nw')"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-nw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize z-20"
        :style="getHandleStyle('ne')"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-ne')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize z-20"
        :style="getHandleStyle('sw')"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-sw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize z-20"
        :style="getHandleStyle('se')"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-se')"
      />

      <!-- Poignée de rotation -->
      <div
        class="absolute w-6 h-6 bg-green-500 border border-white cursor-grab rounded-full flex items-center justify-center z-20"
        :style="getHandleStyle('rotate')"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'rotate')"
      >
        <RotateCw class="w-3 h-3 text-white" />
      </div>
      
      <!-- Boutons de suppression et verrouillage -->
      <div class="absolute flex gap-1 z-20" :style="getHandleStyle('controls')">
        <button
          @click.stop="emit('element-deleted', block.id)"
          class="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-opacity opacity-70 hover:opacity-100"
          title="Supprimer"
        >✕</button>
        <button
          @click.stop="emit('element-updated', { id: block.id, locked: !block.locked })"
          :class="block.locked ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-700 text-white'"
          class="hover:bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center shadow transition-opacity opacity-70 hover:opacity-100"
          :title="block.locked ? 'Déverrouiller' : 'Verrouiller'"
        >
          <span v-if="block.locked">🔒</span>
          <span v-else>🔓</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, onMounted } from 'vue';
import { RotateCw } from 'lucide-vue-next';

// --- TYPE DEFINITIONS ---
interface ImageBlockData {
  id: string;
  type: 'image';
  src: string;
  alt?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio?: number;
  locked: boolean;
}

interface CanvasSize {
  width: number;
  height: number;
}

type InteractionType = 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 'rotate';

// --- PROPS ---
const props = defineProps<{
  block: ImageBlockData;
  canvasSize: CanvasSize;
  isActive: boolean;
}>();

// --- EMITS ---
const emit = defineEmits<{
  (e: 'interaction', event: MouseEvent, id: string, action: InteractionType): void;
  (e: 'imageLoaded', id: string, aspectRatio: number): void;
  (e: 'element-deleted', id: string): void;
  (e: 'element-updated', update: { id: string, locked: boolean } | { id: string, width: number, height: number }): void;
}>();

// --- REFS ---
const imageLoaded = ref(false);
const imageRef = ref<HTMLImageElement | null>(null);
const imageContainerRef = ref<HTMLDivElement | null>(null);

// Dimensions réelles de l'image une fois chargée
const imageDimensions = reactive({
  width: 0,
  height: 0,
  offsetX: 0,
  offsetY: 0,
  naturalWidth: 0,
  naturalHeight: 0
});

// --- UTILS ---
const ratioToPixels = (ratio: number, dimension: 'width' | 'height'): number => {
  if (!props.canvasSize) return 0;
  return ratio * props.canvasSize[dimension];
};

// --- COMPUTED STYLES ---
const blockStyle = computed(() => {
  if (!imageLoaded.value) {
    // Style initial avant le chargement de l'image
    return {
      left: `${ratioToPixels(props.block.x, 'width')}px`,
      top: `${ratioToPixels(props.block.y, 'height')}px`,
      width: `${ratioToPixels(props.block.width, 'width')}px`,
      height: `${ratioToPixels(props.block.height, 'height')}px`,
      transform: `rotate(${props.block.rotation}deg)`,
      transformOrigin: 'center',
    };
  }
  
  // Une fois l'image chargée, utiliser les dimensions réelles de l'image
  return {
    left: `${ratioToPixels(props.block.x, 'width') + imageDimensions.offsetX}px`,
    top: `${ratioToPixels(props.block.y, 'height') + imageDimensions.offsetY}px`,
    width: `${imageDimensions.width}px`,
    height: `${imageDimensions.height}px`,
    transform: `rotate(${props.block.rotation}deg)`,
    transformOrigin: 'center',
  };
});

const imageContainerStyle = computed(() => ({
  width: '100%',
  height: '100%',
}));

// Calculer les dimensions de l'image une fois pour éviter les recalculs constants
const calculateImageDimensions = () => {
  if (!imageLoaded.value) return;
  
  const containerWidth = ratioToPixels(props.block.width, 'width');
  const containerHeight = ratioToPixels(props.block.height, 'height');
  
  // Calculer les dimensions de l'image en respectant l'aspect ratio
  const imageAspectRatio = imageDimensions.naturalWidth / imageDimensions.naturalHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  
  let displayWidth, displayHeight;
  
  if (imageAspectRatio > containerAspectRatio) {
    // L'image est limitée par la largeur
    displayWidth = containerWidth;
    displayHeight = containerWidth / imageAspectRatio;
  } else {
    // L'image est limitée par la hauteur
    displayHeight = containerHeight;
    displayWidth = containerHeight * imageAspectRatio;
  }
  
  // Centrer l'image
  const offsetX = (containerWidth - displayWidth) / 2;
  const offsetY = (containerHeight - displayHeight) / 2;
  
  // Mettre à jour les dimensions pour les poignées
  imageDimensions.width = displayWidth;
  imageDimensions.height = displayHeight;
  imageDimensions.offsetX = offsetX;
  imageDimensions.offsetY = offsetY;
};

const imageStyle = computed(() => {
  if (!imageLoaded.value) {
    return {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
    };
  }
  
  // Maintenant que le conteneur a la même taille que l'image, l'image remplit simplement 100% du conteneur
  return {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
    left: 0,
    top: 0,
  };
});

// Maintenant que le conteneur a la même taille que l'image, le contour doit simplement couvrir 100% du conteneur
const borderStyle = computed(() => ({
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
}));

// --- HANDLE POSITIONS ---
const getHandleStyle = (position: string) => {
  // La taille des poignées est de 12px (w-3 dans Tailwind)
  const handleSize = 6; // Moitié de la taille pour centrer (12px / 2)
  
  switch (position) {
    case 'nw': // Coin supérieur gauche
      return {
        left: `-${handleSize}px`,
        top: `-${handleSize}px`,
      };
    case 'ne': // Coin supérieur droit
      return {
        right: `-${handleSize}px`,
        top: `-${handleSize}px`,
      };
    case 'sw': // Coin inférieur gauche
      return {
        left: `-${handleSize}px`,
        bottom: `-${handleSize}px`,
      };
    case 'se': // Coin inférieur droit
      return {
        right: `-${handleSize}px`,
        bottom: `-${handleSize}px`,
      };
    case 'rotate': // Poignée de rotation (centrée en haut)
      return {
        left: `calc(50% - 6px)`,
        top: `-30px`,
      };
    case 'controls': // Contrôles (en haut à gauche)
      return {
        left: `0`,
        top: `-32px`,
      };
    default:
      return {};
  }
};

// --- HANDLERS ---
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  
  // Stocker les dimensions naturelles
  imageDimensions.naturalWidth = img.naturalWidth;
  imageDimensions.naturalHeight = img.naturalHeight;
  
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  
  // Émettre l'événement pour mettre à jour l'aspect ratio dans le parent
  emit('imageLoaded', props.block.id, aspectRatio);
  
  imageLoaded.value = true;
  
  // Calculer les dimensions initiales de l'image
  calculateImageDimensions();
};

// Observer les changements de dimensions du bloc pour recalculer les dimensions de l'image
watch(
  () => [props.block.width, props.block.height, props.block.x, props.block.y, props.block.rotation],
  () => {
    if (imageLoaded.value) {
      calculateImageDimensions();
    }
  },
  { flush: 'post' } // S'assurer que les calculs sont faits après les mises à jour du DOM
);

// S'assurer que les dimensions sont calculées après le montage du composant
onMounted(() => {
  if (imageRef.value && imageRef.value.complete && imageRef.value.naturalWidth > 0) {
    // Si l'image est déjà chargée depuis le cache
    imageDimensions.naturalWidth = imageRef.value.naturalWidth;
    imageDimensions.naturalHeight = imageRef.value.naturalHeight;
    imageLoaded.value = true;
    calculateImageDimensions();
  }
});
</script>

<style scoped>
.cursor-nwse-resize { cursor: nwse-resize; }
.cursor-nesw-resize { cursor: nesw-resize; }
</style>