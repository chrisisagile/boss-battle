internal static class RepoRootLocator
{
    public static string GetRepoRoot(string startDirectory)
    {
        var current = startDirectory;

        while (!string.IsNullOrEmpty(current))
        {
            if (File.Exists(Path.Combine(current, "package.json")))
            {
                return current;
            }

            current = Directory.GetParent(current)?.FullName ?? string.Empty;
        }

        throw new InvalidOperationException("Could not locate the repository root from the AppHost base directory.");
    }
}
