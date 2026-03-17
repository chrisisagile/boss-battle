using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.Playwright;

namespace BossBattle.AppHost.Tests;

public sealed class AppHostSmokeTests
{
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromMinutes(5);
    private static readonly IReadOnlyDictionary<string, string> IncorrectAnswersByPrompt =
        new Dictionary<string, string>
        {
            ["Which empire built the Colosseum?"] = "Ottoman Empire",
            ["What planet is known as the Red Planet?"] = "Venus",
            ["In chess, which piece can move in an L-shape?"] = "Bishop",
            ["Who wields the hammer Mjolnir in Norse mythology?"] = "Loki",
            ["Which treaty ended the Thirty Years' War in 1648?"] = "Treaty of Utrecht",
            ["What is the chemical symbol for sodium?"] = "So",
            ["How many standard tiles are in a complete Mahjong set?"] = "108",
            ["Which hero completed the Twelve Labors in Greek mythology?"] = "Perseus",
            ["Who was the first woman to serve as Prime Minister of the United Kingdom?"] = "Theresa May",
            ["What particle gives the Higgs boson its nickname as the 'God particle' focus in popular media?"] =
                "It generates gravity directly",
            ["In Dungeons & Dragons, what ability score usually drives a wizard's spellcasting?"] = "Wisdom",
            ["Which Egyptian god is commonly depicted with the head of a jackal?"] = "Horus",
        };

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

    [Fact]
    public async Task LandingPageCanCreateAndResumeALiveSession()
    {
        var harness = await CreateGameLoopHarnessAsync();
        await using var _ = harness;

        var joinCode = await CreateSessionFromLandingPageAsync(
            harness.HostPage,
            harness.BaseAddress);

        await harness.HostPage.GotoAsync(
            harness.BaseAddress.ToString(),
            new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });
        await harness.HostPage.WaitForLoadStateAsync(LoadState.NetworkIdle);

        await harness.HostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Resume Session", Exact = true })
            .WaitForAsync();

        await harness.HostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Resume Session", Exact = true })
            .ClickAsync();
        await harness.HostPage.WaitForFunctionAsync(
            "() => window.location.pathname.startsWith('/host/')",
            options: new PageWaitForFunctionOptions
            {
                Timeout = (float)DefaultTimeout.TotalMilliseconds,
            });

        await ExpectMainTextAsync(harness.HostPage, "Live Lobby");
        await harness.HostPage.GetByText(joinCode, new PageGetByTextOptions { Exact = true }).WaitForAsync();
    }

    [Fact]
    public async Task HostProjectorViewShowsGameLoopProgressAcrossTwoRounds()
    {
        var harness = await CreateGameLoopHarnessAsync();
        await using var _ = harness;

        await StartSessionWithPlayersAsync(
            harness.HostPage,
            harness.PlayerOnePage,
            harness.PlayerTwoPage,
            harness.BaseAddress,
            questionCount: 2);

        await PlayQuizRoundWithoutActionPointsAsync(
            harness.HostPage,
            harness.PlayerOnePage,
            harness.PlayerTwoPage,
            roundNumber: 1);

        await ExpectMainTextAsync(harness.HostPage, "Battle Arena");
        await ExpectHeadingAsync(harness.HostPage, "Battle Dialogue");
        await ExpectHeadingAsync(harness.HostPage, "Round 2");
        await harness.HostPage.GetByText("Joined Players (2)", new PageGetByTextOptions { Exact = true }).WaitForAsync();
        await ExpectHeadingAsync(harness.PlayerOnePage, "Round 2 begins now.");
        await ExpectHeadingAsync(harness.PlayerTwoPage, "Round 2 begins now.");
    }

    [Fact]
    public async Task PlayerPhonesCanSubmitFullQuizSheetsAcrossBackToBackRounds()
    {
        var harness = await CreateGameLoopHarnessAsync();
        await using var _ = harness;

        await StartSessionWithPlayersAsync(
            harness.HostPage,
            harness.PlayerOnePage,
            harness.PlayerTwoPage,
            harness.BaseAddress,
            questionCount: 2);

        await PlayQuizRoundWithoutActionPointsAsync(
            harness.HostPage,
            harness.PlayerOnePage,
            harness.PlayerTwoPage,
            roundNumber: 1);

        await EnterRoundAndAnswerSheetAsync(harness.PlayerOnePage, roundNumber: 2);
        await EnterRoundAndAnswerSheetAsync(harness.PlayerTwoPage, roundNumber: 2);

        await harness.PlayerOnePage
            .GetByText("That question expired before it could be scored.", new PageGetByTextOptions { Exact = true })
            .WaitForAsync(new LocatorWaitForOptions { State = WaitForSelectorState.Detached, Timeout = 1_000 });
        await harness.PlayerTwoPage
            .GetByText("That question expired before it could be scored.", new PageGetByTextOptions { Exact = true })
            .WaitForAsync(new LocatorWaitForOptions { State = WaitForSelectorState.Detached, Timeout = 1_000 });

        await ExpectHeadingAsync(harness.HostPage, "Round 2");
        await harness.HostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Continue Battle", Exact = true })
            .WaitForAsync();
        await ExpectHeadingAsync(harness.PlayerOnePage, "Battle Dialogue");
        await ExpectHeadingAsync(harness.PlayerTwoPage, "Battle Dialogue");
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

    private static string ExtractJoinCodeFromHostUrl(string url)
    {
        var match = Regex.Match(url, @"/host/(?<joinCode>[A-Z0-9]+)$");
        if (!match.Success)
        {
            throw new InvalidOperationException($"Could not extract a join code from host URL '{url}'.");
        }

        return match.Groups["joinCode"].Value;
    }

    private static async Task JoinPlayerAsync(
        IPage page,
        Uri baseAddress,
        string joinCode,
        string displayName)
    {
        var response = await page.GotoAsync(
            new Uri(baseAddress, $"/join/{joinCode}").ToString(),
            new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        Assert.NotNull(response);
        Assert.True(response.Ok, $"Expected join route /join/{joinCode} to load.");

        await page.GetByLabel("Display Name", new PageGetByLabelOptions { Exact = true }).FillAsync(displayName);
        await page
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Join Battle", Exact = true })
            .ClickAsync();

        await page.GetByText(displayName, new PageGetByTextOptions { Exact = true }).WaitForAsync();
        await page.GetByText("Stay on this screen and watch the projector for the next prompt.").WaitForAsync();
    }

    private static async Task EnterRoundAndAnswerSheetAsync(IPage page, int roundNumber)
    {
        await ExpectHeadingAsync(page, $"Round {roundNumber} begins now.");
        await page
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Enter Quiz", Exact = true })
            .WaitForAsync();
        await page
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Enter Quiz", Exact = true })
            .ClickAsync();

        await page
            .GetByText("Answer all 2 questions before locking your sheet.", new PageGetByTextOptions { Exact = true })
            .WaitForAsync();
        await page
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Lock Answers", Exact = true })
            .WaitForAsync();

        var visibleAnswerChoices = await page.EvaluateAsync<string[]>(
            @"() => Array.from(document.querySelectorAll('label')).map(
                (element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean)");
        var normalizedWrongAnswers = IncorrectAnswersByPrompt.Values
            .Select((answer) => Regex.Replace(answer, @"\s+", " ").Trim())
            .ToHashSet(StringComparer.Ordinal);
        var expectedWrongAnswers = visibleAnswerChoices
            .Where((choice) => normalizedWrongAnswers.Contains(choice))
            .Distinct()
            .ToArray();
        Assert.True(
            expectedWrongAnswers.Length == 2,
            $"Expected two deterministic wrong answers but found {expectedWrongAnswers.Length}. Visible labels: {string.Join(" | ", visibleAnswerChoices)}");
        foreach (var wrongAnswer in expectedWrongAnswers)
        {
            await page
                .GetByLabel(wrongAnswer, new PageGetByLabelOptions { Exact = true })
                .CheckAsync();
        }

        await page
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Lock Answers", Exact = true })
            .ClickAsync();
    }

    private static async Task<GameLoopHarness> CreateGameLoopHarnessAsync()
    {
        using var cts = new CancellationTokenSource(DefaultTimeout);
        var cancellationToken = cts.Token;

        var appHost = await DistributedApplicationTestingBuilder
            .CreateAsync<Projects.AppHost>(cancellationToken);

        appHost.Services.ConfigureHttpClientDefaults(static clientBuilder =>
        {
            clientBuilder.AddStandardResilienceHandler();
        });

        var app = await appHost
            .BuildAsync(cancellationToken)
            .WaitAsync(DefaultTimeout, cancellationToken);
        await app.StartAsync(cancellationToken).WaitAsync(DefaultTimeout, cancellationToken);

        var httpClient = app.CreateHttpClient("web-app");
        var baseAddress = await WaitForHomepageAsync(httpClient, cancellationToken);

        var playwright = await Playwright.CreateAsync();
        var browser = await playwright.Chromium.LaunchAsync(
            new BrowserTypeLaunchOptions
            {
                Headless = true,
            });

        var hostContext = await browser.NewContextAsync();
        var playerOneContext = await browser.NewContextAsync();
        var playerTwoContext = await browser.NewContextAsync();

        return new GameLoopHarness(
            app,
            httpClient,
            playwright,
            browser,
            hostContext,
            playerOneContext,
            playerTwoContext,
            await hostContext.NewPageAsync(),
            await playerOneContext.NewPageAsync(),
            await playerTwoContext.NewPageAsync(),
            baseAddress);
    }

    private static async Task StartSessionWithPlayersAsync(
        IPage hostPage,
        IPage playerOnePage,
        IPage playerTwoPage,
        Uri baseAddress,
        int questionCount)
    {
        var joinCode = await CreateSessionFromLandingPageAsync(hostPage, baseAddress);
        await hostPage.GetByText("Joined Players (0)", new PageGetByTextOptions { Exact = true }).WaitForAsync();

        await JoinPlayerAsync(playerOnePage, baseAddress, joinCode, "Ari");
        await JoinPlayerAsync(playerTwoPage, baseAddress, joinCode, "Jules");

        await hostPage.GetByText("Joined Players (2)", new PageGetByTextOptions { Exact = true }).WaitForAsync();
        await hostPage.GetByText("Ari", new PageGetByTextOptions { Exact = true }).WaitForAsync();
        await hostPage.GetByText("Jules", new PageGetByTextOptions { Exact = true }).WaitForAsync();

        var questionCountInput = hostPage.GetByRole(AriaRole.Spinbutton);
        await questionCountInput.FillAsync(questionCount.ToString());

        await hostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Start Game", Exact = true })
            .ClickAsync();

        await ExpectHeadingAsync(hostPage, "Round 1 begins now.");
        await ExpectHeadingAsync(playerOnePage, "Round 1 begins now.");
        await ExpectHeadingAsync(playerTwoPage, "Round 1 begins now.");
        await hostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Enter Quiz", Exact = true })
            .ClickAsync();
    }

    private static async Task<string> CreateSessionFromLandingPageAsync(
        IPage hostPage,
        Uri baseAddress)
    {
        await hostPage.GotoAsync(
            baseAddress.ToString(),
            new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });
        await hostPage.WaitForLoadStateAsync(LoadState.NetworkIdle);

        await hostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Create Session", Exact = true })
            .ClickAsync();
        await hostPage.WaitForFunctionAsync(
            "() => window.location.pathname.startsWith('/host/')",
            options: new PageWaitForFunctionOptions
            {
                Timeout = (float)DefaultTimeout.TotalMilliseconds,
            });

        await ExpectMainTextAsync(hostPage, "Live Lobby");
        var joinCode = ExtractJoinCodeFromHostUrl(hostPage.Url);
        await hostPage.GetByText(joinCode, new PageGetByTextOptions { Exact = true }).WaitForAsync();
        return joinCode;
    }

    private static async Task PlayQuizRoundWithoutActionPointsAsync(
        IPage hostPage,
        IPage playerOnePage,
        IPage playerTwoPage,
        int roundNumber)
    {
        await EnterRoundAndAnswerSheetAsync(playerOnePage, roundNumber);
        await EnterRoundAndAnswerSheetAsync(playerTwoPage, roundNumber);

        await ExpectHeadingAsync(playerOnePage, "Battle Dialogue");
        await ExpectHeadingAsync(playerTwoPage, "Battle Dialogue");
        await hostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Continue Battle", Exact = true })
            .WaitForAsync();

        await hostPage
            .GetByRole(AriaRole.Button, new PageGetByRoleOptions { Name = "Continue Battle", Exact = true })
            .ClickAsync();
    }

    private sealed class GameLoopHarness : IAsyncDisposable
    {
        public GameLoopHarness(
            IAsyncDisposable app,
            HttpClient httpClient,
            IPlaywright playwright,
            IBrowser browser,
            IBrowserContext hostContext,
            IBrowserContext playerOneContext,
            IBrowserContext playerTwoContext,
            IPage hostPage,
            IPage playerOnePage,
            IPage playerTwoPage,
            Uri baseAddress)
        {
            App = app;
            HttpClient = httpClient;
            Playwright = playwright;
            Browser = browser;
            HostContext = hostContext;
            PlayerOneContext = playerOneContext;
            PlayerTwoContext = playerTwoContext;
            HostPage = hostPage;
            PlayerOnePage = playerOnePage;
            PlayerTwoPage = playerTwoPage;
            BaseAddress = baseAddress;
        }

        public IAsyncDisposable App { get; }

        public Uri BaseAddress { get; }

        public IBrowser Browser { get; }

        public HttpClient HttpClient { get; }

        public IBrowserContext HostContext { get; }

        public IPage HostPage { get; }

        public IPlaywright Playwright { get; }

        public IBrowserContext PlayerOneContext { get; }

        public IPage PlayerOnePage { get; }

        public IBrowserContext PlayerTwoContext { get; }

        public IPage PlayerTwoPage { get; }

        public async ValueTask DisposeAsync()
        {
            HttpClient.Dispose();
            await HostContext.DisposeAsync();
            await PlayerOneContext.DisposeAsync();
            await PlayerTwoContext.DisposeAsync();
            await Browser.DisposeAsync();
            Playwright.Dispose();
            await App.DisposeAsync();
        }
    }
}
