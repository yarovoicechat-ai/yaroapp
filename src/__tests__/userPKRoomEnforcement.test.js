import React from 'react';
import renderer, { act } from 'react-test-renderer';
import RoomPKPanel from '../components/room/RoomPKPanel';
import { apiUtil } from '../utils/apiUtil';

jest.mock('../utils/apiUtil', () => ({
  apiUtil: {
    get: jest.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    post: jest.fn().mockResolvedValue({ data: { success: true, data: null } }),
  },
}));

jest.mock('../sockets', () => ({
  getSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  })),
}));

describe('User PK in Same Room Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRoomSeats = [
    { seatIndex: 0, user: { _id: 'host_1', userId: '1001', name: 'Host King' } },
    { seatIndex: 1, user: { _id: 'user_in_room_2', userId: '1002', name: 'Seated Friend' } },
  ];

  const mockOnlineUsers = [
    { _id: 'host_1', userId: '1001', name: 'Host King' },
    { _id: 'user_in_room_2', userId: '1002', name: 'Seated Friend' },
    { _id: 'user_in_room_3', userId: '1003', name: 'Audience Member' },
  ];

  const currentUser = { _id: 'host_1', userId: '1001', name: 'Host King' };

  it('displays candidates present in the room when User PK mode is selected', async () => {
    let root;
    await act(async () => {
      root = renderer.create(
        <RoomPKPanel
          roomId="room_pk_101"
          isOwner={true}
          openTrigger={1}
          roomSeats={mockRoomSeats}
          roomUsers={mockOnlineUsers}
          currentUser={currentUser}
        />
      );
    });

    const instance = root.root;

    // Switch to User PK mode
    const userPkTouchable = instance.findByProps({ testID: 'pk-mode-user' });
    expect(userPkTouchable).toBeDefined();
    await act(async () => {
      userPkTouchable.props.onPress();
    });

    // Verify candidates in room (Seated Friend & Audience Member) are rendered
    const candidateTexts = instance.findAllByType('Text').map(t => t.props.children);
    expect(candidateTexts).toContain('Seated Friend');
    expect(candidateTexts).toContain('Audience Member');
    // Host should be excluded from own opponent list
    expect(candidateTexts.filter(c => c === 'Host King').length).toBe(0);

    act(() => {
      root.unmount();
    });
  });

  it('rejects inviting a User ID that is NOT in the current room', async () => {
    let root;
    await act(async () => {
      root = renderer.create(
        <RoomPKPanel
          roomId="room_pk_101"
          isOwner={true}
          openTrigger={1}
          roomSeats={mockRoomSeats}
          roomUsers={mockOnlineUsers}
          currentUser={currentUser}
        />
      );
    });

    const instance = root.root;

    // Switch to User PK
    const userPkTouchable = instance.findByProps({ testID: 'pk-mode-user' });
    await act(async () => {
      userPkTouchable.props.onPress();
    });

    // Enter a user ID that is outside the room
    const input = instance.findByProps({ testID: 'pk-user-id' });
    await act(async () => {
      input.props.onChangeText('9999'); // User not in room
    });

    // Tap Invite
    const inviteBtn = instance.findByProps({ testID: 'pk-send-invite' });
    await act(async () => {
      inviteBtn.props.onPress();
    });

    // Verify error shown: "User must be in this room for User PK."
    const errorText = instance.findByProps({ accessibilityRole: 'alert' });
    expect(errorText.props.children).toBe('User must be in this room for User PK.');
    expect(apiUtil.post).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it('allows inviting a user who IS in the current room', async () => {
    let root;
    await act(async () => {
      root = renderer.create(
        <RoomPKPanel
          roomId="room_pk_101"
          isOwner={true}
          openTrigger={1}
          roomSeats={mockRoomSeats}
          roomUsers={mockOnlineUsers}
          currentUser={currentUser}
        />
      );
    });

    const instance = root.root;

    // Switch to User PK
    const userPkTouchable = instance.findByProps({ testID: 'pk-mode-user' });
    await act(async () => {
      userPkTouchable.props.onPress();
    });

    // Enter a user ID that IS in the room (1002)
    const input = instance.findByProps({ testID: 'pk-user-id' });
    await act(async () => {
      input.props.onChangeText('1002');
    });

    // Tap Invite
    const inviteBtn = instance.findByProps({ testID: 'pk-send-invite' });
    await act(async () => {
      inviteBtn.props.onPress();
    });

    // Verify API called with pkType: 'user' and targetRoomId: '1002'
    expect(apiUtil.post).toHaveBeenCalledWith(
      '/voice-club/rooms/room_pk_101/pk/invite',
      expect.objectContaining({
        targetRoomId: '1002',
        pkType: 'user',
      })
    );

    act(() => {
      root.unmount();
    });
  });
});
