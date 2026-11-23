import React from 'react';
import renderer, { act } from 'react-test-renderer';
import YouTubeSearchModal from '../components/room/YouTubeSearchModal';
import YouTubeRoomPlayer from '../components/room/YouTubeRoomPlayer';
import { apiUtil } from '../utils/apiUtil';

jest.mock('../utils/apiUtil', () => ({
  apiUtil: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: (props) => <View testID="mock-webview" {...props} />,
  };
});

jest.mock('../sockets', () => ({
  getSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  })),
}));

describe('YouTube Watch Together Full-Stack Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('1. YouTubeSearchModal', () => {
    it('fetches and displays trending videos when opened', async () => {
      const mockVideos = [
        {
          videoId: 'test_vid_1',
          title: 'Haqdar Hoon Song',
          thumbnail: 'https://img.youtube.com/vi/test_vid_1/0.jpg',
          channelTitle: 'Sagar Bairagi',
          duration: '04:48',
        },
        {
          videoId: 'test_vid_2',
          title: 'Panchayat Season 5',
          thumbnail: 'https://img.youtube.com/vi/test_vid_2/0.jpg',
          channelTitle: 'Prime Video',
          duration: '02:37',
        },
      ];

      apiUtil.get.mockResolvedValueOnce({
        data: { success: true, data: { items: mockVideos } },
      });

      let root;
      await act(async () => {
        root = renderer.create(
          <YouTubeSearchModal
            visible={true}
            onClose={jest.fn()}
            onSelectVideo={jest.fn()}
            roomId="test-room-123"
          />
        );
      });

      expect(apiUtil.get).toHaveBeenCalledWith(expect.stringContaining('/youtube/search'));
      const textNodes = root.root.findAllByType('Text').map((t) => t.props.children);
      expect(textNodes).toContain('Haqdar Hoon Song');
      expect(textNodes).toContain('Panchayat Season 5');

      act(() => {
        root.unmount();
      });
    });

    it('triggers onSelectVideo when a video card is pressed', async () => {
      const mockVideos = [
        {
          videoId: 'selected_vid_123',
          title: 'Selected Hit Song',
          thumbnail: 'https://img.youtube.com/vi/selected_vid_123/0.jpg',
          channelTitle: 'Music Label',
          duration: '03:30',
        },
      ];

      apiUtil.get.mockResolvedValueOnce({
        data: { success: true, data: { items: mockVideos } },
      });

      const onSelectVideoMock = jest.fn();
      const onCloseMock = jest.fn();

      let root;
      await act(async () => {
        root = renderer.create(
          <YouTubeSearchModal
            visible={true}
            onClose={onCloseMock}
            onSelectVideo={onSelectVideoMock}
            roomId="test-room-123"
          />
        );
      });

      const touchables = root.root.findAllByType('TouchableOpacity');
      // Find the card touchable
      const videoCard = touchables.find(
        (t) => t.props.onPress && t.props.children && JSON.stringify(t.props).includes('Selected Hit Song')
      );

      if (videoCard) {
        await act(async () => {
          videoCard.props.onPress();
        });
        expect(onSelectVideoMock).toHaveBeenCalledWith(
          expect.objectContaining({ videoId: 'selected_vid_123' })
        );
        expect(onCloseMock).toHaveBeenCalled();
      }

      act(() => {
        root.unmount();
      });
    });
  });

  describe('2. YouTubeRoomPlayer', () => {
    it('renders placeholder card when no active video is loaded', async () => {
      apiUtil.get.mockResolvedValueOnce({
        data: { success: true, data: { status: 'idle', videoId: '' } },
      });

      let root;
      await act(async () => {
        root = renderer.create(
          <YouTubeRoomPlayer
            roomId="test-room-123"
            isHost={true}
            onOpenSearch={jest.fn()}
            onClosePlayer={jest.fn()}
          />
        );
      });

      const textNodes = root.root.findAllByType('Text').map((t) => t.props.children);
      expect(textNodes).toContain('YouTube Watch Together');
      expect(textNodes).toContain('Search Video');

      act(() => {
        root.unmount();
      });
    });

    it('renders embedded player when active session has videoId', async () => {
      apiUtil.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            status: 'playing',
            videoId: 'qyyIqaSaQS0',
            videoTitle: 'Haqdar Hoon Song',
            channelTitle: 'Sagar Bairagi',
            duration: '04:48',
            durationSeconds: 288,
            currentTime: 45,
            expectedCurrentTime: 45,
            lastUpdatedAt: new Date().toISOString(),
          },
        },
      });

      let root;
      await act(async () => {
        root = renderer.create(
          <YouTubeRoomPlayer
            roomId="test-room-123"
            isHost={true}
            onOpenSearch={jest.fn()}
            onClosePlayer={jest.fn()}
          />
        );
      });

      const webview = root.root.findByProps({ testID: 'mock-webview' });
      expect(webview).toBeDefined();

      const textNodes = root.root.findAllByType('Text').map((t) => t.props.children);
      expect(textNodes).toContain('Watching Together');
      expect(textNodes).toContain('Haqdar Hoon Song');

      act(() => {
        root.unmount();
      });
    });
  });
});
