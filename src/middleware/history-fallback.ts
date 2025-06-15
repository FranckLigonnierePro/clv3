import { defineEventHandler } from "h3";

export default defineEventHandler((event) => {
  // Si la requête est pour un fichier (comme .js, .css, .png, etc.), on la laisse passer
  if (event.node.req.url?.match(/\.[^/]+$/)) {
    return;
  }

  // Sinon, on renvoie le fichier index.html
  event.node.req.url = "/index.html";
});
