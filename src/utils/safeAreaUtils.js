/**
 * Standard height of the floating custom capsule tab bar in BottomTabsNavigator
 */
export const TAB_BAR_HEIGHT = 70;
export const TAB_BAR_HORIZONTAL_MARGIN = 16;
export const TAB_BAR_VISUAL_GAP = 4;
export const TAB_BAR_MIN_BOTTOM_MARGIN = 8;

/**
 * Calculates the exact bottom margin/inset used by the floating custom tab bar.
 */
export const getTabBarBottomMargin = (insetsBottom = 0) => {
  const bottom = insetsBottom || 0;
  return Math.max(TAB_BAR_MIN_BOTTOM_MARGIN, bottom > 0 ? bottom + TAB_BAR_VISUAL_GAP : 8);
};

/**
 * Returns the exact total bottom clearance required for scrollable lists
 * (ScrollView, FlatList) inside bottom tab screens (Home, 1to1, Party, Inbox, Profile).
 *
 * Formula:
 * Tab bar height (72) + floating tab bar bottom offset + intentional visual clearance gap (16)
 */
export const getTabScreenBottomPadding = (insetsBottom = 0, extraGap = TAB_BAR_VISUAL_GAP) => {
  return TAB_BAR_HEIGHT + getTabBarBottomMargin(insetsBottom) + extraGap;
};

/**
 * Guaranteed minimum bottom padding for stack screens to ensure content clears
 * Android gesture navigation bar (pill) and 3-button navigation, even when edge-to-edge
 * windowing reports insets.bottom as 0.
 */
export const STACK_SCREEN_MIN_BOTTOM_PADDING = 38;

/**
 * Returns standard bottom padding for stack screens (without bottom tab bar),
 * ensuring content and action buttons clear Android gesture bar or 3-button navigation.
 */
export const getStackScreenBottomPadding = (insetsBottom = 0, minPadding = STACK_SCREEN_MIN_BOTTOM_PADDING) => {
  const effectiveMin = Math.max(STACK_SCREEN_MIN_BOTTOM_PADDING, minPadding || 0);
  return Math.max(effectiveMin, (insetsBottom || 0) + effectiveMin);
};

/**
 * Returns the top safe-area inset across Android edge-to-edge / translucent status bar
 * and iOS notches/dynamic island, preventing overlapping status bar icons or double insets.
 */
export const getTopSafeInset = (insetsTop = 0) => {
  // Use the inset reported for the current screen frame. Navigator-level
  // layout owns whether content starts edge-to-edge.
  return Math.max(0, Number(insetsTop) || 0);
};

/**
 * Top inset for authenticated app screens rendered inside AppStack.
 *
 * react-native-screens reports its 56dp Android scene offset as a safe-area
 * inset. AppStack removes that scene offset, so these screens must use the
 * real system status-bar height instead of reintroducing the 56dp gap.
 * Auth screens intentionally keep using getTopSafeInset because they are
 * rendered by a separate navigator whose layout is already correct.
 */
export const getAppTopSafeInset = (insetsTop = 0) => {
  if (Platform.OS === 'android') {
    return Math.max(0, Number(StatusBar.currentHeight) || Number(insetsTop) || 0);
  }

  return getTopSafeInset(insetsTop);
};
import { Platform, StatusBar } from 'react-native';
