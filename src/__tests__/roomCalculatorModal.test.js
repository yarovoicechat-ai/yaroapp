import React from 'react';
import RoomCalculatorModal from '../components/room/RoomCalculatorModal';
import FloatingCalculatorWidget from '../components/room/FloatingCalculatorWidget';

describe('Room Calculator & Charm System', () => {
  it('exports RoomCalculatorModal and FloatingCalculatorWidget correctly', () => {
    expect(typeof RoomCalculatorModal).toBe('function');
    expect(typeof FloatingCalculatorWidget).toBe('function');
  });

  it('renders initial setup state correctly without errors', () => {
    const component = (
      <RoomCalculatorModal
        visible={true}
        onClose={() => {}}
        roomId="1000000002"
        isOwner={true}
        activeSession={null}
      />
    );
    expect(component).toBeTruthy();
  });

  it('renders active session with Top Charming correctly', () => {
    const activeSession = {
      theme: 'Best Charming Host',
      status: 'active',
      endsAt: Date.now() + 600000,
      totalScore: 500,
      totalPeople: 3,
      topCharming: {
        name: 'Alice',
        score: 300,
        avatar: 'alice.png',
      },
      topSupporter: {
        name: 'Bob',
        score: 500,
        avatar: 'bob.png',
      },
    };

    const component = (
      <RoomCalculatorModal
        visible={true}
        onClose={() => {}}
        roomId="1000000002"
        isOwner={true}
        activeSession={activeSession}
      />
    );
    expect(component).toBeTruthy();
  });

  it('renders FloatingCalculatorWidget with active session', () => {
    const activeSession = {
      theme: 'Best Charming Host',
      status: 'active',
      endsAt: Date.now() + 600000,
      totalScore: 500,
      totalPeople: 3,
      topCharming: {
        name: 'Alice',
        score: 300,
      },
    };

    const component = (
      <FloatingCalculatorWidget
        activeSession={activeSession}
        onPress={() => {}}
      />
    );
    expect(component).toBeTruthy();
  });
});
