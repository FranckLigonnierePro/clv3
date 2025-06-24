<template>
  <div
    :class="['absolute', { 'border-2 border-blue-500 z-10': isActive, 'border-2 border-transparent hover:border-gray-400': !isActive }, block.isEditing ? 'cursor-text' : 'cursor-move', 'select-none']"
    :style="blockStyle"
    @dblclick.stop="!block.isEditing && emit('requestEdit', block.id)"
    @mousedown.stop="!block.isEditing && emit('interaction', $event, block.id, 'move')"
  >
    <!-- Texte éditable ou affiché -->
    <textarea
      v-if="block.isEditing"
      ref="textareaRef"
      :value="block.text"
      @input="handleTextareaInput"
      @blur="emit('textBlur', block.id)"
      @keydown.esc.prevent="emit('textBlur', block.id)"
      :style="textStyle"
      class="w-full h-full border-none outline-none bg-transparent text-center resize-none p-0 m-0 overflow-hidden"
    />
    <div
      v-else
      :style="textStyle"
      class="w-full h-full flex items-center justify-center text-center whitespace-nowrap"
    >
      {{ block.text }}
    </div>

    <!-- Poignées de redimensionnement et rotation (visibles si le bloc est actif) -->
    <template v-if="isActive && !block.isEditing">
      <!-- Poignées d'angle -->
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize -top-1.5 -left-1.5"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-nw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize -top-1.5 -right-1.5"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-ne')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nesw-resize -bottom-1.5 -left-1.5"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-sw')"
      />
      <div
        class="absolute w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize -bottom-1.5 -right-1.5"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'resize-se')"
      />

      <!-- Poignée de rotation -->
      <div
        class="absolute w-6 h-6 bg-green-500 border border-white cursor-grab rounded-full flex items-center justify-center -top-8 left-1/2 transform -translate-x-1/2"
        @mousedown.prevent.stop="emit('interaction', $event, block.id, 'rotate')"
      >
        <RotateCw class="w-3 h-3 text-white" />
      </div>
      
      <!-- Boutons de suppression et verrouillage -->
      <div class="absolute -top-8 -left-1 flex gap-1">
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
import { computed, ref, watch, nextTick } from 'vue';
import { RotateCw } from 'lucide-vue-next';

// --- TYPE DEFINITIONS ---
interface TextBlockData {
  id: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isEditing: boolean;
  fontSize: number;
  locked: boolean;
}

interface CanvasSize {
  width: number;
  height: number;
}

type InteractionType = 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 'rotate';

// --- PROPS ---
const props = defineProps<{
  block: TextBlockData;
  canvasSize: CanvasSize;
  isActive: boolean;
}>();

// --- EMITS ---
const emit = defineEmits<{
  (e: 'requestEdit', id: number): void;
  (e: 'interaction', event: MouseEvent, id: number, action: InteractionType): void;
  (e: 'textChange', id: number, newText: string): void;
  (e: 'textBlur', id: number): void;
  (e: 'element-deleted', id: number): void;
  (e: 'element-updated', update: { id: number, locked: boolean }): void;
}>();

// --- REFS ---
const textareaRef = ref<HTMLTextAreaElement | null>(null);

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

const textStyle = computed(() => {
  if (props.block.isEditing) {
    // En mode édition, utiliser une taille de police fixe pour éviter la boucle de redimensionnement
    // Cette valeur doit correspondre à EDIT_FONT_SIZE dans Canvas.vue
    return {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1,
      color: '#fff',
      overflow: 'hidden',
      pointerEvents: 'auto' as const,
    };
  } else {
    // En mode affichage, la taille de police s'adapte à la hauteur du bloc
    const blockHeightPx = ratioToPixels(props.block.height, 'height');
    const fontSize = Math.max(8, blockHeightPx * 0.8);
    
    return {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1,
      color: '#fff',
      overflow: 'hidden',
      pointerEvents: 'none' as const,
    };
  }
});

// --- HANDLERS ---
const handleTextareaInput = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement;
  const newText = textarea.value;
  
  // Émettre le changement de texte
  emit('textChange', props.block.id, newText);
};

// --- LOGIC ---
// Focus and select text when editing begins
watch(() => props.block.isEditing, async (isEditing) => {
  if (isEditing) {
    await nextTick(); // Wait for the DOM to update
    textareaRef.value?.focus();
    textareaRef.value?.select();
    
    // Initialiser la hauteur du textarea
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto';
      textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
    }
  }
});
</script>

<style scoped>
.cursor-nwse-resize { cursor: nwse-resize; }
.cursor-nesw-resize { cursor: nesw-resize; }
textarea {
  caret-color: #3b82f6;
}
</style>
