using System;
using System.Drawing;
using System.Windows.Forms;

namespace LiaAI;

class SettingsForm : Form
{
    private TextBox apiKeyBox;
    private ComboBox modelCombo;
    private ComboBox displayModeCombo;
    private ComboBox autoDismissCombo;
    private TextBox promptBox;
    private Label statusLabel;

    public SettingsForm()
    {
        Text = "LiaAI Einstellungen";
        Size = new Size(380, 480);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;

        var y = 10;

        // API Key
        AddLabel(ref y, "Gemini API Key");
        apiKeyBox = new TextBox { Location = new Point(12, y), Width = 310, UseSystemPasswordChar = true };
        Controls.Add(apiKeyBox);
        var showBtn = new Button { Text = "👁", Location = new Point(326, y), Width = 30, Height = 22 };
        showBtn.Click += (s, e) => apiKeyBox.UseSystemPasswordChar = !apiKeyBox.UseSystemPasswordChar;
        Controls.Add(showBtn);
        y += 28;
        AddHint(ref y, "Von aistudio.google.com/apikey");
        y += 10;

        // Model
        AddLabel(ref y, "Modell");
        modelCombo = new ComboBox { Location = new Point(12, y), Width = 344, DropDownStyle = ComboBoxStyle.DropDownList };
        modelCombo.Items.AddRange(new object[] { "Gemini 2.5 Flash (schnell)", "Gemini 2.5 Pro (Qualität)" });
        Controls.Add(modelCombo);
        y += 32;

        // Display Mode
        AddLabel(ref y, "Anzeige-Modus");
        displayModeCombo = new ComboBox { Location = new Point(12, y), Width = 344, DropDownStyle = ComboBoxStyle.DropDownList };
        displayModeCombo.Items.AddRange(new object[] { "Normal", "Stealth", "Clipboard" });
        Controls.Add(displayModeCombo);
        y += 32;

        // Auto-Dismiss
        AddLabel(ref y, "Auto-Dismiss (Stealth)");
        autoDismissCombo = new ComboBox { Location = new Point(12, y), Width = 344, DropDownStyle = ComboBoxStyle.DropDownList };
        autoDismissCombo.Items.AddRange(new object[] { "3 Sekunden", "6 Sekunden", "10 Sekunden", "20 Sekunden" });
        Controls.Add(autoDismissCombo);
        y += 32;

        // Prompt
        AddLabel(ref y, "Eigener System-Prompt");
        promptBox = new TextBox { Location = new Point(12, y), Width = 344, Height = 60, Multiline = true, ScrollBars = ScrollBars.Vertical };
        Controls.Add(promptBox);
        y += 70;

        // Save
        var saveBtn = new Button { Text = "Speichern", Location = new Point(12, y), Width = 100 };
        saveBtn.Click += (s, e) => Save();
        Controls.Add(saveBtn);

        statusLabel = new Label { Location = new Point(120, y + 4), Size = new Size(240, 16) };
        Controls.Add(statusLabel);

        LoadSettings();
    }

    private void AddLabel(ref int y, string text)
    {
        var label = new Label { Text = text, Location = new Point(12, y), Width = 344, Font = new Font("Segoe UI", 8, FontStyle.Bold), ForeColor = Color.Gray };
        Controls.Add(label);
        y += 18;
    }

    private void AddHint(ref int y, string text)
    {
        var hint = new Label { Text = text, Location = new Point(12, y), Width = 344, Font = new Font("Segoe UI", 7), ForeColor = Color.FromArgb(100, 130, 255) };
        Controls.Add(hint);
        y += 14;
    }

    private void LoadSettings()
    {
        apiKeyBox.Text = UserSettings.Get("geminiKey", "");
        promptBox.Text = UserSettings.Get("customPrompt", "");

        var model = UserSettings.Get("model", "gemini-2.5-flash");
        modelCombo.SelectedIndex = model == "gemini-2.5-pro" ? 1 : 0;

        var mode = UserSettings.Get("displayMode", "normal");
        displayModeCombo.SelectedIndex = mode switch { "stealth" => 1, "clipboard" => 2, _ => 0 };

        var dismiss = UserSettings.Get("autoDismiss", 6);
        autoDismissCombo.SelectedIndex = dismiss switch { 3 => 0, 10 => 2, 20 => 3, _ => 1 };
    }

    private void Save()
    {
        UserSettings.Set("geminiKey", apiKeyBox.Text);
        UserSettings.Set("customPrompt", promptBox.Text);

        UserSettings.Set("model", modelCombo.SelectedIndex == 1 ? "gemini-2.5-pro" : "gemini-2.5-flash");
        UserSettings.Set("displayMode", displayModeCombo.SelectedIndex switch { 1 => "stealth", 2 => "clipboard", _ => "normal" });
        UserSettings.Set("autoDismiss", autoDismissCombo.SelectedIndex switch { 0 => 3, 2 => 10, 3 => 20, _ => 6 });

        statusLabel.Text = "Gespeichert!";
        statusLabel.ForeColor = Color.Green;
        var t = new Timer { Interval = 2000 };
        t.Tick += (s, e) => { statusLabel.Text = ""; t.Stop(); };
        t.Start();
    }
}
