using Aspire.Hosting.Pipelines;
using Microsoft.Extensions.Logging;

internal static class DeployPipeline
{
    public static void Configure(
        IDistributedApplicationBuilder builder,
        AppHostPaths paths,
        ConvexDeployment convexDeployment)
    {
        builder.Pipeline.AddStep(
            "deploy-frontend",
            async context =>
            {
                var envFilePath = Path.GetTempFileName();

                try
                {
                    context.ReportingStep.Log(LogLevel.Information, "Writing self-hosted Convex deployment environment.", false);
                    var credentials = await convexDeployment.GetCredentialsAsync(context.CancellationToken);

                    await File.WriteAllTextAsync(
                        envFilePath,
                        string.Join(
                            Environment.NewLine,
                            [
                                $"CONVEX_SELF_HOSTED_URL={credentials.BackendUrl}",
                                $"CONVEX_SELF_HOSTED_ADMIN_KEY={credentials.AdminKey}",
                                string.Empty,
                            ]),
                        context.CancellationToken);

                    context.ReportingStep.Log(LogLevel.Information, "Running Convex deploy and Wrangler publish.", false);

                    await ProcessRunner.RunAsync(
                        "bash",
                        ["deploy-app.sh", paths.RepoRoot, envFilePath],
                        paths.ScriptsRoot,
                        context.CancellationToken);

                    await context.ReportingStep.SucceedAsync("Frontend deploy completed.", context.CancellationToken);
                }
                catch (Exception ex)
                {
                    await context.ReportingStep.FailAsync(ex.Message, context.CancellationToken);
                    throw;
                }
                finally
                {
                    if (File.Exists(envFilePath))
                    {
                        File.Delete(envFilePath);
                    }
                }
            },
            dependsOn: WellKnownPipelineSteps.Publish,
            requiredBy: WellKnownPipelineSteps.Deploy);
    }
}
