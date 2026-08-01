'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { userPool, getUserIdFromToken, deriveDisplayName } from '@/lib/cognito';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  idToken: string | null;
  currentUserId: string | null;
  userDisplayName: string;
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<void>;
  signup: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  confirmResetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>;
  updateUserDisplayName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>('Student');

  // ---- Shared helpers so "set session" / "set name" / "clear everything"
  // each have exactly one implementation, used by both the mount-time
  // session check and the interactive login flow. ----

  const applySession = (token: string) => {
    setIdToken(token);
    setCurrentUserId(getUserIdFromToken(token));
    setIsAuthenticated(true);
    localStorage.setItem('studypal_id_token', token);
  };

  const applyDisplayName = (name: string) => {
    setUserDisplayName(name);
    localStorage.setItem('studypal_user_name', name);
  };

  const clearSession = () => {
    setIdToken(null);
    setCurrentUserId(null);
    setIsAuthenticated(false);
    setUserDisplayName('Student');
    localStorage.removeItem('studypal_id_token');
    localStorage.removeItem('studypal_user_name');
  };

  useEffect(() => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      setIsLoading(false);
      return;
    }

    cognitoUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          clearSession();
          setIsLoading(false);
          return;
        }

        applySession(session.getIdToken().getJwtToken());

        cognitoUser.getUserAttributes((_attrErr, attributes) => {
          const email =
            attributes?.find((a) => a.getName() === 'email')?.getValue() ?? '';
          applyDisplayName(deriveDisplayName(email, attributes));
          setIsLoading(false);
        });
      },
    );
  }, []);

  const login = (
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });

      if (rememberMe) {
        localStorage.setItem('studypal_remembered_email', email);
      } else {
        localStorage.removeItem('studypal_remembered_email');
      }

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          applySession(result.getIdToken().getJwtToken());

          cognitoUser.getUserAttributes((_attrErr, attributes) => {
            applyDisplayName(deriveDisplayName(email, attributes));
          });
          resolve();
        },
        onFailure: reject,
      });
    });
  };

  const signup = (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'given_name', Value: firstName }),
        new CognitoUserAttribute({ Name: 'family_name', Value: lastName }),
      ];

      userPool.signUp(email, password, attributeList, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const confirmSignUp = (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };

  const logout = () => {
    try {
      userPool.getCurrentUser()?.signOut();
    } catch (e) {
      console.error('Cognito signout error:', e);
    }
    clearSession();
  };

  const forgotPassword = (email: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: reject,
        inputVerificationCode: () => resolve(),
      });
    });
  };

  const confirmResetPassword = (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: reject,
      });
    });
  };

  const updateUserDisplayName = (name: string) => applyDisplayName(name);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        idToken,
        currentUserId,
        userDisplayName,
        login,
        signup,
        confirmSignUp,
        logout,
        forgotPassword,
        confirmResetPassword,
        updateUserDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
