import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
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
        title: "Boss Battle",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <div className="border-white/10 border-b bg-black/20 backdrop-blur">
          <div className="mx-auto flex h-20 w-full max-w-5xl items-center px-6">
            <span className="font-semibold text-lg text-stone-200 uppercase tracking-[0.18em]">
              Boss Battle
            </span>
          </div>
        </div>
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
        <Scripts />
      </body>
    </html>
  );
}
