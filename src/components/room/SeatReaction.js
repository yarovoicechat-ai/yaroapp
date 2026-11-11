import React, { useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { seatReactionMedia } from '../../utils/seatReactions';

export default React.memo(function SeatReaction({ emoji, gifUrl, emojiData, size = 54 }) {
  const media = useMemo(() => seatReactionMedia({ emoji, gifUrl, emojiData }), [emoji, gifUrl, emojiData]);
  const [failedSource, setFailedSource] = useState(0);
  const source = media.sources[failedSource];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: -Math.round(size * 0.16),
      width: size * 1.25, height: size * 1.25, alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center', zIndex: 99999, elevation: 99999 }}>
      {source ? <Image key={failedSource} testID="seat-reaction-image" source={source}
        onError={() => setFailedSource(index => index + 1)}
        style={{ width: size * 1.25, height: size * 1.25 }} resizeMode="contain" />
        : <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: Math.round(size * 0.95),
          lineHeight: Math.ceil(size * 1.15), includeFontPadding: false, textAlign: 'center' }}>{media.text}</Text>}
    </View>
  );
});
