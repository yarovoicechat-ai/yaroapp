// Full seat snapshots can arrive after a newer mute/unmute event. While the
// user remains seated, explicit mic events own their mute state.
export const resolveRoomMicMute = (desiredAudio, seatMuted, forceMuted = false) =>
  Boolean(forceMuted || (desiredAudio.isOnSeat ? desiredAudio.isMuted : seatMuted));
