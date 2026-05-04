using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

namespace LiaAI;

static class NativeClipboard
{
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern IntPtr GetFocus();

    [DllImport("user32.dll")]
    static extern int SendMessage(IntPtr hWnd, int msg, int wParam, StringBuilder lParam);

    private const int WM_GETTEXT = 0x000D;
    private const int WM_GETTEXTLENGTH = 0x000E;

    public static string GetSelectedText()
    {
        try
        {
            if (Clipboard.ContainsText())
            {
                return Clipboard.GetText();
            }
        }
        catch { }

        return "";
    }
}
