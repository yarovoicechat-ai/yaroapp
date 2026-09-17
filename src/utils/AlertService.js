import { Alert } from 'react-native';

let alertRef = null;

export const setAlertRef = (ref) => {
    alertRef = ref;
};

export const AlertService = {
    show: (title, message, type = 'error', buttons = null) => {
        if (alertRef) {
            alertRef.showAlert(title, message, type, buttons);
        } else {
            console.warn('AlertService: alertRef is not set. Falling back to native Alert.');
            if (buttons) {
                Alert.alert(title, message, buttons);
            } else {
                Alert.alert(title, message);
            }
        }
    },
    hide: () => {
        if (alertRef) {
            alertRef.hideAlert();
        }
    },
    error: (title, message, buttons = null) => {
        AlertService.show(title, message, 'error', buttons);
    },
    info: (title, message, buttons = null) => {
        AlertService.show(title, message, 'info', buttons);
    },
    success: (title, message, buttons = null) => {
        AlertService.show(title, message, 'success', buttons);
    },
    warn: (title, message, buttons = null) => {
        AlertService.show(title, message, 'warning', buttons);
    },
};
