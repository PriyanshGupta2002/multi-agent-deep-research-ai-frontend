import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthRouteBoundary } from "@/features/auth/components/auth-route-boundary";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepResearch AI",
  description: "A focused workspace for thoughtful, source-backed research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <Suspense
            fallback={
              <div
                aria-label="Loading application"
                className="min-h-dvh bg-background"
                role="status"
              />
            }
          >
            <AuthRouteBoundary>{children}</AuthRouteBoundary>
          </Suspense>
        </AppProviders>
      </body>
    </html>
  );
}
