// Fichier de déclaration de type pour les stores Pinia
declare module '@/stores/auth' {
  import { AuthStore } from '@/stores/auth';
  export const useAuthStore: () => AuthStore;
}
