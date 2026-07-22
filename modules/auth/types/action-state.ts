export interface LoginActionState {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const INITIAL_LOGIN_ACTION_STATE: LoginActionState = { success: false };

export interface RegisterActionState {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const INITIAL_REGISTER_ACTION_STATE: RegisterActionState = {
  success: false,
};