"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { useLogin, useRegister } from "@/features/auth/hooks/use-auth";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/features/auth/validation";

function AuthTextField({
  id,
  label,
  type,
  autoComplete,
  registration,
  error,
}: {
  id: string;
  label: string;
  type: "email" | "text" | "password";
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
        id={id}
        type={type}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        {...registration}
      />
      {error && (
        <p className="text-xs text-destructive" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            DR
          </div>
          <p className="mt-3 text-sm font-semibold tracking-tight">
            DeepResearch AI
          </p>
        </div>
        <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {children}
        </section>
        <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}

export function LoginForm() {
  const login = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <AuthCard
      description="Sign in to continue to your research workspace."
      footer={
        <>
          Don’t have an account?{" "}
          <Link className="font-medium text-foreground hover:underline" href="/register">
            Create an account
          </Link>
        </>
      }
      title="Welcome back"
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
        noValidate
      >
        <AuthTextField
          autoComplete="email"
          error={form.formState.errors.email?.message}
          id="login-email"
          label="Email"
          registration={form.register("email")}
          type="email"
        />
        <AuthTextField
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          id="login-password"
          label="Password"
          registration={form.register("password")}
          type="password"
        />
        {login.isError && (
          <p
            aria-live="polite"
            className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive"
            role="alert"
          >
            {getAuthErrorMessage(login.error, "Unable to sign in.")}
          </p>
        )}
        <Button className="w-full" disabled={login.isPending} type="submit">
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: RegisterFormValues) {
    register.mutate(
      {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => router.replace("/login"),
      },
    );
  }

  return (
    <AuthCard
      description="Create an account to organize and save your research."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-foreground hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
      title="Create your account"
    >
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AuthTextField
          autoComplete="name"
          error={form.formState.errors.full_name?.message}
          id="register-name"
          label="Full name"
          registration={form.register("full_name")}
          type="text"
        />
        <AuthTextField
          autoComplete="email"
          error={form.formState.errors.email?.message}
          id="register-email"
          label="Email"
          registration={form.register("email")}
          type="email"
        />
        <AuthTextField
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          id="register-password"
          label="Password"
          registration={form.register("password")}
          type="password"
        />
        <AuthTextField
          autoComplete="new-password"
          error={form.formState.errors.confirmPassword?.message}
          id="register-confirm-password"
          label="Confirm password"
          registration={form.register("confirmPassword")}
          type="password"
        />
        {register.isError && (
          <p
            aria-live="polite"
            className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive"
            role="alert"
          >
            {getAuthErrorMessage(register.error, "Unable to create your account.")}
          </p>
        )}
        <Button className="w-full" disabled={register.isPending} type="submit">
          {register.isPending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">
          Registration creates your account. You’ll sign in on the next step.
        </p>
      </form>
    </AuthCard>
  );
}
