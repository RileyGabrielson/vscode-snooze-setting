# Snooze Setting

A VS Code extension that allows you to temporarily override any VS Code setting for a configurable amount of time. Perfect for when you need to temporarily adjust settings for specific tasks without permanently changing your configuration.

## Features

- **Temporary Setting Override**: Snooze any VS Code setting for a specified duration
- **Automatic Restoration**: Settings automatically revert to their original values when the snooze period expires
- **Persistent Storage**: Snoozed settings persist across VS Code restarts
- **Easy Management**: List and clear snoozed settings with simple commands
- **Configurable Default Duration**: Set your preferred default snooze duration

## Commands

### Snooze Setting
Opens a dialog to snooze a specific setting:
1. Enter the setting name (e.g., `editor.fontSize`, `workbench.colorTheme`)
2. Enter the new value (in JSON format)
3. Specify the duration in minutes

**Command Palette**: `Snooze Setting: Snooze Setting`

### List Snoozed Settings
Shows all currently snoozed settings with their remaining time.

**Command Palette**: `Snooze Setting: List Snoozed Settings`

### Clear All Snoozed Settings
Immediately restores all snoozed settings to their original values.

**Command Palette**: `Snooze Setting: Clear All Snoozed Settings`

## Extension Settings

This extension contributes the following settings:

* `snoozeSetting.defaultDuration`: Default snooze duration in minutes (default: 30)

## Usage Examples

### Temporarily Increase Font Size
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Snooze Setting: Snooze Setting"
3. Enter setting name: `editor.fontSize`
4. Enter new value: `18`
5. Enter duration: `60` (minutes)

The font size will be increased to 18 for 1 hour, then automatically revert to your original setting.

### Temporarily Change Theme
1. Open Command Palette
2. Run "Snooze Setting: Snooze Setting"
3. Enter setting name: `workbench.colorTheme`
4. Enter new value: `"Dark+ (default dark)"`
5. Enter duration: `120` (2 hours)

### Check Snoozed Settings
1. Open Command Palette
2. Run "Snooze Setting: List Snoozed Settings"

You'll see output like:
```
Snoozed Settings:
• editor.fontSize: 18 (45 min left)
• workbench.colorTheme: "Dark+ (default dark)" (90 min left)
```

## How It Works

1. **Storage**: Snoozed settings are stored in VS Code's global state and persist across sessions
2. **Application**: When you snooze a setting, it's immediately applied to your VS Code configuration
3. **Cleanup**: The extension checks every minute for expired settings and automatically restores them
4. **Restoration**: When settings expire, you'll receive a notification showing which settings were restored

## Requirements

- VS Code 1.102.0 or higher

## Known Issues

- Settings that require VS Code restart to take effect may not work as expected
- Some workspace-specific settings may behave differently than global settings

## Release Notes

### 0.0.1

Initial release with core snooze functionality:
- Snooze any VS Code setting for configurable duration
- Automatic restoration of expired settings
- List and clear snoozed settings
- Persistent storage across VS Code restarts
- Configurable default duration

---

## Contributing

Feel free to submit issues and enhancement requests!

## License

This extension is provided as-is for educational and personal use.
