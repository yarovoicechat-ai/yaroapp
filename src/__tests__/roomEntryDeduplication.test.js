describe('Room Entry Deduplication and Replay Prevention', () => {
  test('suppresses duplicate self entrance within the same room session', () => {
    let hasPlayedSelfEntrance = false;
    const currentUserId = '10001';

    const acceptEntryEffect = (data) => {
      const userKeys = [data?.user?.userId, data?.userId, data?.user?.id, data?.user?._id]
        .filter(Boolean).map(String);
      const isSelf = Boolean(
        currentUserId &&
        userKeys.some((k) => String(k) === String(currentUserId))
      );

      if (isSelf) {
        if (hasPlayedSelfEntrance) {
          return false; // suppressed
        }
        hasPlayedSelfEntrance = true;
      }
      return true; // allowed
    };

    // First time entering: plays
    expect(acceptEntryEffect({ user: { userId: '10001', name: 'Host' } })).toBe(true);

    // App state foreground / minimize restore / socket reconnect: suppressed!
    expect(acceptEntryEffect({ user: { userId: '10001', name: 'Host' } })).toBe(false);
    expect(acceptEntryEffect({ user: { id: '10001', name: 'Host' } })).toBe(false);

    // After leaveRoom: reset session
    hasPlayedSelfEntrance = false;
    // New entry allowed
    expect(acceptEntryEffect({ user: { userId: '10001', name: 'Host' } })).toBe(true);
  });

  test('prevents redundant enterRoom when clicking an already-active room card', () => {
    const activeRoom = { id: 'room_999', roomId: 'room_999', channelName: 'room_999' };
    let enterRoomCallCount = 0;
    let isMinimized = true;

    const handleRoomCardPress = (roomItem) => {
      const targetRoomId = String(roomItem?.id || roomItem?.roomId || roomItem?.channelName || roomItem?._id || '');
      const currentActiveId = String(activeRoom?.id || activeRoom?.roomId || activeRoom?.channelName || activeRoom?._id || '');

      if (activeRoom && currentActiveId && targetRoomId && currentActiveId === targetRoomId) {
        isMinimized = false;
        return 'restored';
      }

      enterRoomCallCount += 1;
      return 'entered_new';
    };

    // Clicking already active room while minimized
    const action = handleRoomCardPress({ roomId: 'room_999' });
    expect(action).toBe('restored');
    expect(isMinimized).toBe(false);
    expect(enterRoomCallCount).toBe(0);

    // Clicking a different room
    const action2 = handleRoomCardPress({ roomId: 'room_888' });
    expect(action2).toBe('entered_new');
    expect(enterRoomCallCount).toBe(1);
  });

  test('clears activeEntryEffect when all queued entries finish playing', () => {
    let activeEntryEffect = {
      entryId: 'entry_1',
      queuedEntries: [{ entryId: 'entry_1' }],
    };

    const handleEntryEffectComplete = (completedEntryId) => {
      if (!activeEntryEffect) return;
      if (!completedEntryId || activeEntryEffect.entryId === completedEntryId) {
        activeEntryEffect = null;
        return;
      }
      const remaining = (activeEntryEffect.queuedEntries || []).filter(
        (e) => (e.entryId || e.id) !== completedEntryId
      );
      activeEntryEffect = remaining.length === 0 ? null : { ...activeEntryEffect, queuedEntries: remaining };
    };

    handleEntryEffectComplete('entry_1');
    expect(activeEntryEffect).toBeNull();
  });
});
