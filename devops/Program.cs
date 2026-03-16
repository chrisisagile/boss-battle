var builder = DistributedApplication.CreateBuilder(args);
var paths = AppHostPaths.FromBaseDirectory(AppContext.BaseDirectory);
var convexDeployment = ConvexLayer.GetDeployment(paths);

if (builder.ExecutionContext.IsRunMode)
{
    var convexResources = ConvexLayer.Add(builder, paths);
    WebAppLayer.Add(builder, paths, convexResources);
}

DeployPipeline.Configure(builder, paths, convexDeployment);

builder.Build().Run();
