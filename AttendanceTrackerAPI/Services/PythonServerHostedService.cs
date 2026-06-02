using System.Diagnostics;

namespace AttendanceTrackerAPI.Services;

public class PythonServerHostedService : IHostedService, IDisposable
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<PythonServerHostedService> _logger;
    private Process? _process;

    public PythonServerHostedService(IWebHostEnvironment env, ILogger<PythonServerHostedService> logger)
    {
        _env = env;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        var scriptPath = Path.Combine(_env.ContentRootPath, "python", "server.py");
        if (!File.Exists(scriptPath))
        {
            _logger.LogError("Python server script not found at {ScriptPath}", scriptPath);
            return Task.CompletedTask;
        }

        _logger.LogInformation("Starting Python Flask server for DeepFace verification...");

        var startInfo = new ProcessStartInfo
        {
            FileName = "python",
            Arguments = $"\"{scriptPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        _process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };

        _process.OutputDataReceived += (sender, args) =>
        {
            if (!string.IsNullOrEmpty(args.Data))
                _logger.LogInformation("[Python] {Message}", args.Data);
        };

        _process.ErrorDataReceived += (sender, args) =>
        {
            if (!string.IsNullOrEmpty(args.Data))
                _logger.LogWarning("[Python Log] {Message}", args.Data);
        };

        if (_process.Start())
        {
            _process.BeginOutputReadLine();
            _process.BeginErrorReadLine();
            _logger.LogInformation("Python Flask server started with PID {PID}", _process.Id);
        }
        else
        {
            _logger.LogError("Failed to start Python Flask server process.");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stopping Python Flask server...");

        if (_process != null && !_process.HasExited)
        {
            try
            {
                _process.Kill();
                _process.WaitForExit(2000);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while stopping Python Flask server.");
            }
        }

        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _process?.Dispose();
    }
}
