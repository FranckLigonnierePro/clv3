<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <div class="px-4 sm:px-0">
            <h3 class="text-lg font-medium leading-6 text-gray-900">Profil</h3>
            <p class="mt-1 text-sm text-gray-600">
              Gérer les informations de votre compte
            </p>
          </div>
        </div>
        
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 bg-white sm:p-6">
              <div class="grid grid-cols-6 gap-6">
                <!-- Avatar Section -->
                <div class="col-span-6 sm:col-span-3">
                  <label class="block text-sm font-medium text-gray-700">Photo de profil</label>
                  <div class="mt-2 flex items-center">
                    <span class="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                      <img 
                        v-if="user?.user_metadata?.avatar_url" 
                        :src="user.user_metadata.avatar_url" 
                        alt=""
                        class="h-full w-full"
                      >
                      <svg v-else class="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.67 0 8.997 1.701 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                    <button
                      type="button"
                      class="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      @click="openFileUpload"
                    >
                      Changer
                    </button>
                    <input
                      ref="fileInput"
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="handleFileUpload"
                    >
                  </div>
                </div>
                
                <!-- User Info Section -->
                <div class="col-span-6 sm:col-span-4">
                  <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    id="email"
                    v-model="user.email"
                    type="email"
                    disabled
                    class="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label for="first-name" class="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    id="first-name"
                    v-model="profile.firstName"
                    type="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                </div>

                <div class="col-span-6 sm:col-span-3">
                  <label for="last-name" class="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    id="last-name"
                    v-model="profile.lastName"
                    type="text"
                    class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                </div>

                <div class="col-span-6">
                  <label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
                  <div class="mt-1">
                    <textarea
                      id="bio"
                      v-model="profile.bio"
                      rows="3"
                      class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full border border-gray-300 rounded-md sm:text-sm"
                      placeholder="Dites quelques mots à votre sujet..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Form Actions -->
            <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                :disabled="loading"
                @click="saveProfile"
              >
                <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </span>
                <span v-else>Enregistrer les modifications</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/supabase';

export default {
  name: 'UserProfile',
  
  setup() {
    const user = ref(null);
    const loading = ref(false);
    const fileInput = ref(null);
    
    // Profile data
    const profile = ref({
      firstName: '',
      lastName: '',
      bio: ''
    });

    // Fetch user data
    const fetchUser = async () => {
      try {
        const { data: { user: userData } } = await supabase.auth.getUser();
        user.value = userData;
        
        // Set initial profile data
        if (userData?.user_metadata) {
          profile.value = {
            firstName: userData.user_metadata.first_name || '',
            lastName: userData.user_metadata.last_name || '',
            bio: userData.user_metadata.bio || ''
          };
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    // Save profile
    const saveProfile = async () => {
      if (!user.value) return;
      
      loading.value = true;
      
      try {
        const updates = {
          first_name: profile.value.firstName,
          last_name: profile.value.lastName,
          bio: profile.value.bio,
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase.auth.updateUser({
          data: updates
        });
        
        if (error) throw error;
        
        // Update local user data
        user.value = {
          ...user.value,
          user_metadata: {
            ...user.value.user_metadata,
            ...updates
          }
        };
        
        // Show success message or notification
        console.log('Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Handle file upload
    const openFileUpload = () => {
      fileInput.value?.click();
    };
    
    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      loading.value = true;
      
      try {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        // Update user avatar
        const { error: updateError } = await supabase.auth.updateUser({
          data: { ...user.value.user_metadata, avatar_url: publicUrl }
        });
        
        if (updateError) throw updateError;
        
        // Update local user data
        user.value = {
          ...user.value,
          user_metadata: {
            ...user.value.user_metadata,
            avatar_url: publicUrl
          }
        };
        
      } catch (error) {
        console.error('Error uploading avatar:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Fetch user data on component mount
    onMounted(() => {
      fetchUser();
    });
    
    return {
      user,
      profile,
      loading,
      fileInput,
      saveProfile,
      openFileUpload,
      handleFileUpload
    };
  }
};
</script>
