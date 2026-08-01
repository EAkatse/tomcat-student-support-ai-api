import {
  CognitoUserPool,
  type CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

export const cognitoConfig = {
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
};

export const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.userPoolId,
  ClientId: cognitoConfig.clientId,
});


export function getUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      ),
    );
    return decoded.sub ?? null;
  } catch (e) {
    console.error('Failed to decode ID token:', e);
    return null;
  }
}

export function deriveDisplayName(
  email: string,
  attributes?: CognitoUserAttribute[] | null,
): string {
  const givenName = attributes
    ?.find((attr) => attr.getName() === 'given_name')
    ?.getValue();
  if (givenName) return givenName;

  const rawName = email.split('@')[0] || 'Student';
  return rawName.charAt(0).toUpperCase() + rawName.slice(1);
}
