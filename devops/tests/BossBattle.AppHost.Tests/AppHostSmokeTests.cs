using System.Diagnostics;
using Microsoft.Playwright;

namespace BossBattle.AppHost.Tests;

public sealed class AppHostSmokeTests
{
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromMinutes(5);

    [Fact]
    public async Task HostAndManualJoinPagesLoadInChromiumThroughAspire()
    {
        using var cts = new CancellationTokenSource(DefaultTimeout);
        var cancellationToken = cts.Token;

        var appHost = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.AppHost>(cancellationToken);

        appHost.Services.ConfigureHttpClientDefaults(static clientBuilder =>
        {
            clientBuilder.AddStandardResilienceHandler();
        });

        await using var app = await appHost
            .BuildAsync(cancellationToken)
            .WaitAsync(DefaultTimeout, cancellationToken);

        await app.StartAsync(cancellationToken).WaitAsync(DefaultTimeout, cancellationToken);

        using var httpClient = app.CreateHttpClient("web-app");
        var baseAddress = await WaitForHomepageAsync(httpClient, cancellationToken);

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(
            new BrowserTypeLaunchOptions
            {
                Headless = true,
            });

        var page = await browser.NewPageAsync();
        var response = await page.GotoAsync(
            baseAddress.ToString(),
            new PageGotoOptions
            {
                WaitUntil = WaitUntilState.DOMContentLoaded,
            });

        Assert.NotNull(response);
        Assert.True(response.Ok, "Expected the home route to load successfully in Chromium.");
        Assert.Equal("Boss Battle", await page.TitleAsync());

        await ExpectMainTextAsync(page, "Boss Battle Lobby");
        await ExpectHeadingAsync(page, "Start a Boss Battle session.");
        await ExpectButtonAsync(page, "Create Session");

        var joinResponse = await page.GotoAsync(
            new Uri(baseAddress, "/join").ToString(),
            new PageGotoOptions
            {
                WaitUntil = WaitUntilState.DOMContentLoaded,
            });

        Assert.NotNull(joinResponse);
        Assert.True(joinResponse.Ok, "Expected the manual join route to load successfully in Chromium.");

        await ExpectMainTextAsync(page, "Phone Join");
        await ExpectHeadingAsync(page, "Enter the code from the projector.");
        await ExpectButtonAsync(page, "Continue To Join");
    }

    private static async Task<Uri> WaitForHomepageAsync(HttpClient httpClient, CancellationToken cancellationToken)
    {
        if (httpClient.BaseAddress is null)
        {
            throw new InvalidOperationException("The Aspire web-app endpoint did not provide a base address.");
        }

        var started = Stopwatch.StartNew();

        while (started.Elapsed < DefaultTimeout)
        {
            try
            {
                using var response = await httpClient.GetAsync("/", cancellationToken);
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    return httpClient.BaseAddress;
                }
            }
            catch (HttpRequestException)
            {
                // The AppHost is still bringing resources online.
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        throw new TimeoutException("Timed out waiting for the Aspire web-app endpoint to serve the home route.");
    }

    private static async Task ExpectHeadingAsync(IPage page, string heading)
    {
        await page
            .GetByRole(AriaRole.Heading, new PageGetByRoleOptions { Name = heading, Exact = true })
            .WaitForAsync();
    }

    private static async Task ExpectMainTextAsync(IPage page, string text)
    {
        await page
            .GetByRole(AriaRole.Main)
            .GetByText(text)
            .WaitForAsync();
    }

    private static async Task ExpectButtonAsync(IPage page, string name)
    {
        await page
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = name, Exact = true })
            .WaitForAsync();
    }
}
