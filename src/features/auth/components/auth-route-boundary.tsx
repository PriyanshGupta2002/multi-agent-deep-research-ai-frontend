"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { useAuthUser } from "@/features/auth/hooks/use-auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function isAuthPath(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

function getSafeNextPath() {
  const requestedPath = new URLSearchParams(window.location.search).get("next");
  return requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";
}

function AuthState({
  title,
  description,
  retry,
}: {
  title: string;
  description: string;
  retry?: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-lg border bg-muted text-sm font-semibold">
          DR
        </div>
        <h1 className="mt-4 text-base font-semibold">{title}</h1>
        <p aria-live="polite" className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {retry && (
          <Button className="mt-5" onClick={retry} variant="outline">
            Try again
          </Button>
        )}
      </div>
    </main>
  );
}

export function AuthRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authPage = isAuthPath(pathname);
  const { data: user, error, isError, isPending, refetch } = useAuthUser();

  useEffect(() => {
    if (isPending || isError) return;

    if (authPage && user) {
      router.replace(authPage ? getSafeNextPath() : "/");
      return;
    }

    if (!authPage && !user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
    }
  }, [authPage, isError, isPending, pathname, router, user]);

  if (isPending) {
    return (
      <AuthState
        description="Checking your session securely."
        title="Loading workspace"
      />
    );
  }

  if (isError) {
    return (
      <AuthState
        description={getAuthErrorMessage(
          error,
          "Unable to verify your session.",
        )}
        retry={() => void refetch()}
        title="Can’t connect"
      />
    );
  }

  if (authPage && user) {
    return (
      <AuthState
        description="Taking you to your workspace."
        title="You’re already signed in"
      />
    );
  }

  if (!authPage && !user) {
    return (
      <AuthState
        description="Redirecting you to sign in."
        title="Sign in required"
      />
    );
  }

  if (authPage) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        {children}
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
