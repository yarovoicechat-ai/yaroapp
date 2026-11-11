import React, { useState } from 'react';
import { AppRegistry, Image, Pressable, SafeAreaView, Text, View } from 'react-native';
import SeatReaction from '../src/components/room/SeatReaction';
import { BUNDLED_EMOJIS } from '../src/constants/roomEmojis';
import { name } from '../app.json';

function GifDeviceCheck() {
  const [code, setCode] = useState('cool_sunglasses');
  const item = BUNDLED_EMOJIS.find(emoji => emoji.code === code);
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1020', padding: 24 }}>
    <Text style={{ color: '#FFF', fontSize: 24, marginTop: 30 }}>Yaro GIF device check</Text>
    <Text style={{ color: '#94A3B8', fontSize: 16, marginVertical: 20 }}>Actual production SeatReaction component</Text>
    <View style={{ height: 220, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17223D', borderRadius: 20 }}>
      <View style={{ width: 140, height: 140 }}>
        <SeatReaction key={code} emoji={code} gifUrl={item.gifUrl} emojiData={item} size={110} />
      </View>
    </View>
    <Text style={{ color: '#FFF', fontSize: 17, marginVertical: 18 }}>Direct animated GIF / static PNG reference</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', height: 150 }}>
      <Image key={`gif-${code}`} source={item.localGif} style={{ width: 130, height: 130 }} />
      <Image source={item.localPng} style={{ width: 130, height: 130 }} />
    </View>
    {['cool_sunglasses', 'dizzy', 'tongue_out'].map(value => <Pressable key={value}
      accessibilityLabel={`Test ${value}`} onPress={() => setCode(value)}
      style={{ backgroundColor: '#2563EB', padding: 18, borderRadius: 12, marginTop: 12 }}>
      <Text style={{ color: '#FFF', fontSize: 18 }}>{value}</Text>
    </Pressable>)}
  </SafeAreaView>;
}

AppRegistry.registerComponent(name, () => GifDeviceCheck);
