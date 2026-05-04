using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

namespace LiaAI;

static class ScreenshotService
{
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    static extern bool IsWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [StructLayout(LayoutKind.Sequential)]
    struct RECT
    {
        public int Left, Top, Right, Bottom;
        public int Width => Right - Left;
        public int Height => Bottom - Top;
    }

    private const uint GW_HWNDNEXT = 2;
    private const uint GW_OWNER = 4;

    public static byte[] CaptureActiveWindow()
    {
        var hwnd = GetForegroundWindow();

        // Check if window is valid
        if (hwnd == IntPtr.Zero || !IsWindow(hwnd))
            return CaptureFullScreen();

        if (!IsWindowVisible(hwnd))
            return CaptureFullScreen();

        // Check for owner/popup windows
        var owner = GetWindow(hwnd, GW_OWNER);
        if (owner != IntPtr.Zero && IsWindowVisible(owner))
            hwnd = owner;

        if (!GetWindowRect(hwnd, out var rect))
            return CaptureFullScreen();

        int width = rect.Width;
        int height = rect.Height;

        if (width <= 0 || height <= 0)
            return CaptureFullScreen();

        // Enforce maximum dimensions
        if (width > 4096) width = 4096;
        if (height > 4096) height = 4096;

        using var bitmap = new Bitmap(width, height, PixelFormat.Format24bppRgb);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.CopyFromScreen(rect.Left, rect.Top, 0, 0, new Size(width, height));

        using var ms = new MemoryStream();
        var encoderParams = new EncoderParameters(1);
        encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 80L);
        var jpegEncoder = GetEncoderInfo("image/jpeg");
        bitmap.Save(ms, jpegEncoder, encoderParams);
        return ms.ToArray();
    }

    private static byte[] CaptureFullScreen()
    {
        var bounds = SystemInformation.VirtualScreen;
        using var bitmap = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format24bppRgb);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.CopyFromScreen(bounds.X, bounds.Y, 0, 0, bounds.Size);

        using var ms = new MemoryStream();
        var encoderParams = new EncoderParameters(1);
        encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 80L);
        var jpegEncoder = GetEncoderInfo("image/jpeg");
        bitmap.Save(ms, jpegEncoder, encoderParams);
        return ms.ToArray();
    }

    private static ImageCodecInfo GetEncoderInfo(string mimeType)
    {
        foreach (var codec in ImageCodecInfo.GetImageEncoders())
            if (codec.MimeType == mimeType)
                return codec;
        return ImageCodecInfo.GetImageEncoders()[1]; // JPEG fallback
    }
}
