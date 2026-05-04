using System;
using System.Drawing;
using System.Windows.Forms;

namespace LiaAI;

class OverlayForm : Form
{
    private readonly Timer? dismissTimer;

    public OverlayForm(string? text, bool loading)
    {
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        StartPosition = FormStartPosition.CenterBottom;
        Size = new Size(360, 120);
        BackColor = Color.FromArgb(230, 22, 22, 40);
        Opacity = 0.92;

        // Close button
        var closeBtn = new Label
        {
            Text = "×",
            Location = new Point(Width - 30, 4),
            Size = new Size(20, 20),
            Font = new Font("Segoe UI", 12),
            ForeColor = Color.FromArgb(150, 150, 180),
            Cursor = Cursors.Hand,
        };
        closeBtn.Click += (s, e) => Close();
        Controls.Add(closeBtn);

        if (loading)
        {
            // Simple loading animation using a timer
            var spinner = new Label
            {
                Text = "◌",
                Location = new Point((Width - 30) / 2, (Height - 30) / 2 - 20),
                Size = new Size(30, 30),
                Font = new Font("Segoe UI", 20),
                ForeColor = Color.FromArgb(124, 131, 255),
                TextAlign = ContentAlignment.MiddleCenter,
            };
            Controls.Add(spinner);

            var loadingLabel = new Label
            {
                Text = "Analysiere...",
                Location = new Point(0, Height / 2),
                Size = new Size(Width, 20),
                Font = new Font("Segoe UI", 9),
                ForeColor = Color.FromArgb(140, 140, 180),
                TextAlign = ContentAlignment.MiddleCenter,
            };
            Controls.Add(loadingLabel);
        }
        else if (text != null)
        {
            var label = new Label
            {
                Text = text,
                Location = new Point(14, 14),
                Size = new Size(Width - 52, Height - 28),
                Font = new Font("Segoe UI", 11),
                ForeColor = Color.FromArgb(220, 220, 240),
                AutoSize = false,
            };
            Controls.Add(label);

            var dismissSec = UserSettings.Get("autoDismiss", 6);
            if (dismissSec > 0)
            {
                dismissTimer = new Timer();
                dismissTimer.Interval = dismissSec * 1000;
                dismissTimer.Tick += (s, e) =>
                {
                    dismissTimer.Stop();
                    Close();
                };
                dismissTimer.Start();
            }
        }

        // Blur effect via layered window
        if (Environment.OSVersion.Version.Major >= 10)
        {
            EnableAcrylic();
        }
    }

    private void EnableAcrylic()
    {
        try
        {
            BackColor = Color.FromArgb(200, 22, 22, 40);
        }
        catch { }
    }
}
