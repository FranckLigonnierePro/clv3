<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, reactive, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import TextBlock from './TextBlock.vue'; // <-- Remplacement de StudioTextarea par TextBlock

// --- TYPE DEFINITIONS ---
// Structure de données enrichie pour correspondre aux props de TextBlock.vue
interface TextElement {
  id: string;
  type: 'text';
  text: string;
  x: number; // Position en ratio (0-1)
  y: number;
  width: number; // Largeur en ratio
  height: number; // Hauteur en ratio
  rotation: number; // en degrés
  fontSize: number; // Taille de police de base
  isEditing?: boolean; // Indique si le bloc est en mode édition
  locked?: boolean;
  style?: any; // Gardé pour compatibilité éventuelle
}

// État pour le glisser-déposer
interface DragState {
  blockId: string;
  action: 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 'rotate';
  startX: number;
  startY: number;
  initialBlock: TextElement; // Stocke l'état initial du bloc
  canvasRect: DOMRect;
}

// --- EMITS & PROPS ---
const emit = defineEmits(['element-updated', 'element-deleted']);
const props = defineProps<{
  elements: Array<TextElement>; // Utilise la nouvelle interface
  showGrid: boolean;
  snapEnabled?: boolean;
}>();

// --- REFS & STATE ---
const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasOverlayRef = ref<HTMLElement | null>(null); // Pour le clic extérieur

const selectedId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const draggingState = ref<DragState | null>(null);
const canvasSize = ref({ width: 1920, height: 1080 });

// --- UTILS ---
const ratioToPixels = (ratio: number, dimension: 'width' | 'height') => {
  return ratio * canvasSize.value[dimension];
};

const pixelsToRatio = (pixels: number, dimension: 'width' | 'height') => {
  if (canvasSize.value[dimension] === 0) return 0;
  return pixels / canvasSize.value[dimension];
};

// --- GESTION DE LA GRILLE ---
const GRID_COLS = 32;
const GRID_ROWS = 18;
function snapToGrid(ratioX: number, ratioY: number) {
  const snapX = Math.round(ratioX * GRID_COLS) / GRID_COLS;
  const snapY = Math.round(ratioY * GRID_ROWS) / GRID_ROWS;
  return { x: snapX, y: snapY };
}

// --- GESTION DES CLICS ---
// Désélectionne l'élément si on clique en dehors de tous les TextBlock
// Note: la logique de @mousedown.stop dans TextBlock est cruciale ici.
onClickOutside(canvasOverlayRef, () => {
    selectedId.value = null;
    editingId.value = null; // Quitte aussi le mode édition
});


// --- HANDLERS D'ÉVÉNEMENTS PROVENANT DE TextBlock.vue ---

function handleRequestEdit(id: string) {
  const el = props.elements.find(e => e.id === id);
  if (el && !el.locked) {
    editingId.value = id;
    selectedId.value = id; // Sélectionne aussi l'élément lors de l'édition
  }
}

function handleInteraction(event: MouseEvent, id: string, action: DragState['action']) {
  const block = props.elements.find(b => b.id === id);
  if (!block || block.locked || !canvasRef.value) return;

  // Sélectionne l'élément au début de l'interaction
  selectedId.value = id;
  editingId.value = null; // Quitte le mode édition

  draggingState.value = {
    blockId: id,
    action,
    startX: event.clientX,
    startY: event.clientY,
    initialBlock: JSON.parse(JSON.stringify(block)), // Copie profonde de l'état initial
    canvasRect: canvasRef.value.getBoundingClientRect(),
  };
}

// Taille de police fixe pour les calculs en mode édition (en pixels)
const EDIT_FONT_SIZE = 16;

// Fonction pour ajuster automatiquement la taille du bloc au texte
function adjustBlockToText(id: string, isEditing = false) {
    const block = props.elements.find(b => b.id === id);
    if (!block) return;
    
    // Calculer la taille de police en fonction de la hauteur du bloc
    const blockHeightPx = ratioToPixels(block.height, 'height');
    const fontSize = isEditing ? EDIT_FONT_SIZE : Math.max(8, blockHeightPx * 0.8);
    const fontStyle = `${fontSize}px Arial, sans-serif`;
    
    // Mesurer le texte
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.font = fontStyle;
    const textWidth = context.measureText(block.text).width;
    const lineHeight = fontSize * 1.2;
    
    // Calculer les nouvelles dimensions avec des marges généreuses
    // Ajouter une marge plus importante pour s'assurer que tout le texte est visible
    const horizontalMargin = 60; // pixels (augmenté pour éviter la troncature)
    const verticalMargin = 20; // pixels
    
    const newWidthRatio = pixelsToRatio(textWidth + horizontalMargin, 'width');
    const newHeightRatio = pixelsToRatio(lineHeight + verticalMargin, 'height');
    
    // Appliquer les dimensions minimales
    const minWidth = 0.05; // 5% de la largeur du canvas
    const minHeight = 0.02; // 2% de la hauteur du canvas
    
    // Mettre à jour les dimensions du bloc
    // S'assurer que le bloc est suffisamment large pour le texte
    block.width = Math.max(newWidthRatio, minWidth);
    block.height = Math.max(newHeightRatio, minHeight);
    
    // Émettre la mise à jour
    emit('element-updated', {
        id,
        width: block.width,
        height: block.height
    });
    
    // Forcer une mise à jour immédiate pour éviter les problèmes d'affichage
    nextTick(() => {
        // Vérifier si le texte est encore tronqué et ajuster si nécessaire
        setTimeout(() => {
            const block = props.elements.find(b => b.id === id);
            if (block) {
                // Augmenter légèrement la largeur pour s'assurer que tout le texte est visible
                block.width *= 1.1; // Ajouter 10% de largeur supplémentaire
                emit('element-updated', {
                    id,
                    width: block.width
                });
            }
        }, 50);
    });
}

function handleTextChange(id: string, newText: string) {
    const block = props.elements.find(b => b.id === id);
    if (!block) return;

    // Mettre à jour le texte
    block.text = newText;
    
    // Ajuster automatiquement la taille du bloc au texte
    adjustBlockToText(id, true);
    
    // Émettre la mise à jour du texte
    emit('element-updated', {
        id,
        text: newText
    });
}

function handleTextBlur(id: string) {
  if (editingId.value === id) {
    editingId.value = null;
  }
  
  const block = props.elements.find(b => b.id === id);
  if (block) {
    block.isEditing = false;
    
    // Ajuster la taille du bloc au texte lorsqu'on quitte le mode édition
    // Utiliser false pour indiquer qu'on n'est plus en mode édition
    adjustBlockToText(id, false);
  }
}


// --- LOGIQUE DE DÉPLACEMENT / REDIMENSIONNEMENT / ROTATION ---

function handleMouseMove(e: MouseEvent) {
  if (!draggingState.value) return;

  const { startX, startY, initialBlock, action, blockId } = draggingState.value;
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;

  const currentBlock = props.elements.find(b => b.id === blockId);
  if (!currentBlock) return;

  let changes: Partial<TextElement> = {};

  switch (action) {
    case 'move': {
      let newX = initialBlock.x + pixelsToRatio(deltaX, 'width');
      let newY = initialBlock.y + pixelsToRatio(deltaY, 'height');
      if (props.snapEnabled) {
          const snapped = snapToGrid(newX, newY);
          newX = snapped.x;
          newY = snapped.y;
      }
      changes = { x: newX, y: newY };
      break;
    }
    case 'rotate': {
      const centerX = ratioToPixels(initialBlock.x + initialBlock.width / 2, 'width');
      const centerY = ratioToPixels(initialBlock.y + initialBlock.height / 2, 'height');
      const angle = Math.atan2(
        e.clientY - draggingState.value.canvasRect.top - centerY,
        e.clientX - draggingState.value.canvasRect.left - centerX
      ) * 180 / Math.PI;
      changes = { rotation: angle + 90 };
      break;
    }
    default: { // Gère tous les cas de 'resize'
      const deltaRatioX = pixelsToRatio(deltaX, 'width');
      const deltaRatioY = pixelsToRatio(deltaY, 'height');
      
      const scaleFactor = Math.max(
          (initialBlock.width + (action.includes('e') ? deltaRatioX : -deltaRatioX)) / initialBlock.width,
          (initialBlock.height + (action.includes('s') ? deltaRatioY : -deltaRatioY)) / initialBlock.height
      );

      const scaledWidth = initialBlock.width * scaleFactor;
      const scaledHeight = initialBlock.height * scaleFactor;
      
      let newX = initialBlock.x;
      let newY = initialBlock.y;

      if (action.includes('w')) { newX = initialBlock.x + initialBlock.width - scaledWidth; }
      if (action.includes('n')) { newY = initialBlock.y + initialBlock.height - scaledHeight; }
      
      if (scaledWidth >= 0.05 && scaledHeight >= 0.02) {
          changes = {
              x: newX,
              y: newY,
              width: scaledWidth,
              height: scaledHeight,
          };
      }
      break;
    }
  }
  
  // Applique les changements en temps réel
  if (Object.keys(changes).length > 0) {
      const blockToUpdate = props.elements.find(b => b.id === blockId);
      if (blockToUpdate) {
          Object.assign(blockToUpdate, changes);
      }
  }
}

function handleMouseUp() {
  if (!draggingState.value) return;
  const block = props.elements.find(b => b.id === draggingState.value!.blockId);
  
  if (block) {
    // Émet l'état final complet de l'élément à la fin du glisser-déposer
    emit('element-updated', { ...block });
  }

  draggingState.value = null;
}

// Observe l'état de glisser-déposer pour ajouter/retirer les écouteurs globaux
watch(draggingState, (newState, oldState) => {
  if (newState && !oldState) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  } else if (!newState && oldState) {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }
});


// --- CANVAS DRAWING & RESIZING ---

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.fillStyle = '#a78bfa';
  const spacingX = width / GRID_COLS;
  const spacingY = height / GRID_ROWS;
  const radius = 2;
  for (let i = 1; i < GRID_COLS; i++) {
    for (let j = 1; j < GRID_ROWS; j++) {
      const x = Math.round(i * spacingX);
      const y = Math.round(j * spacingY);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (props.showGrid) drawGrid(ctx, canvas.width, canvas.height);
}

// Style calculé pour les boutons flottants
const floatingButtonsStyle = (el: TextElement) => {
  const x = ratioToPixels(el.x, 'width');
  const y = ratioToPixels(el.y, 'height');
  return {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    // Positionne les boutons au-dessus du coin supérieur gauche du bloc
    transform: `translateY(-32px)`,
    zIndex: 20,
    display: 'flex',
    gap: '4px',
    pointerEvents: 'auto',
  };
};

let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  const updateCanvasSize = () => {
    const container = containerRef.value;
    const canvas = canvasRef.value;
    if (container && canvas) {
      const rect = container.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      canvas.width = width;
      canvas.height = height;
      canvasSize.value = { width, height };
      drawCanvas();
    }
  };

  nextTick(() => {
    updateCanvasSize();
    resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value);
    }
  });
});

onUnmounted(() => {
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value);
  resizeObserver = null;
});

// Redessine le canvas si la grille est activée/désactivée
watch(() => props.showGrid, drawCanvas);

</script>

<template>
  <div ref="containerRef" class="aspect-[16/9] max-w-full max-h-full bg-black rounded-2xl shadow-xl relative">
    <canvas
      ref="canvasRef"
      :width="canvasSize.width"
      :height="canvasSize.height"
      class="w-full h-full block rounded-2xl"
    ></canvas>
    
    <!-- L'overlay capture les clics "à l'extérieur" -->
    <div 
      ref="canvasOverlayRef" 
      class="absolute top-0 left-0 w-full h-full"
      style="pointer-events: none;"
    >
      <template v-for="el in props.elements" :key="el.id">
        <div v-if="el.type === 'text'">
          
          <!-- Boutons flottants, visibles si l'élément est sélectionné et non en édition -->
          <div
            v-if="selectedId === el.id && editingId !== el.id"
            :style="floatingButtonsStyle(el)"
          >
            <button
              @click="$emit('element-deleted', el.id)"
              class="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-opacity opacity-70 hover:opacity-100"
              title="Supprimer"
              style="pointer-events: auto;"
            >✕</button>
            <button
              @click="$emit('element-updated', { id: el.id, locked: !el.locked })"
              :class="el.locked ? 'bg-yellow-400 text-zinc-900' : 'bg-zinc-700 text-white'"
              class="hover:bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center shadow transition-opacity opacity-70 hover:opacity-100"
              :title="el.locked ? 'Déverrouiller' : 'Verrouiller'"
              style="pointer-events: auto;"
            >
              <span v-if="el.locked">🔒</span>
              <span v-else>🔓</span>
            </button>
          </div>
          
          <!-- Le composant TextBlock.vue gère maintenant chaque élément de texte -->
          <TextBlock
            :block="{ ...el, isEditing: editingId === el.id }"
            :canvasSize="canvasSize"
            :is-active="selectedId === el.id"
            @request-edit="handleRequestEdit"
            @interaction="handleInteraction"
            @text-change="handleTextChange"
            @text-blur="handleTextBlur"
            style="pointer-events: auto;"
          />
        </div>
      </template>
    </div>
  </div>
</template>
