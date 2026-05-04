using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace LiaAI;

class HotkeyManager : IDisposable
{
    [DllImport("user32.dll")]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

    [DllImport("user32.dll")]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    private const uint MOD_CONTROL = 0x0002;
    private const uint MOD_SHIFT = 0x0004;
    private const uint MOD_ALT = 0x0001;

    private readonly List<int> registeredIds = new();
    private int nextId = 1;
    private HotkeyWindow? messageWindow;

    public void RegisterHotkey(Keys key, bool ctrl, bool shift, bool alt, Action action)
    {
        if (messageWindow == null)
        {
            messageWindow = new HotkeyWindow();
            messageWindow.CreateHandle();
        }

        uint modifiers = 0;
        if (ctrl) modifiers |= MOD_CONTROL;
        if (shift) modifiers |= MOD_SHIFT;
        if (alt) modifiers |= MOD_ALT;

        int id = nextId++;
        if (RegisterHotKey(messageWindow.Handle, id, modifiers, (uint)key))
        {
            registeredIds.Add(id);
            messageWindow.RegisterAction(id, action);
        }
    }

    public void Dispose()
    {
        if (messageWindow != null)
        {
            foreach (var id in registeredIds)
                UnregisterHotKey(messageWindow.Handle, id);
            messageWindow.DestroyHandle();
            messageWindow = null;
        }
    }

    private class HotkeyWindow : NativeWindow
    {
        private readonly Dictionary<int, Action> actions = new();

        public void RegisterAction(int id, Action action) => actions[id] = action;

        protected override void WndProc(ref Message m)
        {
            const int WM_HOTKEY = 0x0312;
            if (m.Msg == WM_HOTKEY && actions.TryGetValue(m.WParam.ToInt32(), out var action))
            {
                action();
            }
            base.WndProc(ref m);
        }
    }
}
