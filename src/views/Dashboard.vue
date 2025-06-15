<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import {
  Plus,
  Edit3,
  Trash2,
  Video,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/supabase";
import { useNotifications } from "@/stores/notifications";

// Types
type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
};

const router = useRouter();
const authStore = useAuthStore();
const notifications = useNotifications();

// États
const loading = ref(true);
const projects = ref<Project[]>([]);
const unsubscribe = ref<() => void>();

// Nettoyer l'abonnement lors du démontage du composant
onBeforeUnmount(() => {
  if (unsubscribe.value) {
    unsubscribe.value();
  }
});

// Vérifier si l'utilisateur est connecté
const isAuthenticated = computed(() => {
  return !!authStore.user && !!authStore.session;
});

// Récupérer les projets de l'utilisateur
const fetchProjects = async () => {
  try {
    loading.value = true;

    if (!authStore.user?.id) {
      console.error("Aucun utilisateur connecté");
      router.push({ name: "login" });
      return;
    }

    // Récupérer les projets initiaux
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", authStore.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    projects.value = data || [];

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel("projects_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `user_id=eq.${authStore.user.id}`,
        },
        (payload) => {
          console.log("Changement détecté:", payload);
          if (payload.eventType === "INSERT") {
            projects.value = [payload.new as Project, ...projects.value];
          } else if (payload.eventType === "UPDATE") {
            projects.value = projects.value.map((project) =>
              project.id === payload.new.id
                ? (payload.new as Project)
                : project,
            );
          } else if (payload.eventType === "DELETE") {
            projects.value = projects.value.filter(
              (project) => project.id !== payload.old.id,
            );
          }
        },
      )
      .subscribe();

    // Stocker la fonction de désabonnement
    unsubscribe.value = () => {
      supabase.removeChannel(subscription);
    };
  } catch (error) {
    console.error("Erreur lors du chargement des projets:", error);
    notifications.addNotification({
      type: "error",
      title: "Erreur",
      message: "Impossible de charger les projets",
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};

// Créer un nouveau projet
const createNewProject = async () => {
  try {
    if (!authStore.user?.id) {
      router.push({ name: "login" });
      return;
    }

    loading.value = true;

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: `Nouveau projet ${new Date().toLocaleDateString("fr-FR")}`,
          description: "Décrivez votre projet ici",
          status: "brouillon",
          user_id: authStore.user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Rediriger vers l'éditeur avec le nouveau projet
    if (data) {
      router.push({
        name: "studio",
        params: { id: data.id },
      });
    }

    notifications.addNotification({
      type: "success",
      title: "Projet créé",
      message: "Votre nouveau projet a été créé avec succès",
      timeout: 5000,
    });
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    notifications.addNotification({
      type: "error",
      title: "Erreur",
      message: "Impossible de créer un nouveau projet",
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
};

// Supprimer un projet
const deleteProject = async (projectId: string) => {
  if (
    !confirm(
      "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.",
    )
  ) {
    return;
  }

  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", authStore.user?.id); // Sécurité supplémentaire

    if (error) throw error;

    notifications.addNotification({
      type: "success",
      title: "Projet supprimé",
      message: "Le projet a été supprimé avec succès",
      timeout: 5000,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    notifications.addNotification({
      type: "error",
      title: "Erreur",
      message: "Impossible de supprimer le projet",
      timeout: 5000,
    });
  }
};

// La fonction createNewProject a été déplacée plus haut dans le fichier

// Vérifier l'authentification et charger les projets au montage du composant
onMounted(async () => {
  try {
    // Vérifier si l'utilisateur est connecté
    if (!authStore.isInitialized) {
      await authStore.init();
    }

    if (!isAuthenticated.value) {
      console.log("Aucune session utilisateur, redirection vers la connexion");
      router.push({
        name: "login",
        query: { redirect: router.currentRoute.value.fullPath },
      });
      return;
    }

    // Charger les projets
    await fetchProjects();
  } catch (error) {
    console.error("Erreur lors de l'initialisation du tableau de bord:", error);
    router.push({
      name: "login",
      query: {
        redirect: router.currentRoute.value.fullPath,
        error: "session_expired",
      },
    });
  }
});

const getStatusColor = (status: string) => {
  if (!status) return "bg-gray-100 text-gray-800";

  const statusLower = status.toLowerCase();

  if (["terminé", "termine", "completed", "done"].includes(statusLower)) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
  }
  if (["en cours", "in_progress", "en-cours"].includes(statusLower)) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
  }
  if (["brouillon", "draft"].includes(statusLower)) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
  }
  if (["en attente", "pending", "en-attente"].includes(statusLower)) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
  }

  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
};

const getStatusIcon = (status: string) => {
  const statusLower = status?.toLowerCase() || "";

  if (["terminé", "termine", "completed", "done"].includes(statusLower)) {
    return "check-circle";
  }
  if (["en cours", "in_progress", "en-cours"].includes(statusLower)) {
    return "loader";
  }
  if (["brouillon", "draft"].includes(statusLower)) {
    return "edit-3";
  }

  return "file-text";
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Date inconnue";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date invalide";

    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Si la date est aujourd'hui
    if (diffInDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Si c'était hier
    if (diffInDays === 1) {
      return `Hier à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Si c'était il y a moins d'une semaine
    if (diffInDays < 7) {
      const days = [
        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
      ];
      return `${days[date.getDay()]} à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Sinon, afficher la date complète
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Erreur de formatage de date:", error);
    return "Date invalide";
  }
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- En-tête -->
    <div class="mb-8">
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1
            class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            Mes projets
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gérez et créez de nouveaux projets vidéo
          </p>
        </div>
        <button
          @click="createNewProject"
          :disabled="loading"
          class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <Plus class="mr-2 h-4 w-4" />
          Nouveau projet
        </button>
      </div>
    </div>

    <!-- État de chargement -->
    <div
      v-if="loading && projects.length === 0"
      class="flex justify-center py-12"
    >
      <div class="flex flex-col items-center space-y-4">
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
        ></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Chargement des projets...
        </p>
      </div>
    </div>

    <!-- Aucun projet -->
    <div
      v-else-if="projects.length === 0"
      class="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center"
    >
      <Video class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        Aucun projet
      </h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Commencez par créer un nouveau projet.
      </p>
      <div class="mt-6">
        <button
          @click="createNewProject"
          :disabled="loading"
          class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <Plus class="-ml-1 mr-2 h-5 w-5" />
          Nouveau projet
        </button>
      </div>
    </div>

    <!-- Liste des projets -->
    <div v-else class="space-y-6">
      <!-- Filtres et tris (à implémenter) -->
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div class="w-full sm:w-auto">
          <!-- Champ de recherche -->
          <div class="relative">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
            >
              <Search class="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un projet..."
              class="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
            />
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Filtres (à implémenter) -->
          <button
            type="button"
            class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
          >
            <Filter class="mr-2 h-4 w-4 text-gray-400" />
            Filtres
          </button>
          <button
            type="button"
            class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
          >
            <ListOrdered class="mr-2 h-4 w-4 text-gray-400" />
            Trier
          </button>
        </div>
      </div>

      <!-- Grille de projets -->
      <div
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="project in projects"
          :key="project.id"
          class="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <!-- Image de prévisualisation -->
          <div
            class="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
          >
            <Video class="h-12 w-12 text-gray-400" />
          </div>

          <!-- Badge de statut -->
          <div class="absolute right-2 top-2">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="getStatusColor(project.status)"
            >
              {{ project.status }}
            </span>
          </div>

          <!-- Contenu du projet -->
          <div class="flex flex-1 flex-col p-4">
            <div class="flex-1">
              <h3
                class="text-sm font-medium text-gray-900 line-clamp-2 dark:text-white"
              >
                {{ project.name }}
              </h3>
              <p
                class="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400"
              >
                {{ project.description || "Aucune description" }}
              </p>
            </div>

            <!-- Métadonnées -->
            <div class="mt-4 flex items-center justify-between">
              <div
                class="flex items-center text-xs text-gray-500 dark:text-gray-400"
              >
                <Calendar class="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>{{
                  formatDate(project.updated_at || project.created_at)
                }}</span>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-2">
                <button
                  @click.stop="
                    router.push({ name: 'studio', params: { id: project.id } })
                  "
                  class="inline-flex items-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:hover:bg-gray-700"
                  title="Éditer"
                >
                  <span class="sr-only">Éditer</span>
                  <Edit3 class="h-4 w-4" />
                </button>
                <button
                  @click.stop="deleteProject(project.id)"
                  class="inline-flex items-center rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:hover:bg-red-900/20"
                  title="Supprimer"
                >
                  <span class="sr-only">Supprimer</span>
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination (à implémenter) -->
      <div
        class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 dark:border-gray-700"
      >
        <div class="flex flex-1 justify-between sm:hidden">
          <button
            class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Précédent
          </button>
          <button
            class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Suivant
          </button>
        </div>
        <div
          class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Affichage de <span class="font-medium">1</span> à
              <span class="font-medium">8</span> sur{' '}
              <span class="font-medium">{{ projects.length }}</span> projets
            </p>
          </div>
          <div>
            <nav
              class="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:ring-gray-600 dark:hover:bg-gray-700"
              >
                <span class="sr-only">Précédent</span>
                <ChevronLeft class="h-5 w-5" />
              </button>
              <!-- Current: "z-10 bg-primary-600 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"  -->
              <a
                href="#"
                aria-current="page"
                class="relative z-10 inline-flex items-center bg-primary-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >1</a
              >
              <a
                href="#"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
                >2</a
              >
              <a
                href="#"
                class="relative hidden items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 md:inline-flex dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
                >3</a
              >
              <span
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-600"
                >...</span
              >
              <a
                href="#"
                class="relative hidden items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 md:inline-flex dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
                >8</a
              >
              <button
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:ring-gray-600 dark:hover:bg-gray-700"
              >
                <span class="sr-only">Suivant</span>
                <ChevronRight class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
