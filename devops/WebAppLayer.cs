internal static class WebAppLayer
{
    public static void Add(
        IDistributedApplicationBuilder builder,
        AppHostPaths paths,
        ConvexResources convexResources)
    {
        builder.AddExecutable(
                "web-app",
                "bash",
                paths.ScriptsRoot,
                "web-app.sh",
                paths.RepoRoot)
            .WithWorkingDirectory(paths.ScriptsRoot)
            .WithEnvironment("CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV", "false")
            .WithEnvironment("TANSTACK_DEVTOOLS_EVENT_BUS_ENABLED", "false")
            .WithEnvironment("VITE_CONVEX_URL", convexResources.BackendEndpoint)
            .WithHttpEndpoint(name: "http", env: "PORT")
            .WaitFor(convexResources.Sync);
    }
}
