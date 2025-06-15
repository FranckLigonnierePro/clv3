<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <div class="px-4 sm:px-0">
            <h3 class="text-lg font-medium leading-6 text-gray-900">
              Paramètres
            </h3>
            <p class="mt-1 text-sm text-gray-600">
              Gérez les paramètres de votre compte et vos préférences
            </p>
          </div>
        </div>

        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 bg-white sm:p-6">
              <!-- Password Update Section -->
              <div class="mb-8 pb-8 border-b border-gray-200">
                <h4 class="text-md font-medium text-gray-900 mb-4">
                  Changer de mot de passe
                </h4>

                <div class="grid grid-cols-6 gap-6">
                  <div class="col-span-6 sm:col-span-4">
                    <label
                      for="current-password"
                      class="block text-sm font-medium text-gray-700"
                      >Mot de passe actuel</label
                    >
                    <input
                      id="current-password"
                      v-model="password.current"
                      type="password"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      :class="{ 'border-red-300': passwordErrors.current }"
                    />
                    <p
                      v-if="passwordErrors.current"
                      class="mt-1 text-sm text-red-600"
                    >
                      {{ passwordErrors.current }}
                    </p>
                  </div>

                  <div class="col-span-6 sm:col-span-4">
                    <label
                      for="new-password"
                      class="block text-sm font-medium text-gray-700"
                      >Nouveau mot de passe</label
                    >
                    <input
                      id="new-password"
                      v-model="password.new"
                      type="password"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      :class="{ 'border-red-300': passwordErrors.new }"
                    />
                    <p
                      v-if="passwordErrors.new"
                      class="mt-1 text-sm text-red-600"
                    >
                      {{ passwordErrors.new }}
                    </p>
                  </div>

                  <div class="col-span-6 sm:col-span-4">
                    <label
                      for="confirm-password"
                      class="block text-sm font-medium text-gray-700"
                      >Confirmer le nouveau mot de passe</label
                    >
                    <input
                      id="confirm-password"
                      v-model="password.confirm"
                      type="password"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      :class="{ 'border-red-300': passwordErrors.confirm }"
                    />
                    <p
                      v-if="passwordErrors.confirm"
                      class="mt-1 text-sm text-red-600"
                    >
                      {{ passwordErrors.confirm }}
                    </p>
                  </div>

                  <div class="col-span-6 sm:col-span-4">
                    <button
                      type="button"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      :disabled="updatingPassword"
                      @click="updatePassword"
                    >
                      <svg
                        v-if="updatingPassword"
                        class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {{
                        updatingPassword
                          ? "Mise à jour..."
                          : "Mettre à jour le mot de passe"
                      }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Notification Preferences -->
              <div class="mb-8 pb-8 border-b border-gray-200">
                <h4 class="text-md font-medium text-gray-900 mb-4">
                  Préférences de notification
                </h4>

                <div class="flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="email-notifications"
                      v-model="notifications.email"
                      type="checkbox"
                      class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      @change="updateNotificationPreferences"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="email-notifications"
                      class="font-medium text-gray-700"
                      >Notifications par email</label
                    >
                    <p class="text-gray-500">
                      Recevoir des mises à jour et des notifications par email
                    </p>
                  </div>
                </div>

                <div class="mt-4 flex items-start">
                  <div class="flex items-center h-5">
                    <input
                      id="push-notifications"
                      v-model="notifications.push"
                      type="checkbox"
                      class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      @change="updateNotificationPreferences"
                    />
                  </div>
                  <div class="ml-3 text-sm">
                    <label
                      for="push-notifications"
                      class="font-medium text-gray-700"
                      >Notifications push</label
                    >
                    <p class="text-gray-500">
                      Recevoir des notifications sur cet appareil
                    </p>
                  </div>
                </div>
              </div>

              <!-- Danger Zone -->
              <div>
                <h4 class="text-md font-medium text-red-700 mb-4">
                  Zone de danger
                </h4>

                <div class="bg-red-50 p-4 rounded-md">
                  <h5 class="text-sm font-medium text-red-800">
                    Supprimer le compte
                  </h5>
                  <p class="mt-1 text-sm text-red-700">
                    Une fois votre compte supprimé, toutes vos données seront
                    définitivement effacées. Cette action est irréversible.
                  </p>
                  <div class="mt-4">
                    <button
                      type="button"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      @click="confirmDeleteAccount = true"
                    >
                      Supprimer mon compte
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="confirmDeleteAccount" class="fixed z-10 inset-0 overflow-y-auto">
      <div
        class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
      >
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          class="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
          >&#8203;</span
        >

        <div
          class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
        >
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
            >
              <svg
                class="h-6 w-6 text-red-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Supprimer le compte
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos
                  données seront définitivement supprimées. Cette action ne peut
                  pas être annulée.
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              :disabled="deletingAccount"
              @click="deleteAccount"
            >
              <span v-if="deletingAccount" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Suppression...
              </span>
              <span v-else>Oui, supprimer mon compte</span>
            </button>
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              @click="confirmDeleteAccount = false"
              :disabled="deletingAccount"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from "vue";
import { supabase } from "@/supabase";
import { useRouter } from "vue-router";

export default {
  name: "UserSettings",

  setup() {
    const router = useRouter();

    // Password update state
    const password = ref({
      current: "",
      new: "",
      confirm: "",
    });

    const passwordErrors = ref({
      current: "",
      new: "",
      confirm: "",
    });

    const updatingPassword = ref(false);

    // Notification preferences
    const notifications = ref({
      email: true,
      push: false,
    });

    // Account deletion
    const confirmDeleteAccount = ref(false);
    const deletingAccount = ref(false);

    // Load user preferences
    const loadUserPreferences = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.user_metadata?.notifications) {
          notifications.value = {
            ...notifications.value,
            ...user.user_metadata.notifications,
          };
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      }
    };

    // Update password
    const validatePassword = () => {
      let isValid = true;

      // Reset errors
      passwordErrors.value = {
        current: "",
        new: "",
        confirm: "",
      };

      // Validate current password
      if (!password.value.current) {
        passwordErrors.value.current = "Le mot de passe actuel est requis";
        isValid = false;
      }

      // Validate new password
      if (!password.value.new) {
        passwordErrors.value.new = "Le nouveau mot de passe est requis";
        isValid = false;
      } else if (password.value.new.length < 6) {
        passwordErrors.value.new =
          "Le mot de passe doit contenir au moins 6 caractères";
        isValid = false;
      }

      // Validate confirm password
      if (password.value.new !== password.value.confirm) {
        passwordErrors.value.confirm = "Les mots de passe ne correspondent pas";
        isValid = false;
      }

      return isValid;
    };

    const updatePassword = async () => {
      if (!validatePassword()) return;

      updatingPassword.value = true;

      try {
        const { error } = await supabase.auth.updateUser({
          password: password.value.new,
        });

        if (error) throw error;

        // Reset form
        password.value = {
          current: "",
          new: "",
          confirm: "",
        };

        // Show success message
        alert("Mot de passe mis à jour avec succès");
      } catch (error) {
        console.error("Error updating password:", error);
        alert("Une erreur est survenue lors de la mise à jour du mot de passe");
      } finally {
        updatingPassword.value = false;
      }
    };

    // Update notification preferences
    const updateNotificationPreferences = async () => {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            notifications: notifications.value,
          },
        });

        if (error) throw error;

        // Show success message or update UI
        console.log("Notification preferences updated");
      } catch (error) {
        console.error("Error updating notification preferences:", error);
      }
    };

    // Delete account
    const deleteAccount = async () => {
      if (deletingAccount.value) return;

      deletingAccount.value = true;

      try {
        // First, sign out the user
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        // Then delete the user account
        const { error: deleteError } = await supabase.rpc("delete_user");
        if (deleteError) throw deleteError;

        // Redirect to home page after successful deletion
        router.push("/");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Une erreur est survenue lors de la suppression du compte");
      } finally {
        deletingAccount.value = false;
        confirmDeleteAccount.value = false;
      }
    };

    // Load user preferences on component mount
    onMounted(() => {
      loadUserPreferences();
    });

    return {
      // Password update
      password,
      passwordErrors,
      updatingPassword,
      updatePassword,

      // Notifications
      notifications,
      updateNotificationPreferences,

      // Account deletion
      confirmDeleteAccount,
      deletingAccount,
      deleteAccount,
    };
  },
};
</script>
