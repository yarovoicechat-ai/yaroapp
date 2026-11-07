import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
    if (navigationRef.isReady()) {
        try {
            navigationRef.navigate(name, params);
        } catch (_) {
            try {
                navigationRef.dispatch(CommonActions.navigate({ name, params }));
            } catch (_) {}
        }
    }
}

export function navigateToVoiceRoom(roomParams) {
    if (!navigationRef.isReady()) return false;
    try {
        const current = navigationRef.getCurrentRoute();
        if (current?.name === 'VoiceRoom') {
            return true;
        }
        navigationRef.dispatch(
            CommonActions.navigate({
                name: 'VoiceRoom',
                params: roomParams,
            })
        );
        return true;
    } catch (_) {
        try {
            navigationRef.navigate('VoiceRoom', roomParams);
            return true;
        } catch (_) {
            return false;
        }
    }
}
