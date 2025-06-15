<script setup lang="ts">
import { computed } from "vue";
import { X } from "lucide-vue-next";
import { useNotifications } from "@/stores/notifications";

const props = defineProps({
  notification: {
    type: Object as () => {
      id: string;
      type: "success" | "error" | "info" | "warning";
      title: string;
      message: string;
    },
    required: true,
  },
});

const notificationsStore = useNotifications();

const typeClasses = {
  success:
    "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800",
  error:
    "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800",
  warning:
    "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800",
  info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
};

const icon = computed(() => {
  switch (props.notification.type) {
    case "success":
      return "CheckCircle";
    case "error":
      return "XCircle";
    case "warning":
      return "AlertTriangle";
    case "info":
    default:
      return "Info";
  }
});

const close = () => {
  notificationsStore.removeNotification(props.notification.id);
};
</script>

<template>
  <div
    class="mb-4 flex items-start rounded-lg border p-4 transition-all duration-300"
    :class="typeClasses[notification.type]"
    role="alert"
  >
    <div class="flex-shrink-0">
      <component :is="icon" class="h-5 w-5" />
    </div>
    <div class="ml-3 flex-1">
      <h3 class="text-sm font-medium">
        {{ notification.title }}
      </h3>
      <div class="mt-1 text-sm">
        {{ notification.message }}
      </div>
    </div>
    <div class="ml-4">
      <button
        type="button"
        class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        @click="close"
      >
        <span class="sr-only">Fermer</span>
        <X class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>
