import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      hasProfile: false,
      user: null,
      profile: {},
      isNewUser: false,
      login: (token, hasProfile, user, profile, isNewUser = false) => {
        // Normalize backend snake_case to frontend camelCase
        const normalizedProfile = profile ? {
          city: profile.city || "",
          homeType: profile.home_type || profile.homeType || "2 BHK",
          familySize: profile.household_size || profile.familySize || 3,
          budget: profile.budget_rs || profile.budget || 2500,
          provider: profile.utility || profile.provider || "",
          appliances: profile.appliances || {ac:0, geyser:0, wm:0, fridge:0, tv:0, fans:0, pc:0}
        } : {};

        set({ 
          token, 
          isAuthenticated: true, 
          hasProfile, 
          user,
          profile: normalizedProfile,
          isNewUser
        });
      },
      logout: () => set({ token: null, isAuthenticated: false, hasProfile: false, user: null, profile: {}, isNewUser: false }),
      setProfileStatus: (status, profileDetails) => set(state => ({ 
        hasProfile: status, 
        profile: profileDetails || state.profile,
        isNewUser: status ? false : state.isNewUser 
      })),
    }),
    {
      name: 'voltiq-auth-storage',
    }
  )
);
