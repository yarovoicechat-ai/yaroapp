import React from 'react';
import RoomEntryEffectEngine from './RoomEntryEffectEngine';

// Compatibility for callers still using the old name: membership-only events
// no longer render the removed VIP popup.
export default function VipFloatingEntryEngine({ vipEntryEvent, onComplete }) {
  const configured = vipEntryEvent?.entry || vipEntryEvent?.effect || vipEntryEvent?.entrance;
  return <RoomEntryEffectEngine activeEntry={configured ? vipEntryEvent : null} onComplete={onComplete} />;
}
