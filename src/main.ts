import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import notifications from "./plugins/notifications";

// Import des styles Tailwind
import "./assets/tailwind.css";

// Initialisation de l'application
const app = createApp(App);

// Utilisation des plugins
app.use(createPinia());
app.use(router);
app.use(notifications);

// Configuration globale
app.config.errorHandler = (err, instance, info) => {
  console.error("Global error:", err);
  // Afficher une notification d'erreur
  if (err instanceof Error) {
    app.config.globalProperties.$notify.error(
      err.message || "Une erreur est survenue",
    );
  } else {
    app.config.globalProperties.$notify.error(
      "Une erreur inattendue est survenue",
    );
  }
};

// Configuration en mode développement
if (import.meta.env.DEV) {
  app.config.performance = true;
}

// Monter l'application
app.mount("#app");

// Exposer l'application pour le débogage
if (import.meta.env.DEV) {
  // @ts-ignore
  window.__APP__ = app;
}
