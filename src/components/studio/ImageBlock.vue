<template>
  <div
    class="absolute cursor-move select-none"
    :style="blockStyle"
    @mousedown.stop="emit('interaction', $event, block.id, 'move')"
  >
    <!-- Image container -->
    <div ref="imageContainerRef" class="w-full h-full flex items-center justify-center overflow-hidden">
      <!-- Border overlay that adapts to image dimensions -->
      <div 
        v-if="imageLoaded"
        :class="['absolute', { 'border-2 border-blue-500 z-10': isActive, 'border-2 border-transparent hover:border-gray-400': !isActive }]"
        :style="imageBorderStyle"
      ></div>
      
      <img
        ref="imageRef"
        :src="block.src"
        :alt="block.alt || 'Image'"
        class="max-w-full max-h-full object-contain relative z-0"
        @load="handleImageLoad"
      />
    </div>

    <!-- Poignées de redimensionnement et rotation (visibles si le bloc est actif) -->
    <template v-if="isActive && imageLoaded">
      <!-- Poignées d'angle adaptées à l'image -->
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize"
        :style="handleStyleNW"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-nw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize"
        :style="handleStyleNE"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-ne')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize"
        :style="handleStyleSW"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-sw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize"
        :style="handleStyleSE"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-se')"
      />

      <!-- Poignée de rotation -->
      <div
        class="absolute w-6 h-6 bg-green-500 border border-white cursor-grab rounded-full flex items-center justify-center transform -translate-x-1/2"
        :style="rotateHandleStyle"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'rotate')"
      >
        <RotateCw class="w-3 h-3 text-white" />
      </div>
      
      <!-- Boutons de suppression et verrouillage -->
      <div class="absolute flex gap-1" style="top: -32px; left: 0;">
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
import { computed, ref, watch, onMounted } from 'vue';
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
  (e: 'element-updated', update: { id: string, locked: boolean }): void;
}>();

// --- REFS ---
const imageLoaded = ref(false);
const imageRef = ref<HTMLImageElement | null>(null);
const imageContainerRef = ref<HTMLDivElement | null>(null);
const imageBounds = ref({ top: 0, left: 0, width: 0, height: 0 });

// --- UTILS ---
const ratioToPixels = (ratio: number, dimension: 'width' | 'height'): number => {
  if (!props.canvasSize) return 0;
  return ratio * props.canvasSize[dimension];
};

// --- COMPUTED STYLES ---
const blockStyle = computed(() => ({
  left: `${ratioToPixels(props.block.x, 'width')}px`,
  top: `${ratioToPixels(props.block.y, 'height')}px`,
  width: `${ratioToPixels(props.block.width, 'width')}px`,
  height: `${ratioToPixels(props.block.height, 'height')}px`,
  transform: `rotate(${props.block.rotation}deg)`,
  transformOrigin: 'center',
}));

// Calcule les positions des poignées en fonction des dimensions réelles de l'image
const handleStyleNW = computed(() => ({
  left: `${imageBounds.value.left - 4}px`,
  top: `${imageBounds.value.top - 4}px`,
}));

const handleStyleNE = computed(() => ({
  left: `${imageBounds.value.left + imageBounds.value.width - 4}px`,
  top: `${imageBounds.value.top - 4}px`,
}));

const handleStyleSW = computed(() => ({
  left: `${imageBounds.value.left - 4}px`,
  top: `${imageBounds.value.top + imageBounds.value.height - 4}px`,
}));

const handleStyleSE = computed(() => ({
  left: `${imageBounds.value.left + imageBounds.value.width - 4}px`,
  top: `${imageBounds.value.top + imageBounds.value.height - 4}px`,
}));

const rotateHandleStyle = computed(() => ({
  left: `${imageBounds.value.left + imageBounds.value.width / 2}px`,
  top: `${imageBounds.value.top - 24}px`,
}));

// Style pour la bordure qui s'adapte à l'image
const imageBorderStyle = computed(() => ({
  left: `${imageBounds.value.left}px`,
  top: `${imageBounds.value.top}px`,
  width: `${imageBounds.value.width}px`,
  height: `${imageBounds.value.height}px`,
}));

// --- HANDLERS ---
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  
  // Émettre l'événement pour mettre à jour l'aspect ratio dans le parent
  emit('imageLoaded', props.block.id, aspectRatio);
  
  imageLoaded.value = true;
  
  // Calculer les dimensions réelles de l'image après chargement
  setTimeout(updateImageBounds, 0);
};

// Observer les changements de dimensions du bloc pour mettre à jour les poignées
watch(() => [props.block.width, props.block.height, props.block.rotation], () => {
  if (imageLoaded.value) {
    // Attendre que le DOM soit mis à jour avec les nouvelles dimensions
    setTimeout(updateImageBounds, 0);
  }
});

// S'assurer que les poignées sont mises à jour après le montage du composant
onMounted(() => {
  if (imageRef.value && imageRef.value.complete) {
    // Si l'image est déjà chargée depuis le cache
    imageLoaded.value = true;
    setTimeout(updateImageBounds, 0);
  }
});

// Mettre à jour les dimensions réelles de l'image dans le conteneur
const updateImageBounds = () => {
  if (!imageRef.value || !imageContainerRef.value) return;
  
  const img = imageRef.value;
  const container = imageContainerRef.value;
  
  // Calculer les dimensions réelles de l'image dans le conteneur
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  // Calculer les dimensions de l'image en respectant object-contain
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const containerRatio = containerWidth / containerHeight;
  
  let imgWidth, imgHeight;
  
  if (imgRatio > containerRatio) {
    // L'image est limitée par la largeur
    imgWidth = containerWidth;
    imgHeight = containerWidth / imgRatio;
  } else {
    // L'image est limitée par la hauteur
    imgHeight = containerHeight;
    imgWidth = containerHeight * imgRatio;
  }
  
  // Calculer la position de l'image centrée dans le conteneur
  const imgLeft = (containerWidth - imgWidth) / 2;
  const imgTop = (containerHeight - imgHeight) / 2;
  
  // Mettre à jour les dimensions pour les poignées
  imageBounds.value = {
    left: imgLeft,
    top: imgTop,
    width: imgWidth,
    height: imgHeight
  };
};
</script>

<style scoped>
.cursor-nwse-resize { cursor: nwse-resize; }
.cursor-nesw-resize { cursor: nesw-resize; }
</style>
