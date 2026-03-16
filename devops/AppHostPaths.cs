internal sealed record AppHostPaths(
    string RepoRoot,
    string DevopsRoot,
    string ScriptsRoot,
    string ConvexRoot,
    string ConvexEnvFile)
{
    public static AppHostPaths FromBaseDirectory(string baseDirectory)
    {
        var repoRoot = RepoRootLocator.GetRepoRoot(baseDirectory);
        var devopsRoot = Path.Combine(repoRoot, "devops");
        var scriptsRoot = Path.Combine(devopsRoot, "scripts");
        var convexRoot = Path.Combine(devopsRoot, "convex");
        var convexEnvFile = Path.Combine(convexRoot, ".env.self-hosted.local");

        return new AppHostPaths(
            repoRoot,
            devopsRoot,
            scriptsRoot,
            convexRoot,
            convexEnvFile);
    }
}
