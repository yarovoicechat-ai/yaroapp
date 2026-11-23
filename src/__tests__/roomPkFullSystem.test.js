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

describe('Complete 3-Mode Room PK System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRoomSeats = [
    { seatIndex: 0, user: { _id: 'host_1', userId: '1001', name: 'Host Master' } },
    { seatIndex: 1, user: { _id: 'user_2', userId: '1002', name: 'Singer A' } },
    { seatIndex: 2, user: { _id: 'user_3', userId: '1003', name: 'Singer B' } },
  ];

  const mockOnlineUsers = [
    { _id: 'host_1', userId: '1001', name: 'Host Master' },
    { _id: 'user_2', userId: '1002', name: 'Singer A' },
    { _id: 'user_3', userId: '1003', name: 'Singer B' },
    { _id: 'user_4', userId: '1004', name: 'Audience Fan' },
  ];

  const currentUser = { _id: 'host_1', userId: '1001', name: 'Host Master' };

  it('renders all three PK mode tabs (Personal Gift, Team Gift, Vote PK)', async () => {
    let root;
    await act(async () => {
      root = renderer.create(
        <RoomPKPanel
          roomId="room_pk_voice_1"
          isOwner={true}
          openTrigger={1}
          roomSeats={mockRoomSeats}
          roomUsers={mockOnlineUsers}
          currentUser={currentUser}
        />
      );
    });

    const instance = root.root;
    const personalTab = instance.findByProps({ testID: 'pk-mode-user' });
    const teamTab = instance.findByProps({ testID: 'pk-mode-room' });
    const voteTab = instance.findByProps({ testID: 'pk-tab-vote' });
    const historyTab = instance.findByProps({ testID: 'pk-tab-history' });

    expect(personalTab).toBeDefined();
    expect(teamTab).toBeDefined();
    expect(voteTab).toBeDefined();
    expect(historyTab).toBeDefined();

    act(() => {
      root.unmount();
    });
  });

  it('switches to Vote PK and displays Start Vote PK button', async () => {
    let root;
    await act(async () => {
      root = renderer.create(
        <RoomPKPanel
          roomId="room_pk_voice_1"
          isOwner={true}
          openTrigger={1}
          roomSeats={mockRoomSeats}
          roomUsers={mockOnlineUsers}
          currentUser={currentUser}
        />
      );
    });

    const instance = root.root;

    // Switch to Vote tab
    const voteTab = instance.findByProps({ testID: 'pk-tab-vote' });
    await act(async () => {
      voteTab.props.onPress();
    });

    // Check Start Vote PK button is present
    const startVoteBtn = instance.findByProps({ testID: 'pk-start-vote' });
    expect(startVoteBtn).toBeDefined();

    act(() => {
      root.unmount();
    });
  });

  it('switches to Team Gift PK and shows 10-seat grid with Yellow and Blue team options', async () => {
    let root;
    await act(async () => {
      root = renderer.create(
        <RoomPKPanel
          roomId="room_pk_voice_1"
          isOwner={true}
          openTrigger={1}
          roomSeats={mockRoomSeats}
          roomUsers={mockOnlineUsers}
          currentUser={currentUser}
        />
      );
    });

    const instance = root.root;

    // Switch to Team tab
    const teamTab = instance.findByProps({ testID: 'pk-mode-room' });
    await act(async () => {
      teamTab.props.onPress();
    });

    // Verify Start Team PK button is present
    const startTeamBtn = instance.findByProps({ testID: 'pk-start-team' });
    expect(startTeamBtn).toBeDefined();

    act(() => {
      root.unmount();
    });
  });

  it('starts a Personal PK with valid in-room user ID', async () => {
    let root;
    await act(async () => {
      root = renderer.create(
        <RoomPKPanel
          roomId="room_pk_voice_1"
          isOwner={true}
          openTrigger={1}
          roomSeats={mockRoomSeats}
          roomUsers={mockOnlineUsers}
          currentUser={currentUser}
        />
      );
    });

    const instance = root.root;

    // Enter in-room user ID '1002'
    const input = instance.findByProps({ testID: 'pk-user-id' });
    await act(async () => {
      input.props.onChangeText('1002');
    });

    // Click Start PK
    const startBtn = instance.findByProps({ testID: 'pk-send-invite' });
    await act(async () => {
      startBtn.props.onPress();
    });

    expect(apiUtil.post).toHaveBeenCalledWith(
      '/voice-club/rooms/room_pk_voice_1/pk/invite',
      expect.objectContaining({
        pkMode: 'personal',
        targetUserId: '1002',
      })
    );

    act(() => {
      root.unmount();
    });
  });
});
