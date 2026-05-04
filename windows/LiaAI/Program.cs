using System;
using System.Windows.Forms;

namespace LiaAI;

static class Program
{
    [STAThread]
    static void Main()
    {
        Application.SetHighDpiMode(HighDpiMode.SystemAware);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        var app = new LiaAIApp();
        app.Run();
    }
}

class LiaAIApp : ApplicationContext
{
    private NotifyIcon? trayIcon;
    private readonly HotkeyManager hotkeyManager;
    private OverlayForm? overlayForm;

    public LiaAIApp()
    {
        hotkeyManager = new HotkeyManager();
        SetupTray();
        RegisterHotkeys();
    }

    private void SetupTray()
    {
        trayIcon = new NotifyIcon
        {
            Text = "LiaAI",
            Visible = true,
        };

        // Simple empty icon fallback
        using var bmp = new System.Drawing.Bitmap(16, 16);
        using var g = System.Drawing.Graphics.FromImage(bmp);
        g.Clear(System.Drawing.Color.FromArgb(124, 131, 255));
        trayIcon.Icon = System.Drawing.Icon.FromHandle(bmp.GetHicon());

        var menu = new ContextMenuStrip();
        menu.Items.Add("Analysieren (Ctrl+Shift+Y)", null, (s, e) => TriggerAnalysis());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Einstellungen", null, (s, e) => OpenSettings());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Beenden", null, (s, e) => ExitApp());
        trayIcon.ContextMenuStrip = menu;
    }

    private void RegisterHotkeys()
    {
        hotkeyManager.RegisterHotkey(Keys.Y, true, true, false, TriggerAnalysis);
        hotkeyManager.RegisterHotkey(Keys.K, true, true, false, () =>
        {
            var text = NativeClipboard.GetSelectedText();
            if (!string.IsNullOrEmpty(text))
                TriggerAnalysis(text);
        });
    }

    public void TriggerAnalysis(string? contextText = null)
    {
        ShowOverlay(null, true);

        Task.Run(async () =>
        {
            try
            {
                var screenshot = ScreenshotService.CaptureActiveWindow();
                var base64 = Convert.ToBase64String(screenshot);
                var answer = await GeminiService.AnalyzeImageAsync(base64);

                BeginInvoke(() => ShowOverlay(answer, false));
            }
            catch (Exception ex)
            {
                BeginInvoke(() => ShowOverlay($"Fehler: {ex.Message}", false));
            }
        });
    }

    private void ShowOverlay(string? text, bool loading)
    {
        overlayForm?.Close();
        overlayForm = new OverlayForm(text, loading);
        overlayForm.Show();
    }

    private void OpenSettings()
    {
        new SettingsForm().ShowDialog();
    }

    private void ExitApp()
    {
        trayIcon?.Dispose();
        hotkeyManager.Dispose();
        Application.Exit();
    }
}
