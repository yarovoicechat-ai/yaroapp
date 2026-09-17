import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const BackgroundColor = ({ children, style, colors, imageSource, barStyle = 'dark-content', disableTopPadding = true }) => {
  const insets = useSafeAreaInsets();

  // Keep screens flush with the top by default. A screen can opt back into
  // safe-area spacing with disableTopPadding={false} when it is truly needed.
  const topInset = Platform.OS === 'android' 
    ? (StatusBar.currentHeight || 24) 
    : (insets.top || 0);
  const paddingTop = disableTopPadding ? 0 : topInset;
  const paddingBottom = Platform.OS === 'android' ? Math.max(8, insets.bottom) : insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={barStyle} 
        animated
      />
      
      {imageSource ? (
        <Image
          source={imageSource}
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={colors || ['#F8FAFC', '#F1F5F9', '#E2E8F0']}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View style={[
        styles.contentContainer, 
        { 
          paddingTop: paddingTop,
          paddingBottom: paddingBottom,
        },
        style
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
  },
});

export default BackgroundColor;