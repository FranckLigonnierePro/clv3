<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, defineEmits, computed } from 'vue'

// --- EMITS ---
const emit = defineEmits(['element-updated'])

// --- PROPS ---
const props = defineProps<{
  elements: Array<{
    id: string,
    type: string,
    text?: string,
    x?: number,
    y?: number,
    style?: any
  }>,
  showGrid: boolean,
  snapEnabled?: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Gère quel champ est en édition (id)
const editingId = ref<string | null>(null)
const editingValue = ref('')
const editingTextareaRefs = reactive<{ [id: string]: HTMLTextAreaElement | null }>({});
const readonlyTextareaRefs = reactive<{ [id: string]: HTMLTextAreaElement | null }>({});
function setEditingTextareaRef(id: string) {
  return (el: HTMLTextAreaElement | null) => { editingTextareaRefs[id] = el; };
}
function setReadonlyTextareaRef(id: string) {
  return (el: HTMLTextAreaElement | null) => { readonlyTextareaRefs[id] = el; };
}

// Drag & drop state
const draggingId = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

// Paramètres grille (doivent matcher drawGrid)
// Grille : 32 colonnes = 32 cellules, 33 lignes tracées (0..32), spacing = width / 32
const GRID_COLS = 32;
const GRID_ROWS = 18;
function getGridSpacingX() {
  const canvas = canvasRef.value;
  if (!canvas) return 0;
  // spacingX = largeur d'une cellule de grille (identique à drawGrid)
  return canvas.width / GRID_COLS;
}
function getGridSpacingY() {
  const canvas = canvasRef.value;
  if (!canvas) return 0;
  // spacingY = hauteur d'une cellule de grille (identique à drawGrid)
  return canvas.height / GRID_ROWS;
}
function snapToGrid(ratioX: number, ratioY: number) {
  // Snap sur les indices de grille (en ratio)
  const snapX = Math.round(ratioX * GRID_COLS) / GRID_COLS;
  const snapY = Math.round(ratioY * GRID_ROWS) / GRID_ROWS;
  return { x: snapX, y: snapY };
}

// Taille du canvas réactive
const canvasSize = ref({ width: 1920, height: 1080 })

// Fonction utilitaire pour le style responsive des inputs
function getCanvasScale() {
  const canvas = canvasRef.value;
  if (!canvas) return { scaleX: 1, scaleY: 1 };
  return {
    scaleX: canvas.offsetWidth / canvas.width,
    scaleY: canvas.offsetHeight / canvas.height
  };
}

function inputStyle(el: any) {
  // Utilise le scale réel du canvas
  const { scaleX, scaleY } = getCanvasScale();
  // pos.x et pos.y sont maintenant des ratios (0..1)
  const pos = localPositions[el.id] ?? { x: el.x ?? 0, y: el.y ?? 0 };
  const canvas = canvasRef.value;
  const px = canvas ? pos.x * canvas.width * scaleX : 0;
  const py = canvas ? pos.y * canvas.height * scaleY : 0;
  const fontSize = (el.style?.fontSize || 24) * scaleY;
  const lineHeight = 1.2;
  const minLineHeight = fontSize * lineHeight;
  const style: any = {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    transform: `translate(${px}px, ${py}px)`,
    fontSize: fontSize + 'px',
    fontFamily: el.style?.fontFamily || 'Arial',
    color: el.style?.fill ? `#${(+el.style.fill).toString(16).padStart(6, '0')}` : '#fff',
    background: 'red',
    zIndex: draggingId.value === el.id ? 20 : 10,
    cursor: editingId.value || draggingId.value ? 'move' : 'pointer',
    padding: '2px 4px',
    minWidth: (120 * scaleX) + 'px',
    boxSizing: 'border-box' as const,
    userSelect: editingId.value === el.id ? 'auto' : 'none',
    pointerEvents: 'auto',
    opacity: draggingId.value === el.id ? 0.7 : 1,
    resize: 'none',
    whiteSpace: 'pre', // pas de retour auto
    // overflowX supprimé
    overflowY: 'hidden',
    lineHeight: lineHeight,
  };
  return style;
}

// Gestion des positions locales pour drag fluide
import { reactive } from 'vue'
const localPositions = reactive<{ [id: string]: { x: number, y: number } }>({})

// drawElements n'est plus nécessaire, on utilise props.elements directement

watch(editingValue, () => {
  if (editingId.value && editingTextareaRefs[editingId.value]) {
    autoResizeAnyTextarea({ value: editingTextareaRefs[editingId.value] }, editingValue.value);
  }
});

// Auto-resize de tous les textarea readonly à chaque changement de texte
watch(() => props.elements.map(e => e.text), () => {
  nextTick(() => {
    for (const el of props.elements) {
      if (readonlyTextareaRefs[el.id]) {
        autoResizeAnyTextarea({ value: readonlyTextareaRefs[el.id] }, el.text ?? 'nouveau texte', el);
      }
    }
  });
});

// Synchronise les positions locales si les props changent hors drag
watch(() => props.elements.map(e => ({ id: e.id, x: e.x, y: e.y })), (newEls) => {
  for (const { id, x, y } of newEls) {
    if (!draggingId.value || draggingId.value !== id) {
      // Si la prop est égale à la locale, on flush
      if (localPositions[id] && localPositions[id].x === (x ?? 0) && localPositions[id].y === (y ?? 0)) {
        delete localPositions[id];
      } else {
        localPositions[id] = { x: x ?? 0, y: y ?? 0 };
      }
    }
  }
}, { immediate: true, deep: true })

function autoResizeAnyTextarea(refEl: any, value: string, el?: any) {
  nextTick(() => {
    const ta = refEl.value;
    if (ta) {
      // Largeur dynamique
      if (!document.getElementById('textarea-measure-span')) {
        const span = document.createElement('span');
        span.id = 'textarea-measure-span';
        span.style.visibility = 'hidden';
        span.style.position = 'fixed';
        span.style.whiteSpace = 'pre';
        span.style.fontFamily = ta.style.fontFamily;
        span.style.fontSize = ta.style.fontSize;
        document.body.appendChild(span);
      }
      const span = document.getElementById('textarea-measure-span')!;
      span.textContent = value || ta.placeholder || '';
      span.style.fontFamily = ta.style.fontFamily;
      span.style.fontSize = ta.style.fontSize;
      ta.style.width = (span.offsetWidth + 8) + 'px'; // padding
      // Hauteur dynamique si retour à la ligne
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  });
}

function enableEdit(id: string) {
  editingId.value = id;
  // Initialise la valeur locale avec le texte courant
  const el = props.elements.find((item: any) => item.id === id);
  editingValue.value = el?.text ?? 'nouveau texte';
  nextTick(() => {
    // focus sur le textarea éditable
    if (editingTextareaRefs[id]) editingTextareaRefs[id].focus();
    if (editingTextareaRefs[id]) autoResizeAnyTextarea({ value: editingTextareaRefs[id] }, editingValue.value, el);
  })
}

function onInputMouseDown(e: MouseEvent, el: any) {
  if (editingId.value === el.id) return; // Pas de drag en édition
  draggingId.value = el.id;
  const { scaleX, scaleY } = getCanvasScale();
  const canvas = canvasRef.value;
  const startX = e.clientX;
  const startY = e.clientY;
  // pos.x et pos.y sont des ratios (0..1)
  const pos = localPositions[el.id] ?? { x: el.x ?? 0, y: el.y ?? 0 };
  dragOffset.value = {
    x: startX - (canvas ? pos.x * canvas.width * scaleX : 0),
    y: startY - (canvas ? pos.y * canvas.height * scaleY : 0),
  };
  if (!localPositions[el.id]) {
    localPositions[el.id] = { x: el.x ?? 0, y: el.y ?? 0 }
  }
  window.addEventListener('mousemove', onInputMouseMove);
  window.addEventListener('mouseup', onInputMouseUp);
}

function onInputMouseMove(e: MouseEvent) {
  if (!draggingId.value) return;
  const id = draggingId.value;
  const startX = e.clientX;
  const startY = e.clientY;
  const { scaleX, scaleY } = getCanvasScale();
  const canvas = canvasRef.value;
  const offset = dragOffset.value;
  // Conversion coordonnées souris → ratio canvas
  let px = (startX - offset.x) / scaleX;
  let py = (startY - offset.y) / scaleY;
  let newX = canvas ? px / canvas.width : 0;
  let newY = canvas ? py / canvas.height : 0;
  // Snap temps réel si activé
  if (props.snapEnabled !== false && canvas) {
    const snapped = snapToGrid(newX, newY);
    newX = snapped.x;
    newY = snapped.y;
  }
  localPositions[id] = { x: newX, y: newY };
}

function onInputMouseUp() {
  if (!draggingId.value) return;
  const id = draggingId.value;
  let pos = localPositions[id];
  draggingId.value = null;
  dragOffset.value = { x: 0, y: 0 };
  if (pos) {
    let finalPos = pos;
    if (props.snapEnabled) {
      finalPos = snapToGrid(pos.x, pos.y);
    }
    localPositions[id] = { ...finalPos };
    emit('element-updated', { id, x: finalPos.x, y: finalPos.y });
  }
}

function onBlur(el: any) {
  if (editingId.value === el.id) {
    emit('element-updated', { id: el.id, text: editingValue.value });
    editingId.value = null;
    editingValue.value = '';
  }
}

function onEnter(el: any) {
  if (editingId.value === el.id) {
    emit('element-updated', { id: el.id, text: editingValue.value });
    editingId.value = null;
    editingValue.value = '';
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  const cols = GRID_COLS;
  const rows = GRID_ROWS;
  // spacingX = largeur d'une cellule, spacingY = hauteur d'une cellule
  const spacingX = width / cols;
  const spacingY = height / rows;
  // Lignes verticales (i = 0..cols inclus, donc 33 lignes pour 32 cellules)
  for (let i = 0; i <= cols; i++) {
    const x = Math.round(i * spacingX)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  // Lignes horizontales (j = 0..rows inclus, donc 19 lignes pour 18 cellules)
  for (let j = 0; j <= rows; j++) {
    const y = Math.round(j * spacingY)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (props.showGrid) drawGrid(ctx, canvas.width, canvas.height)
}

watch(() => [props.elements, props.showGrid], drawCanvas, { immediate: true, deep: true })

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => {
    const updateCanvasSize = () => {
      const container = containerRef.value;
      const canvas = canvasRef.value;
      if (container && canvas) {
        const rect = container.getBoundingClientRect();
        // arrondir pour éviter les valeurs flottantes
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        canvas.width = width;
        canvas.height = height;
        canvasSize.value = { width, height };
        drawCanvas();
      }
    }
    updateCanvasSize();
    resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value);
    }
    window.addEventListener('resize', updateCanvasSize);
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', drawCanvas)
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value);
  resizeObserver = null;
})

</script>

<template>
  <div ref="containerRef" class="aspect-[16/9] max-w-full max-h-full bg-indigo-500 rounded-2xl shadow-xl relative">
    <canvas
      ref="canvasRef"
      :width="canvasSize.width"
      :height="canvasSize.height"
      class="w-full h-full block rounded-2xl"
      style="cursor: pointer;"
    ></canvas>
    <template v-for="el in props.elements" :key="el.id">
      <textarea
        v-if="el.type === 'text' && editingId === el.id"
        v-model="editingValue"
        :ref="setEditingTextareaRef(el.id)"
        :autofocus="true"
        :tabindex="0"
        :rows="1"
        :wrap="'off'"
        :style="inputStyle(el)"
        @blur="onBlur(el)"
        @keydown.ctrl.enter="onEnter(el)"
        @mousedown.prevent="e => { if (editingId !== el.id) onInputMouseDown(e, el) }"
        :data-el-id="el.id"
      />
      <textarea
        v-else-if="el.type === 'text'"
        :value="el.text ?? 'nouveau texte'"
        :ref="setReadonlyTextareaRef(el.id)"
        readonly
        :tabindex="-1"
        :rows="1"
        :wrap="'off'"
        :style="inputStyle(el)"
        @dblclick="enableEdit(el.id)"
        @focus="e => { const t = e.target as HTMLTextAreaElement | null; if (t && editingId !== el.id) t.blur() }"
        @mousedown.prevent="e => { if (editingId !== el.id) onInputMouseDown(e, el) }"
        :data-el-id="el.id"
      />
    </template>
  </div>
</template>
