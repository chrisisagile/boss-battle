internal sealed record ConvexDeployment(string EnvFilePath)
{
    public async Task<(string BackendUrl, string AdminKey)> GetCredentialsAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(EnvFilePath))
        {
            throw new InvalidOperationException(
                $"Convex admin key file was not found at '{EnvFilePath}'. Run `pnpm dev` once so the Convex sync layer can generate it.");
        }

        var lines = await File.ReadAllLinesAsync(EnvFilePath, cancellationToken);
        var backendUrl = lines
            .Select(static line => line.Trim())
            .FirstOrDefault(static line => line.StartsWith("CONVEX_SELF_HOSTED_URL=", StringComparison.Ordinal));
        var adminKey = lines
            .Select(static line => line.Trim())
            .FirstOrDefault(static line => line.StartsWith("CONVEX_SELF_HOSTED_ADMIN_KEY=", StringComparison.Ordinal));

        if (string.IsNullOrEmpty(backendUrl) || string.IsNullOrEmpty(adminKey))
        {
            throw new InvalidOperationException(
                $"Convex self-hosted credentials are missing from '{EnvFilePath}'. Re-run `pnpm dev` so the Convex sync layer can refresh them.");
        }

        return (
            backendUrl["CONVEX_SELF_HOSTED_URL=".Length..],
            adminKey["CONVEX_SELF_HOSTED_ADMIN_KEY=".Length..]);
    }
}

internal sealed record ConvexResources(
    Aspire.Hosting.ApplicationModel.IResourceBuilder<Aspire.Hosting.ApplicationModel.ExecutableResource> Stack,
    Aspire.Hosting.ApplicationModel.IResourceBuilder<Aspire.Hosting.ApplicationModel.ExecutableResource> Sync,
    Aspire.Hosting.ApplicationModel.EndpointReference BackendEndpoint);

internal static class ConvexLayer
{
    public static ConvexDeployment GetDeployment(AppHostPaths paths) =>
        new(paths.ConvexEnvFile);

    public static ConvexResources Add(IDistributedApplicationBuilder builder, AppHostPaths paths)
    {
        var stack = builder.AddExecutable(
                "convex-stack",
                "bash",
                paths.ScriptsRoot,
                "convex-stack.sh",
                paths.ConvexRoot,
                "up")
            .WithWorkingDirectory(paths.ScriptsRoot)
            .WithHttpEndpoint(name: "backend-api", env: "PORT")
            .WithUrlForEndpoint("backend-api", static url => url.DisplayText = "Convex Backend API")
            .WithHttpEndpoint(name: "site-proxy", env: "SITE_PROXY_PORT")
            .WithUrlForEndpoint("site-proxy", static url => url.DisplayText = "Convex HTTP Actions")
            .WithHttpEndpoint(name: "dashboard-ui", env: "DASHBOARD_PORT")
            .WithUrlForEndpoint("dashboard-ui", static url => url.DisplayText = "Convex Dashboard");

        var backendEndpoint = stack.GetEndpoint("backend-api");

        var sync = builder.AddExecutable(
                "convex-sync",
                "bash",
                paths.ScriptsRoot,
                "convex-sync.sh",
                paths.RepoRoot,
                paths.ConvexRoot,
                paths.ConvexEnvFile)
            .WithWorkingDirectory(paths.ScriptsRoot)
            .WithEnvironment("CONVEX_SELF_HOSTED_URL", backendEndpoint)
            .WaitFor(stack);

        return new ConvexResources(stack, sync, backendEndpoint);
    }
}
