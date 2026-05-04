using Microsoft.Win32;

namespace LiaAI;

static class UserSettings
{
    private const string KeyPath = @"Software\LiaAI";

    public static void Set(string name, string value)
    {
        using var key = Registry.CurrentUser.CreateSubKey(KeyPath);
        key?.SetValue(name, value);
    }

    public static void Set(string name, int value)
    {
        Set(name, value.ToString());
    }

    public static string Get(string name, string defaultValue)
    {
        using var key = Registry.CurrentUser.OpenSubKey(KeyPath);
        return key?.GetValue(name)?.ToString() ?? defaultValue;
    }

    public static int Get(string name, int defaultValue)
    {
        var str = Get(name, defaultValue.ToString());
        return int.TryParse(str, out var val) ? val : defaultValue;
    }
}
