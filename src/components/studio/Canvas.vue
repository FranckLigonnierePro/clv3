<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
  onBeforeUnmount,
  nextTick,
} from "vue";
import * as PIXI from "pixi.js";

export type CanvasElementType =
  | "camera"
  | "image"
  | "screen"
  | "text"
  | "video"
  | "shape";

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  visible?: boolean;
  locked?: boolean;
  data: {
    stream?: MediaStream;
    src?: string;
    content?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    shape?: "rectangle" | "circle" | "triangle";
    [key: string]: any;
  };
}

const props = withDefaults(
  defineProps<{
    elements: CanvasElement[];
    format: "16:9" | "9:16";
    snapEnabled: boolean;
    isLive?: boolean;
    showGrid?: boolean;
    gridSize?: number;
    gridColor?: string;
    selectedElementId?: string | null;
  }>(),
  {
    showGrid: true,
    gridSize: 20,
    gridColor: "rgba(139, 92, 246, 0.5)",
    isLive: false,
    selectedElementId: null,
  },
);

const emit = defineEmits<{
  (e: "element-update", element: CanvasElement): void;
  (e: "element-edit", element: CanvasElement): void;
  (e: "element-delete", id: string): void;
  (e: "element-select", id: string | null): void;
}>();

// Référence au conteneur parent
const containerRef = ref<HTMLElement | null>(null);

// Réf du canvas HTML réel (sera remplacé par PixiJS)
const canvasRef = ref<HTMLCanvasElement | null>(null);

// PixiJS
let pixiApp: PIXI.Application | null = null;
let pixiCanvas: HTMLCanvasElement | null = null;
// Map id → displayObject Pixi
const pixiObjects = new Map<string, PIXI.DisplayObject>();
// Pour le drag/resize
let dragData: {
  id: string;
  offsetX: number;
  offsetY: number;
  mode: 'drag' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';
} | null = null;


// Stockage des balises vidéo hors DOM pour caméra & screen share
const cameraVideos = ref<Record<string, HTMLVideoElement>>({});
const screenVideos = ref<Record<string, HTMLVideoElement>>({});

// État du glisser-déposer
const isDragging = ref(false);
const draggedElement = ref<CanvasElement | null>(null);
const dragStartX = ref(0);
const dragStartY = ref(0);
const elementStartX = ref(0);
const elementStartY = ref(0);

// Dimensions du canvas
const canvasDimensions = ref({
  width: 800, // Valeur par défaut pour l'AFFICHAGE (CSS)
  height: 450, // 16:9 par défaut
});

// Stocker les dimensions d'origine pour le calcul des pourcentages
const originalDimensions = {
  width: 800,
  height: 450
};

// Met à jour les dimensions du canvas en fonction du conteneur
const updateCanvasSize = () => {
  const padding = 32;
  const screenWidth = window.innerWidth - padding;
  const screenHeight = window.innerHeight - 192 - padding;

  const targetRatio = props.format === "9:16" ? 9 / 16 : 16 / 9;

  let width = screenWidth;
  let height = screenWidth / targetRatio;

  if (height > screenHeight) {
    height = screenHeight;
    width = height * targetRatio;
  }

  // Mettre à jour les dimensions d'origine si c'est le premier chargement
  if (originalDimensions.width === 800 && originalDimensions.height === 450) {
    originalDimensions.width = Math.floor(width);
    originalDimensions.height = Math.floor(height);
  }

  canvasDimensions.value = {
    width: Math.floor(width),
    height: Math.floor(height),
  };

  // Mettre à jour les positions des éléments
  updateElementsPosition();
  
  updatePhysicalCanvas();
  requestAnimationFrame(drawCanvas);
};

// Met à jour les positions des éléments en fonction du redimensionnement
const updateElementsPosition = () => {
  if (!originalDimensions.width || !originalDimensions.height) return;
  
  const widthRatio = canvasDimensions.value.width / originalDimensions.width;
  const heightRatio = canvasDimensions.value.height / originalDimensions.height;
  
  // Mettre à jour chaque élément
  props.elements.forEach(element => {
    element.x = (element.x / originalDimensions.width) * canvasDimensions.value.width;
    element.y = (element.y / originalDimensions.height) * canvasDimensions.value.height;
    element.width = (element.width / originalDimensions.width) * canvasDimensions.value.width;
    element.height = (element.height / originalDimensions.height) * canvasDimensions.value.height;
    
    // Émettre la mise à jour
    emit('element-update', {...element});
  });
  
  // Mettre à jour les dimensions d'origine pour le prochain redimensionnement
  originalDimensions.width = canvasDimensions.value.width;
  originalDimensions.height = canvasDimensions.value.height;
};

// Met à jour le canvas physique avec la bonne résolution
const updatePhysicalCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const { width, height } = canvasDimensions.value;

  // Dimensions physiques (pixels réels)
  const physicalWidth = Math.floor(width * dpr);
  const physicalHeight = Math.floor(height * dpr);

  // NE TOUCHE PAS à la taille physique du canvas PixiJS (fixée à 1920x1080)
  // On ne modifie que le CSS pour l'affichage responsive
  canvas.style.width = `${canvasDimensions.value.width}px`;
  canvas.style.height = `${canvasDimensions.value.height}px`;

  // Pas besoin de rescaler le contexte ici, Pixi gère son propre rendu
};

// Initialise les balises vidéo pour chaque stream unique (camera/screen)
watch(
  () => props.elements,
  (elements) => {
    elements.forEach((el) => {
      if ((el.type === "camera" || el.type === "screen") && el.data?.stream) {
        if (!getVideoElement(el.id)) {
          const v = document.createElement("video");
          v.srcObject = el.data.stream;
          v.autoplay = true;
          v.muted = true;
          v.playsInline = true;
          v.style.display = "none";
          v.play().catch(() => {});
          setVideoElement(el, v);
        }
      }
    });
    // Clean up for removed elements
    cleanupVideoElements(elements);
  },
  { immediate: true, deep: true },
);

function getVideoElement(id: string) {
  return cameraVideos.value[id] || screenVideos.value[id];
}
function setVideoElement(el: CanvasElement, video: HTMLVideoElement) {
  if (el.type === "camera") cameraVideos.value[el.id] = video;
  if (el.type === "screen") screenVideos.value[el.id] = video;
}
function cleanupVideoElements(elements: CanvasElement[]) {
  Object.keys(cameraVideos.value).forEach((id) => {
    if (!elements.find((el) => el.id === id && el.type === "camera")) {
      cameraVideos.value[id]?.pause();
      delete cameraVideos.value[id];
    }
  });
  Object.keys(screenVideos.value).forEach((id) => {
    if (!elements.find((el) => el.id === id && el.type === "screen")) {
      screenVideos.value[id]?.pause();
      delete screenVideos.value[id];
    }
  });
}
onUnmounted(() => cleanupVideoElements([]));

// L'observer de redimensionnement est maintenant géré dans onMounted

// Ne pas surveiller canvasDimensions pour éviter les boucles
// car updateCanvasSize() met à jour canvasDimensions

let renderInterval: number | null = null;

onMounted(() => {
  // Crée l'application PixiJS
  // Canvas physique TOUJOURS en 1920x1080 pour la capture
  pixiApp = new PIXI.Application({
    width: 1920,
    height: 1080,
    backgroundColor: 0x1a1a1a,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  pixiCanvas = pixiApp.view as HTMLCanvasElement;
  // Ajout debug : expose l'instance PixiJS sur le canvas pour Studio.vue
  (pixiCanvas as any).__pixiApp = pixiApp;
  canvasRef.value = pixiCanvas;

  // Ajoute le canvas Pixi dans le container
  if (containerRef.value && pixiCanvas) {
    containerRef.value.innerHTML = "";
    containerRef.value.appendChild(pixiCanvas);
    // Arrondi visuel du canvas
    pixiCanvas.style.borderRadius = "20px";
    pixiCanvas.style.overflow = "hidden";
  }

  // Synchronise la scène Pixi avec les éléments Vue
  function syncPixiScene() {
    if (!pixiApp) return;
    pixiApp.stage.removeChildren();
    pixiObjects.clear();
    // --- Grille de fond ---
    if (props.showGrid) {
      const grid = new PIXI.Graphics();
      const w = canvasDimensions.value.width;
      const h = canvasDimensions.value.height;
      const gridColor = PIXI.utils.string2hex(props.gridColor || "#8b5cf680");
      // 32 colonnes, 18 lignes
      const cols = 32;
      const rows = 18;
      const cellW = w / cols;
      const cellH = h / rows;
      // Points grille
      for (let i = 1; i < cols; i++) { // pas 0 ni cols
        for (let j = 1; j < rows; j++) { // pas 0 ni rows
          const x = i * cellW;
          const y = j * cellH;
          // Point central
          if (i === Math.floor(cols / 2) && j === Math.floor(rows / 2)) {
            grid.beginFill(gridColor, 1);
            grid.drawCircle(x, y, 5);
            grid.endFill();
          } else {
            grid.beginFill(gridColor, 0.7);
            grid.drawCircle(x, y, 2);
            grid.endFill();
          }
        }
      }
      grid.zIndex = -1000;
      pixiApp.stage.addChild(grid);
    }
    // --- Fin grille ---
    props.elements.forEach(element => {
      let obj: PIXI.DisplayObject | null = null;
      let handles: PIXI.Graphics[] = [];
      switch (element.type) {
        case "image":
          if (element.data?.src) {
            obj = PIXI.Sprite.from(element.data.src);
            obj.x = element.x;
            obj.y = element.y;
            (obj as PIXI.Sprite).width = element.width;
            (obj as PIXI.Sprite).height = element.height;
          }
          break;
        case "text":
          if (element.data?.content) {
            obj = new PIXI.Text(element.data.content, {
              fontSize: element.data.fontSize || 24,
              fill: element.data.color || "#ffffff",
              fontFamily: element.data.fontFamily || "Arial",
              align: element.data.textAlign || "center",
            });
            obj.x = element.x;
            obj.y = element.y;
          }
          break;
        case "shape":
          if (element.data?.shape) {
            const g = new PIXI.Graphics();
            g.beginFill(PIXI.utils.string2hex(element.data.color || "#ffffff"));
            if (element.data.shape === "rectangle") {
              g.drawRect(0, 0, element.width, element.height);
            } else if (element.data.shape === "circle") {
              g.drawCircle(element.width / 2, element.height / 2, Math.min(element.width, element.height) / 2);
            }
            g.endFill();
            g.x = element.x;
            g.y = element.y;
            obj = g;
          }
          break;
        case "camera":
        case "screen":
        case "video":
          if (element.data?.stream) {
            // Pour simplifier, on ne gère que la première track vidéo
            const video = document.createElement("video");
            video.srcObject = element.data.stream;
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            video.width = element.width;
            video.height = element.height;
            const tex = PIXI.Texture.from(video);
            const sprite = new PIXI.Sprite(tex);
            sprite.x = element.x;
            sprite.y = element.y;
            sprite.width = element.width;
            sprite.height = element.height;
            obj = sprite;
          }
          break;
      }
      if (obj) {
        // Ajoute l’interactivité Pixi
        obj.eventMode = 'static';
        obj.cursor = 'pointer';
        // Double-clic pour éditer le texte
        if (element.type === 'text') {
          obj.on('pointertap', (event: PIXI.FederatedPointerEvent) => {
            if (event.detail === 2) {
              startTextEdit(element);
            }
          });
        }
        obj.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
          // Calcul du mode (drag ou resize)
          const local = event.getLocalPosition(obj.parent);
          let mode: 'drag' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' = 'drag';
          // 12px carré pour resize
          const hs = 12;
          if (
            local.x >= element.x - hs && local.x <= element.x + hs &&
            local.y >= element.y - hs && local.y <= element.y + hs
          ) mode = 'resize-nw';
          else if (
            local.x >= element.x + element.width - hs && local.x <= element.x + element.width + hs &&
            local.y >= element.y - hs && local.y <= element.y + hs
          ) mode = 'resize-ne';
          else if (
            local.x >= element.x - hs && local.x <= element.x + hs &&
            local.y >= element.y + element.height - hs && local.y <= element.y + element.height + hs
          ) mode = 'resize-sw';
          else if (
            local.x >= element.x + element.width - hs && local.x <= element.x + element.width + hs &&
            local.y >= element.y + element.height - hs && local.y <= element.y + element.height + hs
          ) mode = 'resize-se';
          dragData = {
            id: element.id,
            offsetX: local.x - element.x,
            offsetY: local.y - element.y,
            mode,
          };
          emit('element-select', element.id);
        });
        obj.on('pointerup', () => { dragData = null; });
        obj.on('pointerupoutside', () => { dragData = null; });
        obj.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
          if (!dragData || dragData.id !== element.id) return;
          const local = event.getLocalPosition(obj.parent);
          let newX = element.x, newY = element.y, newW = element.width, newH = element.height;
          if (dragData.mode === 'drag') {
            newX = local.x - dragData.offsetX;
            newY = local.y - dragData.offsetY;
          } else {
            // Resize selon la poignée
            if (dragData.mode === 'resize-nw') {
              newW = element.width + (element.x - local.x);
              newH = element.height + (element.y - local.y);
              newX = local.x;
              newY = local.y;
            } else if (dragData.mode === 'resize-ne') {
              newW = local.x - element.x;
              newH = element.height + (element.y - local.y);
              newY = local.y;
            } else if (dragData.mode === 'resize-sw') {
              newW = element.width + (element.x - local.x);
              newX = local.x;
              newH = local.y - element.y;
            } else if (dragData.mode === 'resize-se') {
              newW = local.x - element.x;
              newH = local.y - element.y;
            }
            newW = Math.max(newW, 20);
            newH = Math.max(newH, 20);
          }
          // Mets à jour le modèle Vue (et donc la scène)
          emit('element-update', { ...element, x: newX, y: newY, width: newW, height: newH });
        });
        pixiApp.stage.addChild(obj);
        pixiObjects.set(element.id, obj);
        // Affiche les poignées si sélectionné
        if (props.selectedElementId === element.id) {
          const handleSize = 12;
          const handleColor = 0x3b82f6;
          const handleStroke = 0xffffff;
          const corners = [
            [element.x, element.y],
            [element.x + element.width, element.y],
            [element.x + element.width, element.y + element.height],
            [element.x, element.y + element.height],
          ];
          for (const [hx, hy] of corners) {
            const g = new PIXI.Graphics();
            g.lineStyle(2, handleStroke);
            g.beginFill(handleColor);
            g.drawRect(-handleSize/2, -handleSize/2, handleSize, handleSize);
            g.endFill();
            g.x = hx;
            g.y = hy;
            g.zIndex = 1000;
            pixiApp.stage.addChild(g);
            handles.push(g);
          }
        }
      }
    });
  }

  // Sync initial et sur changement d’éléments
  syncPixiScene();
  watch(() => props.elements, (newElements, oldElements) => {
    // Détecte ajout d’un nouvel élément
    if (props.snapEnabled && oldElements && newElements.length > oldElements.length) {
      const added = newElements.find(e => !oldElements.some(o => o.id === e.id));
      if (added) {
        // Snap la position à la grille
        const w = canvasDimensions.value.width;
        const h = canvasDimensions.value.height;
        const cols = 32;
        const rows = 18;
        const cellW = w / cols;
        const cellH = h / rows;
        const snappedX = Math.round(added.x / cellW) * cellW;
        const snappedY = Math.round(added.y / cellH) * cellH;
        if (snappedX !== added.x || snappedY !== added.y) {
          emit('element-update', { ...added, x: snappedX, y: snappedY });
        }
      }
    }
    syncPixiScene();
  }, { deep: true });
  // Réagit à l'affichage de la grille et à l'aimantation
  watch(() => props.showGrid, syncPixiScene);
  watch(() => props.snapEnabled, () => {/* rien à faire ici côté rendu, mais permet de forcer le drag snap */});

  // Resize PixiJS sur resize
  function handleResize() {
    updateCanvasSize(); // met à jour canvasDimensions (et donc la taille du Pixi renderer)
    if (!pixiApp) return;
    pixiApp.renderer.resize(canvasDimensions.value.width, canvasDimensions.value.height);
    syncPixiScene();
  }
  window.addEventListener("resize", handleResize);

  onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
    if (pixiApp) {
      pixiApp.destroy(true, { children: true });
      pixiApp = null;
      pixiCanvas = null;
    }
    pixiObjects.clear();
    dragData = null;
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateCanvasSize);
});

onUnmounted(() => {
  // Arrêter la boucle de rendu
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  // Nettoyer les ressources vidéo
  cleanupVideoElements([]);
});

// Dessin du canvas à chaque frame
let animationFrame: number;

// Fonction pour dessiner la grille avec des points aux intersections
const drawGrid = (ctx: CanvasRenderingContext2D) => {
  if (!props.showGrid) return;
  
  const { width, height } = canvasDimensions.value;
  
  // Nombre fixe de cellules (32x18)
  const cellCountX = 32; // Largeur en cellules
  const cellCountY = 18; // Hauteur en cellules
  
  // Calculer la taille des cellules pour s'adapter au canvas
  const cellWidth = width / cellCountX;
  const cellHeight = height / cellCountY;
  
  // Style des points de grille
  ctx.fillStyle = props.gridColor || 'rgba(139, 92, 246, 0.5)'; // Violet avec 50% d'opacité
  const pointSize = 1.5; // Taille des points
  
  // Dessiner des points à chaque intersection de la grille
  for (let x = 0; x <= cellCountX; x++) {
    for (let y = 0; y <= cellCountY; y++) {
      // Ne pas dessiner de point sur le contour extérieur
      if (x > 0 && x < cellCountX && y > 0 && y < cellCountY) {
        const posX = x * cellWidth;
        const posY = y * cellHeight;
        
        ctx.beginPath();
        ctx.arc(posX, posY, pointSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // Dessiner un point rouge plus visible au centre de la grille
  const centerX = (cellCountX / 2) * cellWidth;
  const centerY = (cellCountY / 2) * cellHeight;
  
  ctx.fillStyle = 'rgba(139, 92, 246, 1)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
  ctx.fill();
};

function drawCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Mettre à jour la taille du canvas si nécessaire
  const { width, height } = canvasDimensions.value;
  const dpr = window.devicePixelRatio || 1;

  // Dimensions physiques (pixels réels)
  const physicalWidth = Math.floor(width * dpr);
  const physicalHeight = Math.floor(height * dpr);

  // Mettre à jour les dimensions du canvas
  if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
    canvas.width = physicalWidth;
    canvas.height = physicalHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
  }

  // Sauvegarder l'état du contexte
  ctx.save();

  // Effacer le canvas
  ctx.clearRect(0, 0, width, height);

  // Dessiner un fond noir
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height);

  // Dessiner la grille si activée
  drawGrid(ctx);

  // Restaurer l'état du contexte
  ctx.restore();

  props.elements.forEach((element) => {
    ctx.save();
    ctx.translate(
      element.x + element.width / 2,
      element.y + element.height / 2,
    );
    // Rotation (optionnelle)
    // ctx.rotate((element.rotation || 0) * Math.PI/180)

    switch (element.type) {
      case "camera": {
        const v = cameraVideos.value[element.id];
        if (v && v.readyState >= 2) {
          ctx.drawImage(
            v,
            -element.width / 2,
            -element.height / 2,
            element.width,
            element.height,
          );
        }
        break;
      }
      case "screen": {
        const v = screenVideos.value[element.id];
        if (v && v.readyState >= 2) {
          ctx.drawImage(
            v,
            -element.width / 2,
            -element.height / 2,
            element.width,
            element.height,
          );
        }
        break;
      }
      case "image": {
        if (element.data?.src) {
          // Essayer de dessiner l'image directement depuis le cache
          if (element.data._img) {
            // Utiliser l'image déjà chargée
            ctx.drawImage(
              element.data._img,
              -element.width / 2,
              -element.height / 2,
              element.width,
              element.height,
            );
          } else {
            // Fallback: charger l'image normalement
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = element.data.src;
            if (img.complete) {
              ctx.drawImage(
                img,
                -element.width / 2,
                -element.height / 2,
                element.width,
                element.height,
              );
            }
          }

          // Dessiner le contour et les poignées de redimensionnement si l'élément est sélectionné
          if (props.selectedElementId === element.id) {
            // Sauvegarder le contexte
            ctx.save();
            
            // Contour bleu autour de l'image
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(
              -element.width / 2 - 2,
              -element.height / 2 - 2,
              element.width + 4,
              element.height + 4
            );
            
            // Réinitialiser le style de ligne
            ctx.setLineDash([]);
            
            // Taille des poignées de redimensionnement
            const handleSize = 8;
            const halfHandle = handleSize / 2;
            
            // Couleur des poignées
            ctx.fillStyle = "#3b82f6";
            ctx.strokeStyle = "white";
            
            // Coordonnées des coins
            const left = -element.width / 2;
            const right = element.width / 2;
            const top = -element.height / 2;
            const bottom = element.height / 2;
            
            // Dessiner les poignées aux 4 coins
            const drawHandle = (x: number, y: number) => {
              ctx.beginPath();
              ctx.rect(x - halfHandle, y - halfHandle, handleSize, handleSize);
              ctx.fill();
              ctx.stroke();
            };
            
            // Coin supérieur gauche
            drawHandle(left, top);
            // Coin supérieur droit
            drawHandle(right, top);
            // Coin inférieur droit
            drawHandle(right, bottom);
            // Coin inférieur gauche
            drawHandle(left, bottom);
            
            // Restaurer le contexte
            ctx.restore();
          }
        }
        break;
      }
      case "text": {
      // Calculer les dimensions de la grille
      const cellCountX = 32; // Largeur en cellules
      const cellCountY = 18; // Hauteur en cellules
      const cellWidth = canvasDimensions.value.width / cellCountX;
      const cellHeight = canvasDimensions.value.height / cellCountY;

      // Dimensions imposées à 6 colonnes par 2 lignes
      const gridWidth = 6 * cellWidth;
      const gridHeight = 2 * cellHeight;
      const gridX = -gridWidth / 2;
      const gridY = -gridHeight / 2;

      // Mettre à jour la taille de l'élément
      element.width = gridWidth;
      element.height = gridHeight;

      // Dessiner le contour principal avec un effet d'ombre
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        gridX - 1,
        gridY - 1,
        gridWidth + 2,
        gridHeight + 2
      );

  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(
    gridX,
    gridY,
    gridWidth,
    gridHeight
  );

  // Grille intérieure (pointillés)
  ctx.setLineDash([2, 2]);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;

  // Lignes verticales (entre les 6 colonnes)
  for (let x = 1; x < 6; x++) {
    ctx.beginPath();
    ctx.moveTo(gridX + x * cellWidth, gridY);
    ctx.lineTo(gridX + x * cellWidth, gridY + gridHeight);
    ctx.stroke();
  }

  // Lignes horizontales (entre les 2 lignes)
  for (let y = 1; y < 2; y++) {
    ctx.beginPath();
    ctx.moveTo(gridX, gridY + y * cellHeight);
    ctx.lineTo(gridX + gridWidth, gridY + y * cellHeight);
    ctx.stroke();
  }

  ctx.restore();

  // Texte centré
  ctx.save();
  ctx.fillStyle = element.data?.color || "white";
  ctx.font = `${element.data?.fontSize || 24}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    element.data?.content || "",
    0, // centré avec translate
    0,
    gridWidth * 0.9 // légère marge intérieure
  );
  ctx.restore();
  break;
}
    }
    ctx.restore();
  });

  // Désormais, la boucle de rendu est assurée par setInterval (30 fps) partout
// animationFrame = requestAnimationFrame(drawCanvas);
}

// État pour l'édition de texte
const editingText = ref<{
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  fontSize: number;
} | null>(null);

// Démarrer l'édition de texte
function startTextEdit(element: CanvasElement) {
  if (element.type !== 'text') return;
  
  editingText.value = {
    elementId: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    content: element.data?.content || '',
    color: element.data?.color || '#ffffff',
    fontSize: element.data?.fontSize || 24,
  };
  
  // Mettre le focus sur l'input après un court délai pour s'assurer qu'il est rendu
  nextTick(() => {
    const input = document.getElementById('text-edit-input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
}

// Références pour le redimensionnement
const isResizing = ref(false);
const resizeHandle = ref<'' | 'nw' | 'ne' | 'sw' | 'se'>('');
const elementStartWidth = ref(0);
const elementStartHeight = ref(0);

// Taille minimale d'un élément (en pixels)
const minElementSize = 20;

// Vérifie si le point (x, y) est dans une poignée de redimensionnement
function isInResizeHandle(element: CanvasElement, x: number, y: number, handle: string): boolean {
  const halfHandle = 8 / 2;
  
  // Coordonnées des coins de l'élément
  const left = element.x;
  const right = element.x + element.width;
  const top = element.y;
  const bottom = element.y + element.height;
  
  // Vérifier chaque coin
  if (handle === 'nw') {
    return x >= left - halfHandle && x <= left + halfHandle && 
           y >= top - halfHandle && y <= top + halfHandle;
  } else if (handle === 'ne') {
    return x >= right - halfHandle && x <= right + halfHandle && 
           y >= top - halfHandle && y <= top + halfHandle;
  } else if (handle === 'sw') {
    return x >= left - halfHandle && x <= left + halfHandle && 
           y >= bottom - halfHandle && y <= bottom + halfHandle;
  } else if (handle === 'se') {
    return x >= right - halfHandle && x <= right + halfHandle && 
           y >= bottom - halfHandle && y <= bottom + halfHandle;
  }
  return false;
}



// Gestion des événements de souris
function handleMouseDown(e: MouseEvent) {
  if (!canvasRef.value) return;

  // Si on est en mode édition, on ne fait rien
  if (editingText.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  // Conversion coordonnées souris (affichage) -> base 1920x1080 (canvas physique)
  const x = ((e.clientX - rect.left) / rect.width) * 1920;
  const y = ((e.clientY - rect.top) / rect.height) * 1080;

  // Vérifier si on a cliqué sur un élément
  for (let i = props.elements.length - 1; i >= 0; i--) {
    const el = props.elements[i];
    if (el.locked) continue;

    // Vérifier si on a cliqué sur une poignée de redimensionnement
    if (props.selectedElementId === el.id) {
      const handles: Array<'nw' | 'ne' | 'sw' | 'se'> = ['nw', 'ne', 'sw', 'se'];
      for (const handle of handles) {
        if (isInResizeHandle(el, x, y, handle)) {
          isResizing.value = true;
          resizeHandle.value = handle;
          draggedElement.value = { ...el };
          dragStartX.value = x;
          dragStartY.value = y;
          elementStartX.value = el.x;
          elementStartY.value = el.y;
          elementStartWidth.value = el.width;
          elementStartHeight.value = el.height;
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
          return;
        }
      }
    }

    // Vérifier si on a cliqué sur l'élément lui-même
    if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
      isDragging.value = true;
      draggedElement.value = { ...el };
      dragStartX.value = x;
      dragStartY.value = y;
      elementStartX.value = el.x;
      elementStartY.value = el.y;
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      emit('element-select', el.id);
      if (e.detail === 2 && el.type === 'text') {
        startTextEdit(el);
      }
      break;
    }
  }

  // Si on a cliqué en dehors de tout élément, on désélectionne
  if (!isDragging.value && !isResizing.value) {
    emit('element-select', null);
  }
}


function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value && !isResizing.value) return;
  if (!canvasRef.value || !draggedElement.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  // Conversion coordonnées souris (affichage) -> base 1920x1080 (canvas physique)
  const x = ((e.clientX - rect.left) / rect.width) * 1920;
  const y = ((e.clientY - rect.top) / rect.height) * 1080;

  const dx = x - dragStartX.value;
  const dy = y - dragStartY.value;
  const element = { ...draggedElement.value };
  const cellCountX = 64;
  const cellCountY = 36;
  const cellWidth = 1920 / cellCountX;
  const cellHeight = 1080 / cellCountY;

  if (isResizing.value) {
    // Logique de redimensionnement
    const aspectRatio = element.data?.aspectRatio || 1;
    const deltaX = x - dragStartX.value;
    switch (resizeHandle.value) {
      case 'nw':
        element.width = Math.max(minElementSize, elementStartWidth.value - deltaX);
        element.height = element.width / aspectRatio;
        element.x = elementStartX.value + (elementStartWidth.value - element.width);
        element.y = elementStartY.value + (elementStartHeight.value - element.height);
        break;
      case 'ne':
        element.width = Math.max(minElementSize, elementStartWidth.value + deltaX);
        element.height = element.width / aspectRatio;
        element.y = elementStartY.value + (elementStartHeight.value - element.height);
        break;
      case 'sw':
        element.width = Math.max(minElementSize, elementStartWidth.value - deltaX);
        element.height = element.width / aspectRatio;
        element.x = elementStartX.value + (elementStartWidth.value - element.width);
        break;
      case 'se':
        element.width = Math.max(minElementSize, elementStartWidth.value + deltaX);
        element.height = element.width / aspectRatio;
        break;
    }
  } else {
    // Logique de déplacement
    let newX = elementStartX.value + dx;
    let newY = elementStartY.value + dy;
    if (props.snapEnabled) {
      if (element.type === 'text') {
        const halfWidth = element.width / 2;
        const halfHeight = element.height / 2;
        const centerX = Math.round((newX + halfWidth) / cellWidth) * cellWidth;
        const centerY = Math.round((newY + halfHeight) / cellHeight) * cellHeight;
        element.x = centerX - halfWidth;
        element.y = centerY - halfHeight;
      } else {
        element.x = Math.round(newX / cellWidth) * cellWidth;
        element.y = Math.round(newY / cellHeight) * cellHeight;
      }
    } else {
      element.x = newX;
      element.y = newY;
    }
    // S'assurer que l'élément reste dans les limites du canvas physique 1920x1080
    const boundedX = Math.max(0, Math.min(element.x, 1920 - (element.width || 0)));
    const boundedY = Math.max(0, Math.min(element.y, 1080 - (element.height || 0)));
    element.x = boundedX;
    element.y = boundedY;
  }
  emit('element-update', element);
}

function handleMouseUp() {
  if (isDragging.value || isResizing.value) {
    isDragging.value = false;
    isResizing.value = false;
    resizeHandle.value = '';
    draggedElement.value = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }
}


function handleTouchStart(e: TouchEvent) {
  // ...
  if (isDragging.value || isResizing.value) {
    window.addEventListener('touchend', handleTouchEnd);
  }
  // ...
}

function handleTouchEnd(e: TouchEvent) {
  e.preventDefault();
  if (isDragging.value || isResizing.value) {
    isDragging.value = false;
    isResizing.value = false;
    resizeHandle.value = '';
    // Retire l'écouteur touchend global
    window.removeEventListener('touchend', handleTouchEnd);
    // Réinitialiser les références de redimensionnement
    if (draggedElement.value) {
      // Mettre à jour l'élément final si nécessaire
      emit('element-update', draggedElement.value);
      draggedElement.value = null;
  const touch = e.touches[0];
  const rect = canvasRef.value.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  // Convertir les coordonnées touch en base 1920x1080
  const canvasWidth = canvasDimensions.value.width;
  const canvasHeight = canvasDimensions.value.height;
  const xInCanvas = (x / canvasWidth) * 1920;
  const yInCanvas = (y / canvasHeight) * 1080;
  
  const dx = xInCanvas - dragStartX.value;
  const dy = yInCanvas - dragStartY.value;

  // Créer une copie de l'élément déplacé
  const element = { ...draggedElement.value };

  // Définir les dimensions de la grille sur la base 1920x1080
  const cellCountX = 64;
  const cellCountY = 36;
  const cellWidth = 1920 / cellCountX;
  const cellHeight = 1080 / cellCountY;

  if (isResizing.value) {
    // Logique de redimensionnement
    const aspectRatio = element.data?.aspectRatio || 1;
    const deltaX = xInCanvas - dragStartX.value;

    switch (resizeHandle.value) {
      case 'nw':
        element.width = Math.max(minElementSize, elementStartWidth.value - deltaX);
        element.height = element.width / aspectRatio;
        element.x = elementStartX.value + (elementStartWidth.value - element.width);
        element.y = elementStartY.value + (elementStartHeight.value - element.height);
        break;
      case 'ne':
        element.width = Math.max(minElementSize, elementStartWidth.value + deltaX);
        element.height = element.width / aspectRatio;
        element.y = elementStartY.value + (elementStartHeight.value - element.height);
        break;
      case 'sw':
        element.width = Math.max(minElementSize, elementStartWidth.value - deltaX);
        element.height = element.width / aspectRatio;
        element.x = elementStartX.value + (elementStartWidth.value - element.width);
        break;
      case 'se':
        element.width = Math.max(minElementSize, elementStartWidth.value + deltaX);
        element.height = element.width / aspectRatio;
        break;
    }
  } else {
    // Logique de déplacement
    let newX = elementStartX.value + dx;
    let newY = elementStartY.value + dy;

    // Si le snap est activé, aligner sur la grille
    if (props.snapEnabled) {
      if (element.type === 'text') {
        const halfWidth = element.width / 2;
        const halfHeight = element.height / 2;
        const centerX = Math.round((newX + halfWidth) / cellWidth) * cellWidth;
        const centerY = Math.round((newY + halfHeight) / cellHeight) * cellHeight;
        element.x = centerX - halfWidth;
        element.y = centerY - halfHeight;
      } else {
        element.x = Math.round(newX / cellWidth) * cellWidth;
        element.y = Math.round(newY / cellHeight) * cellHeight;
      }
    } else {
      element.x = newX;
      element.y = newY;
    }

    // S'assurer que l'élément reste dans les limites du canvas physique 1920x1080
    const boundedX = Math.max(0, Math.min(element.x, 1920 - (element.width || 0)));
    const boundedY = Math.max(0, Math.min(element.y, 1080 - (element.height || 0)));
    element.x = boundedX;
    element.y = boundedY;
  }

  // Émettre la mise à jour
  emit('element-update', element);
  e.preventDefault();
}}};

// ...



// Les types sont maintenant définis dans les interfaces en haut du fichier

// Expose la méthode getCanvas (pour .captureStream())
defineExpose({
  getCanvas: () => pixiCanvas,
});


</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full h-full flex items-center justify-center"
  >
    <!-- Canvas principal -->
    <canvas
      ref="canvasRef"
      class="bg-black rounded-2xl shadow-sm block"
      :style="{
        width: `${canvasDimensions.width}px`,
        height: `${canvasDimensions.height}px`,
        cursor: 'default',
        touchAction: 'none',
      }"
      style="pointer-events: none;"
    ></canvas>

    <!-- Éditeur de texte -->
    <div
      v-if="editingText"
      class="absolute z-10"
      :style="{
        left: `${editingText.x}px`,
        top: `${editingText.y}px`,
        zIndex: 10,
      }"
    >
      <div
        class="flex flex-col bg-gray-800 p-2 rounded shadow-lg"
        style="min-width: 200px"
      >
        <input
          id="text-edit-input"
          v-model="editingText.content"
          type="text"
          class="bg-gray-700 text-white px-2 py-1 rounded mb-2"
          @keyup.enter="saveTextEdit"
          @keyup.esc="cancelTextEdit"
        />
        <div class="flex items-center space-x-2 mb-2">
          <input
            v-model.number="editingText.fontSize"
            type="number"
            min="8"
            max="200"
            class="w-16 bg-gray-700 text-white px-1 py-1 rounded text-center"
          />
          <input
            v-model="editingText.color"
            type="color"
            class="h-8 w-8 cursor-pointer"
          />
        </div>
        <div class="flex justify-between items-center">
          <button
            @click.stop="handleDeleteElement(editingText.elementId)"
            class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded text-white"
            title="Supprimer l'élément"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <div class="space-x-2">
            <button
              @click.stop="cancelTextEdit"
              class="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Annuler
            </button>
            <button
              @click.stop="saveTextEdit"
              class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
            >
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
