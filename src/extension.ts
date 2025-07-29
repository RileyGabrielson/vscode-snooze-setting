import * as vscode from 'vscode';

interface SnoozedSetting {
    setting: string;
    originalValue: any;
    snoozedValue: any;
    expiresAt: number;
}

class SnoozeSettingManager {
    readonly snoozedSettings: Map<string, SnoozedSetting> = new Map();
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadSnoozedSettings();
        this.startCleanupTimer();
    }

    public restoreOriginalSetting(snoozedSetting: SnoozedSetting): void {
        vscode.workspace.getConfiguration().update(snoozedSetting.setting, snoozedSetting.originalValue, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Restored original setting: ${snoozedSetting.setting} = ${snoozedSetting.originalValue}`);
    }

    private loadSnoozedSettings(): void {
        const stored = this.context.globalState.get<SnoozedSetting[]>('snoozedSettings', []);
        this.snoozedSettings.clear();
        
        const now = Date.now();
        for (const setting of stored) {
            if (setting.expiresAt > now) {
                this.snoozedSettings.set(setting.setting, setting);
                this.applySnoozedSetting(setting);
            }
        }
    }

    private saveSnoozedSettings(): void {
        const settings = Array.from(this.snoozedSettings.values());
        this.context.globalState.update('snoozedSettings', settings);
    }

    private applySnoozedSetting(snoozedSetting: SnoozedSetting): void {
        vscode.workspace.getConfiguration().update(snoozedSetting.setting, snoozedSetting.snoozedValue, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Applied snoozed setting: ${snoozedSetting.setting} = ${snoozedSetting.snoozedValue}`);
    }

    private startCleanupTimer(): void {
        setInterval(() => {
            this.cleanupExpiredSettings();
        }, 60000); // Check every minute
    }

    private cleanupExpiredSettings(): void {
        const now = Date.now();
        const expiredSettings: string[] = [];

        for (const [settingKey, snoozedSetting] of this.snoozedSettings) {
            if (snoozedSetting.expiresAt <= now) {
                expiredSettings.push(settingKey);
                this.restoreOriginalSetting(snoozedSetting);
            }
        }

        for (const settingKey of expiredSettings) {
            this.snoozedSettings.delete(settingKey);
        }

        if (expiredSettings.length > 0) {
            this.saveSnoozedSettings();
            vscode.window.showInformationMessage(
                `Restored ${expiredSettings.length} setting(s) that were snoozed: ${expiredSettings.join(', ')}`
            );
        }
    }

    async snoozeSetting(): Promise<void> {
        // Get setting name
        const settingName = await vscode.window.showInputBox({
            prompt: 'Enter the setting name to snooze (e.g., "editor.fontSize")',
            placeHolder: 'editor.fontSize'
        });

        if (!settingName) {
            return;
        }

        const currentValue = vscode.workspace.getConfiguration().get(settingName);
        if (currentValue === undefined) {
            vscode.window.showErrorMessage(`Setting "${settingName}" not found`);
            return;
        }

        // Get new value
        const newValue = await vscode.window.showInputBox({
            prompt: `Enter new value for "${settingName}" (current: ${JSON.stringify(currentValue)})`,
            value: JSON.stringify(currentValue)
        });

        if (!newValue) {
            return;
        }

        let parsedValue: any;
        try {
            parsedValue = JSON.parse(newValue);
        } catch {
            vscode.window.showErrorMessage('Invalid JSON value');
            return;
        }

        // Get duration
        const defaultDuration = vscode.workspace.getConfiguration('snoozeSetting').get('defaultDuration', 30);
        const durationInput = await vscode.window.showInputBox({
            prompt: `Enter snooze duration in minutes (default: ${defaultDuration})`,
            value: defaultDuration.toString()
        });

        if (!durationInput) {
            return;
        }

        const duration = parseInt(durationInput, 10);
        if (isNaN(duration) || duration <= 0) {
            vscode.window.showErrorMessage('Invalid duration');
            return;
        }

        // Apply snooze
        const expiresAt = Date.now() + (duration * 60 * 1000);
        const snoozedSetting: SnoozedSetting = {
            setting: settingName,
            originalValue: currentValue,
            snoozedValue: parsedValue,
            expiresAt
        };

        this.snoozedSettings.set(settingName, snoozedSetting);
        this.applySnoozedSetting(snoozedSetting);
        this.saveSnoozedSettings();

        const expiryTime = new Date(expiresAt).toLocaleTimeString();
        vscode.window.showInformationMessage(
            `Snoozed "${settingName}" for ${duration} minutes (expires at ${expiryTime})`
        );
    }

    listSnoozedSettings(): void {
        if (this.snoozedSettings.size === 0) {
            vscode.window.showInformationMessage('No settings are currently snoozed');
            return;
        }

        const now = Date.now();
        const settingsList = Array.from(this.snoozedSettings.values())
            .map(setting => {
                const timeLeft = Math.max(0, setting.expiresAt - now);
                const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
                return `• ${setting.setting}: ${JSON.stringify(setting.snoozedValue)} (${minutesLeft} min left)`;
            })
            .join('\n');

        vscode.window.showInformationMessage(`Snoozed Settings:\n${settingsList}`);
    }

    clearSnoozedSettings(): void {
        if (this.snoozedSettings.size === 0) {
            vscode.window.showInformationMessage('No settings are currently snoozed');
            return;
        }

        vscode.window.showWarningMessage(
            'Are you sure you want to clear all snoozed settings?',
            'Yes', 'No'
        ).then(selection => {
            if (selection === 'Yes') {
                for (const snoozedSetting of this.snoozedSettings.values()) {
                    this.restoreOriginalSetting(snoozedSetting);
                }
                this.snoozedSettings.clear();
                this.saveSnoozedSettings();
                vscode.window.showInformationMessage('All snoozed settings have been cleared');
            }
        });
    }
}

let snoozeManager: SnoozeSettingManager;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    snoozeManager = new SnoozeSettingManager(context);

    // Register commands
    const testCommand = vscode.commands.registerCommand('snooze-setting.testCommand', () => {
        vscode.window.showInformationMessage('Test command executed');
    });

    const snoozeCommand = vscode.commands.registerCommand('snooze-setting.snoozeSetting', () => {
        snoozeManager.snoozeSetting();
    });

    const listCommand = vscode.commands.registerCommand('snooze-setting.listSnoozedSettings', () => {
        snoozeManager.listSnoozedSettings();
    });

    const clearCommand = vscode.commands.registerCommand('snooze-setting.clearSnoozedSettings', () => {
        snoozeManager.clearSnoozedSettings();
    });

    context.subscriptions.push(snoozeCommand, listCommand, clearCommand, testCommand);
}

export function deactivate() {
    if (snoozeManager) {
        for (const snoozedSetting of snoozeManager.snoozedSettings.values()) {
            snoozeManager.restoreOriginalSetting(snoozedSetting);
        }
    }
}
