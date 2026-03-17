import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ActiveThemeProvider } from "@/components/ui/8bit/active-theme";
import { ThemeSelector } from "@/components/ui/8bit/theme-selector";
import { AppConvexProvider } from "../integrations/convex/provider";
import { tanStackQueryDevtools } from "../integrations/tanstack-query/devtools";
import * as TanstackQuery from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: "#1f140d",
      },
      {
        title: "Boss Battle",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "/favicon-96x96.png",
      },
      {
        rel: "icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    ],
  }),

  shellComponent: RootDocument,
});

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveThemeProvider>
      <div className="border-primary/30 border-b bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <span className="retro text-[10px] text-primary uppercase tracking-[0.22em]">
              Boss Battle
            </span>
          </div>
          <ThemeSelector className="w-full max-w-xs" />
        </div>
      </div>
      {children}
    </ActiveThemeProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <AppShellLayout>
          <TanstackQuery.Provider
            queryClient={Route.useRouteContext().queryClient}
          >
            <AppConvexProvider>
              {children}
              <TanStackDevtools
                config={{
                  position: "bottom-right",
                }}
                plugins={[
                  {
                    name: "Tanstack Router",
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                  tanStackQueryDevtools,
                ]}
              />
            </AppConvexProvider>
          </TanstackQuery.Provider>
        </AppShellLayout>
        <Scripts />
      </body>
    </html>
  );
}
