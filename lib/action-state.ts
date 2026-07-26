export type ActionState<T = void> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[] | undefined>;
};