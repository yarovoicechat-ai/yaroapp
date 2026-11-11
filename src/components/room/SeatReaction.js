import React, { useEffect, useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { seatReactionMedia } from '../../utils/seatReactions';

export default React.memo(function SeatReaction({ emoji, gifUrl, emojiData, name, size = 54 }) {
  const media = useMemo(() => seatReactionMedia({ emoji, gifUrl, emojiData }), [emoji, gifUrl, emojiData]);
  const [failedSource, setFailedSource] = useState(0);
  useEffect(() => {
    setFailedSource(0);
  }, [media]);
  const source = media.sources[failedSource];
  const reactionName = name || emojiData?.name || '';

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -Math.round(size * 0.35),
        width: size * 1.4,
        height: size * 1.25,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        zIndex: 99999,
        elevation: 99999,
      }}
    >
      {Boolean(reactionName) && (
        <View
          style={{
            position: 'absolute',
            top: -18,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: '#FDE047',
              fontSize: 10,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            {reactionName}
          </Text>
        </View>
      )}
      {source ? (
        <Image
          key={failedSource}
          testID="seat-reaction-image"
          source={source}
          onError={() => setFailedSource(index => index + 1)}
          style={{ width: size * 1.25, height: size * 1.25 }}
          resizeMode="contain"
        />
      ) : (
        <Text
          allowFontScaling={false}
          style={{
            color: '#FFFFFF',
            fontSize: Math.round(size * 0.95),
            lineHeight: Math.ceil(size * 1.15),
            includeFontPadding: false,
            textAlign: 'center',
          }}
        >
          {media.text}
        </Text>
      )}
    </View>
  );
});
