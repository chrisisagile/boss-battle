internal sealed record AppHostPaths(
    string RepoRoot,
    string DevopsRoot,
    string ScriptsRoot,
    string ConvexRoot,
    string ConvexEnvFile,
    string ConvexComposeOverrideFile)
{
    public static AppHostPaths FromBaseDirectory(string baseDirectory)
    {
        var repoRoot = RepoRootLocator.GetRepoRoot(baseDirectory);
        var devopsRoot = Path.Combine(repoRoot, "devops");
        var scriptsRoot = Path.Combine(devopsRoot, "scripts");
        var convexRoot = Path.Combine(devopsRoot, "convex");
        var convexEnvFile = Path.Combine(convexRoot, ".env.self-hosted.local");
        var convexComposeOverrideFile = Path.Combine(devopsRoot, "convex-dashboard.compose.override.yml");

        return new AppHostPaths(
            repoRoot,
            devopsRoot,
            scriptsRoot,
            convexRoot,
            convexEnvFile,
            convexComposeOverrideFile);
    }
}
