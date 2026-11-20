import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

// Default Cocos Creator HTML5 Game Runner Template
const generateCocosHtml = (gameId, gameTitle, coinBalance, primaryColor = '#FF007F') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>${gameTitle} - Cocos Web</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; }
    html, body {
      width: 100%; height: 100%;
      background: radial-gradient(circle at 50% 30%, #1f1b2e 0%, #0c0a14 100%);
      color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: space-between;
    }
    #GameCanvasContainer {
      position: relative; width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: space-between; padding: 12px 14px;
    }
    .cocos-banner {
      display: flex; align-items: center; justify-content: space-between; width: 100%;
      background: rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .cocos-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 700; color: #00F0FF;
      background: rgba(0,240,255,0.15); padding: 3px 8px; border-radius: 10px;
    }
    .game-center-stage {
      flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center;
      justify-content: center; position: relative;
    }
    canvas#GameCanvas {
      width: 100%; max-width: 360px; height: 180px; border-radius: 16px;
      background: rgba(0,0,0,0.3); border: 1.5px solid rgba(255,20,147,0.3);
      box-shadow: 0 0 20px rgba(255,20,147,0.25);
    }
    .grid-bets {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; width: 100%; margin: 8px 0;
    }
    .bet-cell {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px; padding: 8px 4px; text-align: center; cursor: pointer;
      transition: all 0.15s ease;
    }
    .bet-cell:active, .bet-cell.active {
      background: rgba(255,20,147,0.35); border-color: #FF1493; transform: scale(0.97);
    }
    .bet-icon { font-size: 20px; display: block; margin-bottom: 2px; }
    .bet-name { font-size: 10px; font-weight: 700; color: #E2E8F0; }
    .bet-mult { font-size: 9px; color: #FFB800; font-weight: 800; }
    .chips-tray {
      display: flex; gap: 8px; width: 100%; justify-content: center; margin-bottom: 6px;
    }
    .chip-btn {
      width: 36px; height: 36px; border-radius: 18px; border: 2px solid #FFD700;
      background: radial-gradient(circle, #FFB800 0%, #D97706 100%);
      color: #000; font-weight: 900; font-size: 10px; display: flex; align-items: center;
      justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    .chip-btn.selected {
      border-color: #FFF; box-shadow: 0 0 12px #FFD700; transform: translateY(-2px);
    }
    .action-bar {
      display: flex; gap: 8px; width: 100%;
    }
    .action-btn {
      flex: 1; padding: 10px 0; border: none; border-radius: 12px; font-weight: 800;
      font-size: 13px; color: #FFF; cursor: pointer; text-align: center;
    }
    .btn-spin { background: linear-gradient(135deg, #FF007F, #B000FF); }
    .btn-clear { background: rgba(255,255,255,0.12); flex: 0.5; color: #CBD5E1; }
  </style>
</head>
<body>
  <div id="GameCanvasContainer">
    <div class="cocos-banner">
      <span style="font-size:12px; font-weight:800; color:#FDE047;">👑 ${gameTitle}</span>
      <span id="playerCoins" style="font-size:12px; font-weight:700; color:#FFD700;">🪙 ${coinBalance}</span>
    </div>

    <div class="game-center-stage">
      <canvas id="GameCanvas"></canvas>
      <div id="gameStatus" style="margin-top:8px; font-size:12px; color:#A0AEC0; font-weight:600;">
        Ready for round · Tap items to place bets
      </div>
    </div>

    <div class="grid-bets" id="betGrid"></div>

    <div class="chips-tray" id="chipsTray">
      <div class="chip-btn selected" onclick="selectChip(50, this)">50</div>
      <div class="chip-btn" onclick="selectChip(100, this)">100</div>
      <div class="chip-btn" onclick="selectChip(500, this)">500</div>
      <div class="chip-btn" onclick="selectChip(1000, this)">1k</div>
      <div class="chip-btn" onclick="selectChip(5000, this)">5k</div>
    </div>

    <div class="action-bar">
      <button class="action-btn btn-clear" onclick="clearBets()">Clear</button>
      <button class="action-btn btn-spin" id="spinBtn" onclick="spin()">SPIN / PLAY</button>
    </div>
  </div>

  <script>
    let currentChip = 50;
    let totalBet = 0;
    let selectedBets = {};
    const items = [
      { id: 'apple', icon: '🍎', name: 'Apple', mult: 2 },
      { id: 'orange', icon: '🍊', name: 'Orange', mult: 5 },
      { id: 'mango', icon: '🥭', name: 'Mango', mult: 10 },
      { id: 'melon', icon: '🍉', name: 'Melon', mult: 15 },
      { id: 'banana', icon: '🍌', name: 'Banana', mult: 20 },
      { id: 'berry', icon: '🍓', name: 'Berry', mult: 25 },
      { id: 'cherry', icon: '🍒', name: 'Cherry', mult: 30 },
      { id: 'grape', icon: '🍇', name: 'Grape', mult: 50 },
    ];

    const grid = document.getElementById('betGrid');
    items.forEach(it => {
      const el = document.createElement('div');
      el.className = 'bet-cell';
      el.id = 'cell_' + it.id;
      el.innerHTML = '<span class="bet-icon">' + it.icon + '</span><span class="bet-name">' + it.name + '</span><span class="bet-mult">' + it.mult + 'x</span>';
      el.onclick = () => placeBet(it.id, el);
      grid.appendChild(el);
    });

    const canvas = document.getElementById('GameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 2);
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 2);

    let angle = 0;
    let spinning = false;
    function drawWheel() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) - 10;
      const step = (Math.PI * 2) / items.length;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      items.forEach((it, i) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, i * step, (i + 1) * step);
        ctx.fillStyle = i % 2 === 0 ? '#2D1B4E' : '#1A102F';
        ctx.fill();
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.rotate(i * step + step / 2);
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.fillText(it.icon, r * 0.7, 8);
        ctx.restore();
      });

      ctx.restore();

      // Center pointer
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
    }
    drawWheel();

    function selectChip(val, el) {
      currentChip = val;
      document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('selected'));
      el.classList.add('selected');
    }

    function placeBet(id, el) {
      selectedBets[id] = (selectedBets[id] || 0) + currentChip;
      totalBet += currentChip;
      el.classList.add('active');
      sendBridge({ type: 'BET', amount: currentChip, gameId: '${gameId}', target: id });
      document.getElementById('gameStatus').innerText = 'Bet on ' + id + ' (Total: ' + totalBet + ' coins)';
    }

    function clearBets() {
      selectedBets = {};
      totalBet = 0;
      document.querySelectorAll('.bet-cell').forEach(c => c.classList.remove('active'));
      document.getElementById('gameStatus').innerText = 'Bets cleared';
      sendBridge({ type: 'CLEAR_BETS' });
    }

    function spin() {
      if (spinning) return;
      spinning = true;
      document.getElementById('spinBtn').disabled = true;
      let speed = 0.35;
      const duration = 2800;
      const start = Date.now();
      const winIdx = Math.floor(Math.random() * items.length);
      const winner = items[winIdx];

      function anim() {
        const elapsed = Date.now() - start;
        angle += speed;
        drawWheel();
        if (elapsed < duration) {
          speed *= 0.985;
          requestAnimationFrame(anim);
        } else {
          spinning = false;
          document.getElementById('spinBtn').disabled = false;
          const winBet = selectedBets[winner.id] || 0;
          if (winBet > 0) {
            const winCoins = winBet * winner.mult;
            document.getElementById('gameStatus').innerText = '🎉 WON ' + winCoins + ' coins on ' + winner.icon + ' ' + winner.name + '!';
            sendBridge({ type: 'WIN', amount: winCoins, item: winner.name, multiplier: winner.mult });
          } else {
            document.getElementById('gameStatus').innerText = 'Result: ' + winner.icon + ' ' + winner.name + ' (' + winner.mult + 'x)';
          }
        }
      }
      anim();
    }

    function sendBridge(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    window.addEventListener('message', (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.type === 'UPDATE_BALANCE') {
          document.getElementById('playerCoins').innerText = '🪙 ' + data.balance;
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
`;

export default function LiveRoomGameView({
  game,
  onClose,
  onMinimize,
  coinBalance = 0,
  onUpdateCoinBalance,
  onRecharge,
  onEmitGameWin,
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const webViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Sync Coin Balance to WebView
  useEffect(() => {
    if (webViewRef.current) {
      try {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'UPDATE_BALANCE',
            balance: coinBalance,
          })
        );
      } catch {}
    }
  }, [coinBalance]);

  // Handle messages from Cocos Creator Game
  const handleMessage = (event) => {
    try {
      const payload = JSON.parse(event.nativeEvent?.data || '{}');
      switch (payload.type) {
        case 'BET':
          if (payload.amount && onUpdateCoinBalance) {
            onUpdateCoinBalance(-payload.amount);
          }
          break;
        case 'WIN':
          if (payload.amount && onUpdateCoinBalance) {
            onUpdateCoinBalance(payload.amount);
            onEmitGameWin?.(payload);
          }
          break;
        case 'RECHARGE':
          onRecharge?.();
          break;
        case 'CLOSE':
          onClose?.();
          break;
        case 'MINIMIZE':
          onMinimize?.();
          break;
        default:
          break;
      }
    } catch {}
  };

  const gameUrl = game?.gameUrl || game?.url;
  const gameSource = gameUrl
    ? { uri: gameUrl }
    : { html: generateCocosHtml(game?.id || 'greedy-baby', game?.title || 'Cocos Game', coinBalance) };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* 1. Half-Screen Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={game?.gradient || ['#FF007F', '#B000FF']}
            style={styles.gameIconBadge}
          >
            <MaterialCommunityIcons
              name={game?.icon || 'gamepad-variant'}
              size={18}
              color="#FFFFFF"
            />
          </LinearGradient>
          <View>
            <Text style={styles.gameTitle} numberOfLines={1}>
              {game?.title || 'Live Game'}
            </Text>
            <View style={styles.cocosTagWrap}>
              <Text style={styles.cocosTagText}>Cocos Web Engine</Text>
            </View>
          </View>
        </View>

        {/* Balance Badge */}
        <TouchableOpacity
          onPress={onRecharge}
          activeOpacity={0.8}
          style={styles.balanceBadge}
        >
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.balanceText}>{coinBalance.toLocaleString()}</Text>
          <View style={styles.plusIconWrap}>
            <Icon name="add" size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Actions: Clear Bets, Minimize, Close */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            accessibilityLabel="Clear Bets"
            onPress={() => {
              webViewRef.current?.postMessage(JSON.stringify({ type: 'CLEAR_BETS' }));
            }}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="backup-restore" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Minimize Game"
            onPress={onMinimize}
            style={styles.iconBtn}
          >
            <Icon name="remove-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Close Game"
            onPress={onClose}
            style={styles.iconBtn}
          >
            <Icon name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Half-Screen Cocos Creator WebView */}
      <View style={styles.webViewWrap}>
        <WebView
          ref={webViewRef}
          source={gameSource}
          onMessage={handleMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setLoadError(true);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          hardwareAccelerationAndroidEnabled={true}
          originWhitelist={['*']}
          style={styles.webView}
          androidLayerType="hardware"
        />

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FF1493" />
            <Text style={styles.loadingText}>Loading Cocos Game Engine...</Text>
          </View>
        )}

        {loadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Could not connect to game server</Text>
            <TouchableOpacity
              onPress={() => {
                setLoadError(false);
                webViewRef.current?.reload();
              }}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 20, 147, 0.4)',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  gameIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cocosTagWrap: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
    alignSelf: 'flex-start',
  },
  cocosTagText: {
    color: '#00F0FF',
    fontSize: 8,
    fontWeight: '700',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginHorizontal: 8,
    gap: 4,
  },
  coinIcon: {
    fontSize: 12,
  },
  balanceText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  plusIconWrap: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewWrap: {
    flex: 1,
    backgroundColor: '#0c0a14',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
