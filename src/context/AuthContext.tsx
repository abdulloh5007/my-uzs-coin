
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type AuthError,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { 
    doc, 
    getDocs,
    setDoc,
    query,
    collection,
    where,
    writeBatch,
    increment,
    arrayUnion,
    serverTimestamp
} from 'firebase/firestore';

const REFERRAL_BONUS = 25000;
const INITIAL_MAX_ENERGY_BASE = 500;
const DAILY_CLICK_BOOST_LIMIT = 3;
const DAILY_FULL_ENERGY_BOOST_LIMIT = 3;

const getCurrentDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | AuthError>;
  register: (email: string, password: string, nickname: string, referrerId?: string) => Promise<User | AuthError>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User | AuthError> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const register = async (email: string, password: string, nickname: string, referrerId?: string): Promise<User | AuthError> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: nickname,
      });

      const batch = writeBatch(db);
      const newUserDocRef = doc(db, 'users', user.uid);
      const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      let initialScore = 0;
      let referredBy = '';
      
      if (referrerId && referrerId.trim() !== '' && referrerId !== user.uid) {
        initialScore = REFERRAL_BONUS;
        referredBy = referrerId;

        const referralRef = doc(collection(db, "referrals"));
        batch.set(referralRef, {
          referrerId: referrerId,
          newUserId: user.uid,
          newUserName: nickname,
          awarded: false,
          createdAt: serverTimestamp(),
          bonusAmount: REFERRAL_BONUS
        });
      }

      // Define initial game state for the new user
      const newUserInitialData = {
          nickname: nickname,
          username: '', // Explicitly initialize username to prevent errors
          score: initialScore,
          totalScoreCollected: initialScore,
          energy: INITIAL_MAX_ENERGY_BASE,
          maxEnergyLevel: 0,
          clickPowerLevel: 0,
          energyRegenLevel: 0,
          totalClicks: 0,
          gameStartTime: new Date().toISOString(),
          daily_clicks: 0,
          daily_coinsCollected: 0,
          daily_timePlayedSeconds: 0,
          daily_lastResetDate: getCurrentDateString(),
          isBoostActive: false,
          boostEndTime: 0,
          daily_clickBoostsAvailable: DAILY_CLICK_BOOST_LIMIT,
          daily_lastClickBoostResetDate: getCurrentDateString(),
          daily_fullEnergyBoostsAvailable: DAILY_FULL_ENERGY_BOOST_LIMIT,
          daily_lastFullEnergyBoostResetDate: getCurrentDateString(),
          isBotOwned: false,
          lastSeenTimestamp: new Date().toISOString(),
          unclaimedBotCoins: 0,
          ownedSkins: ['classic'],
          selectedSkinId: 'classic',
          completedUnclaimedTaskTierIds: [],
          claimedTaskTierIds: [],
          ownedNfts: [],
          referralCode: newReferralCode,
          referredBy: referredBy,
          referredUsers: [],
          totalReferralBonus: 0,
          lastUpdated: serverTimestamp(),
      };

      batch.set(newUserDocRef, newUserInitialData);
      await batch.commit();

      // Manually update the user object with the new display name to ensure it's available immediately
      // This helps prevent issues where the rest of the app might see the old (null) displayName
      await user.reload();
      const updatedUser = auth.currentUser;

      return updatedUser || user;

    } catch (error) {
      console.error("Registration Error:", error);
      return error as AuthError;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login'); // Перенаправляем на страницу логина после выхода
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
