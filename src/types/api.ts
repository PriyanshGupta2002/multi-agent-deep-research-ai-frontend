export type ApiErrorPayload = {
  code?: string;
  error_code?: string;
  detail?: string | { message?: string };
  message?: string;
};
