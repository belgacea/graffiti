import { Position, Toaster, IToaster, Intent } from "@blueprintjs/core";

export default class ToastHelper {
    private static toaster: IToaster;
    private static toasts: any[];

    public static init() {
        ToastHelper.toaster = Toaster.create({
            position: Position.TOP_RIGHT,
        });
        ToastHelper.toasts = [];
    }

    private static show(message:string, intent = Intent.NONE, unicityGroup?:string) {
        if (unicityGroup && ToastHelper.toasts[unicityGroup]) {
            // dissmiss previous toast;
            ToastHelper.toaster.dismiss(ToastHelper.toasts[unicityGroup]);
        }

        const key = ToastHelper.toaster.show({
            message: message,
            intent: intent
        });

        if (unicityGroup) {
            ToastHelper.toasts[unicityGroup] = key;
        }
    }

    public static error(message) {
        ToastHelper.show(message, Intent.DANGER);
    }

    public static success(message, unicityGroup?) {
        ToastHelper.show(message, Intent.SUCCESS, unicityGroup);
    }

    public static info(message, unicityGroup?) {
        ToastHelper.show(message, Intent.PRIMARY, unicityGroup);
    }
}