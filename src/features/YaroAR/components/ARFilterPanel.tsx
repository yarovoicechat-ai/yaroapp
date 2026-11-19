import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useARSession } from '../hooks/useARSession';
import { useAREffects } from '../hooks/useAREffects';
import type { ARCategory } from '../types/ARFilter';
import type { ARAdjustments } from '../types/ARNativeTypes';
import ARCategoryTabs from './ARCategoryTabs';
import ARFilterCarousel from './ARFilterCarousel';
import ARBeautyPanel from './ARBeautyPanel';
import ARIntensitySlider from './ARIntensitySlider';
export type ARPanelTab =
  | 'Beauty'
  | 'Effects'
  | 'Background'
  | 'Adjust'
  | 'More';
const tabs: readonly [ARPanelTab, string][] = [
  ['Beauty', 'sparkles-outline'],
  ['Effects', 'color-wand-outline'],
  ['Background', 'image-outline'],
  ['Adjust', 'options-outline'],
  ['More', 'ellipsis-horizontal'],
];
export default function ARFilterPanel({
  initialTab = 'Effects',
  onClose,
  showTabs = true,
  compact = false,
}: {
  initialTab?: ARPanelTab;
  onClose?: () => void;
  showTabs?: boolean;
  compact?: boolean;
}) {
  const session = useARSession();
  const [tab, setTab] = useState<ARPanelTab>(initialTab),
    [category, setCategory] = useState<ARCategory>('All'),
    [message, setMessage] = useState(''),
    [list, setList] = useState<'all' | 'favorites' | 'downloaded'>('all');
  const effects = useAREffects(category),
    light = useColorScheme() === 'light';
  const run = (operation: Promise<unknown>) => {
    setMessage('');
    void operation.catch(error => setMessage(error.message));
  };
  const select = (id: string) => run(session.controller.select(id));
  const filtered = effects.filter(effect =>
    list === 'favorites'
      ? session.favorites.includes(effect.id)
      : list === 'downloaded'
      ? effect.status !== 'pending' &&
        session.capabilities?.implementedEffectIds.includes(effect.id)
      : true,
  );
  return (
    <View style={[s.panel, light && s.lightBorder]}>
      <View style={[s.heading, compact && { padding: 10 }]}>
        <View>
          <Text style={s.title}>
            YARO <Text style={s.gold}>STUDIO</Text>
          </Text>
          <Text style={s.subtitle}>
            {session.status === 'running'
              ? session.faceDetected
                ? 'Face tracking active'
                : 'Looking for a face…'
              : 'Your camera. Your expression.'}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Reset all effects"
          onPress={() => run(session.controller.reset())}
        >
          <Text style={s.reset}>Reset</Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Close effects"
          >
            <Icon name="close" color="#E6DDEC" size={22} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView style={[s.body, compact && { maxHeight: 160, minHeight: 100 }]} nestedScrollEnabled>
        {tab === 'Beauty' && (
          <ARBeautyPanel
            intensity={session.intensity}
            selectedId={session.selectedId}
            states={session.effectStates}
            onSelect={select}
            onIntensity={value => run(session.controller.intensity(value))}
            onPending={setMessage}
          />
        )}
        {tab === 'Effects' && (
          <>
            <ARCategoryTabs value={category} onChange={setCategory} />
            <ARFilterCarousel
              effects={filtered}
              selectedId={session.selectedId}
              favorites={session.favorites}
              onSelect={select}
              onFavorite={id => session.controller.favorite(id)}
            />
            {!filtered.length && (
              <Text style={s.note}>No effects in this collection yet.</Text>
            )}
            {session.selectedId && (
              <ARIntensitySlider
                label="Effect intensity"
                value={session.intensity}
                onChange={value => run(session.controller.intensity(value))}
              />
            )}
          </>
        )}
        {tab === 'Background' && (
          <View style={s.options}>
            {[
              'Original',
              'Background Blur',
              'Gradient Background',
              'Custom Background',
            ].map(name => (
              <TouchableOpacity
                key={name}
                style={s.option}
                onPress={() =>
                  setMessage(
                    name === 'Original'
                      ? 'Original background is active.'
                      : 'Background effects are not ready yet. Your original background is active.',
                  )
                }
              >
                <Icon
                  name={
                    name === 'Original' ? 'person-outline' : 'image-outline'
                  }
                  size={23}
                  color="#ECCB87"
                />
                <Text style={s.optionText}>{name}</Text>
                {name !== 'Original' && <Text style={s.subtitle}>Pending</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {tab === 'Adjust' &&
          (
            [
              'brightness',
              'contrast',
              'saturation',
              'warmth',
              'sharpness',
            ] as (keyof ARAdjustments)[]
          ).map(key => (
            <ARIntensitySlider
              key={key}
              label={key[0].toUpperCase() + key.slice(1)}
              min={key === 'brightness' || key === 'warmth' ? -1 : 0}
              max={key === 'contrast' || key === 'saturation' ? 2 : 1}
              value={session.adjustments[key]}
              disabled={false}
              onChange={value =>
                run(
                  session.controller.adjustments({
                    ...session.adjustments,
                    [key]: value,
                  }),
                )
              }
            />
          ))}
        {tab === 'More' && (
          <View style={s.options}>
            {[
              'Reset All',
              'Favorites',
              'Downloaded Effects',
              'Effect Settings',
            ].map(name => (
              <TouchableOpacity
                key={name}
                style={s.option}
                onPress={() => {
                  if (name === 'Reset All') run(session.controller.reset());
                  else if (name === 'Effect Settings')
                    setMessage(
                      'One face at a time. Long-press a filter to favorite it. Some effects are still in preview.',
                    );
                  else {
                    setList(name === 'Favorites' ? 'favorites' : 'downloaded');
                    setCategory('All');
                    setTab('Effects');
                  }
                }}
              >
                <Icon
                  name={
                    name === 'Favorites'
                      ? 'star-outline'
                      : name === 'Reset All'
                      ? 'refresh-outline'
                      : 'options-outline'
                  }
                  color="#ECCB87"
                  size={23}
                />
                <Text style={s.optionText}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <Text accessibilityLiveRegion="polite" style={s.note}>
        {message ||
          session.error ||
          '✨ YARO Live Beauty & Effects Active · Tap to apply'}
      </Text>
      {showTabs && <View style={s.tabs}>
        {tabs.map(([name, icon]) => (
          <TouchableOpacity
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === name }}
            onPress={() => {
              setTab(name);
              setMessage('');
              if (name === 'Effects') setList('all');
            }}
            style={s.tab}
          >
            <Icon
              name={icon}
              size={21}
              color={tab === name ? '#F1CA76' : '#9D8EAD'}
            />
            <Text style={[s.tabName, tab === name && s.gold]}>{name}</Text>
            {tab === name && <View style={s.indicator} />}
          </TouchableOpacity>
        ))}
      </View>}
    </View>
  );
}
const s = StyleSheet.create({
  panel: {
    backgroundColor: '#160F22F5',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF16',
    overflow: 'hidden',
  },
  lightBorder: { borderColor: '#E4C78C88' },
  heading: { padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  title: { fontSize: 14, fontWeight: '800', letterSpacing: 2, color: '#fff' },
  gold: { color: '#F1CA76' },
  subtitle: { fontSize: 10, color: '#A99BB8', marginTop: 4 },
  reset: { color: '#E6D1A2', fontSize: 12, marginLeft: 'auto' },
  body: { maxHeight: 220, minHeight: 145 },
  note: {
    color: '#C7B6D3',
    fontSize: 10,
    lineHeight: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#FFFFFF12',
    paddingTop: 12,
    paddingBottom: 13,
  },
  tab: { flex: 1, alignItems: 'center', gap: 5 },
  tabName: { fontSize: 10, color: '#A99BB8' },
  indicator: {
    height: 2,
    width: 16,
    backgroundColor: '#F1CA76',
    borderRadius: 2,
    marginTop: 2,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  option: {
    width: '47%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF07',
    alignItems: 'center',
    gap: 6,
  },
  optionText: { fontSize: 11, color: '#F0E9F5' },
});
