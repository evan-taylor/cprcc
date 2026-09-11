export type SignInFlow = "signIn" | "signUp";

export const SIGN_IN_REQUEST_FAILURE_FINGERPRINT = "signin-request-failed";
export const SIGN_IN_PROFILE_SETUP_FAILURE_FINGERPRINT =
  "signin-profile-setup-failed";
export const SIGN_IN_REQUEST_FAILURE_MESSAGE = "Sign-in request failed";
export const SIGN_IN_PROFILE_SETUP_FAILURE_MESSAGE =
  "Sign-in profile setup failed";
export const UNEXPECTED_SIGN_IN_USER_MESSAGE =
  "Something went wrong. Please try again.";
export const INVALID_CREDENTIALS_USER_MESSAGE =
  "Invalid email or password. If you don\u2019t have an account, please sign up.";
export const SIGN_UP_FAILURE_USER_MESSAGE =
  "Could not create your account. Please check your details and try again.";
export const ACCOUNT_EXISTS_USER_MESSAGE =
  "An account with this email already exists. Please sign in.";
export const TOO_MANY_ATTEMPTS_USER_MESSAGE =
  "Too many failed attempts. Please try again later.";

// Convex production redacts thrown auth errors to this shape, including
// InvalidSecret / InvalidAccountId. The request id is unique per attempt.
const CONVEX_REDACTED_SERVER_ERROR_PATTERN =
  /\[Request ID: [^\]]+\] Server Error/;

const EXPECTED_AUTH_FAILURE_MESSAGES = [
  "InvalidSecret",
  "InvalidAccountId",
  "Invalid credentials",
  "Invalid password",
  "TooManyFailedAttempts",
] as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}

function messageIncludesExpectedFailure(message: string): boolean {
  for (const expected of EXPECTED_AUTH_FAILURE_MESSAGES) {
    if (message.includes(expected)) {
      return true;
    }
  }

  return false;
}

/**
 * Credential and other expected password-provider failures.
 * These must not go to error tracking: sign_in_failed already counts them,
 * and production Convex messages embed a unique request id.
 */
export function isExpectedAuthFailure(error: unknown): boolean {
  const message = getErrorMessage(error);

  if (message.length === 0) {
    return false;
  }

  if (messageIncludesExpectedFailure(message)) {
    return true;
  }

  if (CONVEX_REDACTED_SERVER_ERROR_PATTERN.test(message)) {
    return true;
  }

  return message.includes("already exists");
}

export function getSignInFailureUserMessage(
  error: unknown,
  flow: SignInFlow
): string {
  const message = getErrorMessage(error);

  if (message.includes("already exists")) {
    return ACCOUNT_EXISTS_USER_MESSAGE;
  }

  if (message.includes("TooManyFailedAttempts")) {
    return TOO_MANY_ATTEMPTS_USER_MESSAGE;
  }

  if (isExpectedAuthFailure(error)) {
    if (flow === "signUp") {
      return SIGN_UP_FAILURE_USER_MESSAGE;
    }

    return INVALID_CREDENTIALS_USER_MESSAGE;
  }

  return UNEXPECTED_SIGN_IN_USER_MESSAGE;
}
