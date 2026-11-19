import { ARController } from '../features/YaroAR/core/ARController';
import { ARBridge } from '../features/YaroAR/core/ARBridge';
import { effectRegistry, beautyPresetRegistry } from '../features/YaroAR/effects/registry/effectRegistry';
import { clampIntensity } from '../features/YaroAR/core/ARConstants';

const mockNative = Object.fromEntries(['initialize','startSession','setEffect','setIntensity','setBeautyIntensity','setAdjustments','stopSession','release','pause','resume'].map(name=>[name,jest.fn(async()=>{})]));
jest.mock('../features/YaroAR/core/ARBridge',()=>({ ARBridge:{native:()=>mockNative,capabilities:jest.fn(),subscribe:jest.fn(()=>()=>{})} }));
let controller,engine,unbind;
beforeEach(()=>{
  jest.clearAllMocks();
  Object.values(mockNative).forEach(method=>method.mockImplementation(async()=>{}));
  ARBridge.capabilities.mockResolvedValue({nativeAvailable:true,tracking:true,customVideo:true,implementedEffectIds:[...effectRegistry,...beautyPresetRegistry].filter(effect=>effect.status!=='pending').map(effect=>effect.id),verified:false});
  controller=new ARController();
  engine=Object.fromEntries(['stopPreview','startPreview','enableLocalVideo','destroyCustomVideoTrack','updateChannelMediaOptions'].map(name=>[name,jest.fn(()=>0)]));
  engine.createCustomVideoTrack=jest.fn(()=>0);
  unbind=controller.bind(engine,{inChannel:true});
});
afterEach(async()=>{await unbind()});
test('catalog has exactly 50 unique requested definitions and no unverified effect claims',()=>{
  expect(effectRegistry).toHaveLength(50);
  expect(new Set(effectRegistry.map(effect=>effect.id)).size).toBe(50);
  expect(effectRegistry.filter(effect=>effect.status==='verified')).toHaveLength(0);
  expect(effectRegistry.filter(effect=>effect.status==='pending')).toHaveLength(0);
  expect(effectRegistry.every(effect=>effect.thumbnailSvg.startsWith('<svg'))).toBe(true);
});
test('unsupported native model cannot start capture or produce a fake selected state',async()=>{
  ARBridge.capabilities.mockResolvedValue({customVideo:true,tracking:true,implementedEffectIds:['yaro-beauty'],reason:'Model unavailable in this build'});
  await expect(controller.select('puppy')).rejects.toThrow('Model unavailable');
  expect(engine.stopPreview).not.toHaveBeenCalled();
  expect(mockNative.setEffect).not.toHaveBeenCalled();
  expect(controller.getSnapshot().selectedId).toBe(null);
  expect(controller.getSnapshot().effectStates.puppy).toBe('unavailable');
});

test('selection stays loading until the native rendered-frame acknowledgement',async()=>{
  engine.startPreview.mockImplementation(source => source === 4 ? -2 : 0);
  let rendered;
  mockNative.setEffect.mockImplementationOnce(()=>new Promise(resolve=>{rendered=resolve}));
  const operation=controller.select('puppy');
  for(let i=0;i<20 && !rendered;i++)await Promise.resolve();
  expect(rendered).toBeDefined();
  expect(controller.getSnapshot().selectedId).toBe(null);
  expect(controller.getSnapshot().effectStates.puppy).toBe('loading');
  rendered();await operation;
  expect(controller.getSnapshot().effectStates.puppy).toBe('active');
  expect(engine.startPreview).not.toHaveBeenCalledWith(4);
});

test('failed render is reported as failed and restores the original camera',async()=>{
  mockNative.setEffect.mockRejectedValueOnce(new Error('GPU upload failed'));
  await expect(controller.select('puppy')).rejects.toThrow('GPU upload');
  expect(controller.getSnapshot().effectStates.puppy).toBe('failed');
  expect(controller.getSnapshot().selectedId).toBe(null);
  expect(engine.enableLocalVideo).toHaveBeenLastCalledWith(true);
});

test('all nine beauty names resolve to separate native modes',()=>{
  const beauty=[...effectRegistry.filter(e=>e.category==='Beauty'),...beautyPresetRegistry];
  expect(beauty).toHaveLength(9);
  expect(new Set(beauty.map(e=>e.renderer.mode)).size).toBe(9);
});

test('live screen handoff applies the saved camera and processing before confirming the effect',async()=>{
  const adjustments={brightness:.2,contrast:1.1,saturation:.9,warmth:.1,sharpness:.3};
  await controller.select('lip-tint',{intensity:.81,beautyIntensity:.3,adjustments,frontCamera:false});
  expect(mockNative.initialize).toHaveBeenCalledWith(expect.objectContaining({frontCamera:false}));
  expect(mockNative.setIntensity).toHaveBeenCalledWith(.81);
  expect(mockNative.setAdjustments).toHaveBeenCalledWith(adjustments);
  expect(mockNative.setAdjustments.mock.invocationCallOrder[0]).toBeLessThan(mockNative.setEffect.mock.invocationCallOrder[0]);
  expect(controller.getSnapshot()).toMatchObject({selectedId:'lip-tint',intensity:.81,beautyIntensity:.3,frontCamera:false,adjustments});
});

test('rear camera preserves effect, intensity and microphone ownership',async()=>{
  await controller.select('puppy');await controller.intensity(.73);
  await controller.switchCamera();
  expect(mockNative.initialize).toHaveBeenLastCalledWith(expect.objectContaining({frontCamera:false}));
  expect(mockNative.setIntensity).toHaveBeenLastCalledWith(.73);
  expect(controller.getSnapshot().selectedId).toBe('puppy');
  expect(controller.getSnapshot().effectStates.puppy).toBe('active');
  expect(engine.updateChannelMediaOptions.mock.calls.every(([o])=>!('publishMicrophoneTrack' in o))).toBe(true);
});
test('missing native capabilities preserve ordinary Agora capture',async()=>{
  ARBridge.capabilities.mockResolvedValue({customVideo:false,tracking:false,implementedEffectIds:[],reason:'Not in build'});
  await expect(controller.select('yaro-beauty')).rejects.toThrow('Not in build');
  expect(engine.enableLocalVideo).not.toHaveBeenCalled();
});
test('video track 0 is valid and effect switching never restarts camera or audio',async()=>{
  await controller.select('yaro-beauty');
  expect(mockNative.initialize).toHaveBeenCalledWith(expect.objectContaining({trackId:0,width:720,height:1280}));
  expect(engine.updateChannelMediaOptions).toHaveBeenCalledWith({publishCameraTrack:false,publishCustomVideoTrack:true,customVideoTrackId:0});
  await controller.select('pink-glow');
  expect(mockNative.startSession).toHaveBeenCalledTimes(1);
  expect(engine.createCustomVideoTrack).toHaveBeenCalledTimes(1);
  expect(engine.updateChannelMediaOptions.mock.calls.every(([options])=>!('publishMicrophoneTrack' in options))).toBe(true);
});
test('native start failure restores camera after native cleanup',async()=>{
  mockNative.startSession.mockRejectedValueOnce(new Error('Camera unavailable'));
  await expect(controller.select('yaro-beauty')).rejects.toThrow('Camera unavailable');
  expect(mockNative.stopSession).toHaveBeenCalled();expect(mockNative.release).toHaveBeenCalled();
  expect(engine.enableLocalVideo).toHaveBeenLastCalledWith(true);
  expect(engine.destroyCustomVideoTrack).toHaveBeenCalledWith(0);
  expect(controller.getSnapshot().trackId).toBe(null);
});
test('camera restore waits for native ownership to end',async()=>{
  await controller.select('yaro-beauty');
  let finish;
  mockNative.stopSession.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
  const operation=controller.stop();await Promise.resolve();await Promise.resolve();
  expect(engine.enableLocalVideo).toHaveBeenCalledTimes(1);
  finish();await operation;
  expect(engine.enableLocalVideo).toHaveBeenLastCalledWith(true);
});
test('a second session cannot seize the existing camera owner',()=>{
  expect(()=>controller.bind(engine)).toThrow('Another camera session');
});
test('preview-only sessions do not modify channel publishing',async()=>{
  await unbind();unbind=controller.bind(engine);
  await controller.select('golden-shine');
  expect(engine.updateChannelMediaOptions).not.toHaveBeenCalled();
});
test('intensity rejects invalid values and clamps valid values',()=>{
  expect(()=>clampIntensity(NaN)).toThrow('finite');
  expect(()=>clampIntensity(Infinity)).toThrow('finite');
  expect(clampIntensity(-1)).toBe(0);expect(clampIntensity(2)).toBe(1);
});
test('background cleanup does not reopen the ordinary camera until foregrounding',async()=>{
  await controller.select('yaro-beauty');
  controller.setForeground(false);
  await controller.stop();
  expect(engine.enableLocalVideo).toHaveBeenCalledTimes(1);
  controller.setForeground(true);
  expect(engine.enableLocalVideo).toHaveBeenLastCalledWith(true);
});
