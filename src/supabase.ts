import { createClient, type User } from "@supabase/supabase-js";
import type { Database } from "./types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Créer une instance Supabase avec le typage TypeScript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Types personnalisés
export type AuthUser = User;
export type AuthSession = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>["data"]["session"];

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Google OAuth error:", error);
    throw new Error(error.message || "Erreur lors de la connexion avec Google");
  }

  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (error) {
    console.error("Email login error:", error);

    // Messages d'erreur plus conviviaux
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Identifiants invalides. Veuillez réessayer.");
    } else if (error.message.includes("Email not confirmed")) {
      throw new Error(
        "Veuillez vérifier votre email pour confirmer votre compte.",
      );
    } else {
      throw new Error(error.message || "Erreur lors de la connexion");
    }
  }

  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  // Validation basique
  if (!email || !password) {
    throw new Error("Veuillez remplir tous les champs");
  }

  if (password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères");
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
      data: {
        created_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    console.error("Sign up error:", error);

    if (error.message.includes("already registered")) {
      throw new Error("Un compte existe déjà avec cet email");
    } else {
      throw new Error(error.message || "Erreur lors de l'inscription");
    }
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
    throw new Error("Erreur lors de la déconnexion");
  }

  // Rediriger vers la page de connexion après déconnexion
  window.location.href = "/login";
};

// Récupérer l'utilisateur actuel avec gestion d'erreur
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Error getting user:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Unexpected error getting user:", error);
    return null;
  }
};

// Récupérer la session actuelle
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
    throw error;
  }

  return data.session;
};

// Écouter les changements d'authentification
export const onAuthStateChange = (
  callback: (event: string, session: any) => void,
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

// Télécharger un fichier avec gestion d'erreur améliorée
export const uploadFile = async (file: File, path: string) => {
  try {
    // Vérifier la taille du fichier (max 10MB par défaut)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      throw new Error(
        `Le fichier est trop volumineux. Taille maximale: ${maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${path}/${fileName}`.toLowerCase();

    // Télécharger le fichier
    const { data, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);

      if (uploadError.message.includes("The resource already exists")) {
        throw new Error("Un fichier avec ce nom existe déjà");
      } else if (uploadError.message.includes("File size exceeds")) {
        throw new Error("Le fichier est trop volumineux");
      } else {
        throw new Error(
          uploadError.message || "Erreur lors du téléchargement du fichier",
        );
      }
    }

    if (!data) {
      throw new Error("Aucune donnée retournée après le téléchargement");
    }

    // Obtenir l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  } catch (error: any) {
    console.error("Error in uploadFile:", error);
    throw new Error(error.message || "Erreur lors du traitement du fichier");
  }
};

// Supprimer un fichier avec gestion d'erreur améliorée
export const deleteFile = async (path: string) => {
  try {
    if (!path) {
      throw new Error("Chemin du fichier manquant");
    }

    const { error } = await supabase.storage.from("uploads").remove([path]);

    if (error) {
      console.error("Delete file error:", error);
      throw new Error(
        error.message || "Erreur lors de la suppression du fichier",
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteFile:", error);
    throw new Error(
      error.message || "Erreur lors de la suppression du fichier",
    );
  }
};

// Obtenir une URL signée pour un fichier
export const getSignedUrl = async (path: string, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Get signed URL error:", error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    throw error;
  }
};

// Lister les fichiers d'un dossier
export const listFiles = async (path: string) => {
  try {
    const { data, error } = await supabase.storage.from("uploads").list(path);

    if (error) {
      console.error("List files error:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
};
