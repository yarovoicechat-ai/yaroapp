import React from 'react';
import { FlatList } from 'react-native';
import type { ARFilter } from '../types/ARFilter';
import ARFilterCard from './ARFilterCard';
import { useARSession } from '../hooks/useARSession';
export default function ARFilterCarousel({
  effects,
  selectedId,
  favorites,
  onSelect,
  onFavorite,
}: {
  effects: readonly ARFilter[];
  selectedId: string | null;
  favorites: string[];
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
}) {
  const session = useARSession();
  return (
    <FlatList
      horizontal
      data={effects}
      keyExtractor={effect => effect.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      renderItem={({ item }) => (
        <ARFilterCard
          effect={item}
          runtimeStatus={session.effectStates[item.id] || 'unavailable'}
          selected={item.id === selectedId}
          favorite={favorites.includes(item.id)}
          onPress={() => onSelect(item.id)}
          onFavorite={() => onFavorite(item.id)}
        />
      )}
    />
  );
}
