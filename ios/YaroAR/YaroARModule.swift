import Foundation
import React
import UIKit

@objc(YaroAR)
final class YaroARModule:RCTEventEmitter {
  private var session:ARSessionManager?
  override init() {
    super.init()
    NotificationCenter.default.addObserver(self,selector:#selector(background),name:UIApplication.didEnterBackgroundNotification,object:nil)
    NotificationCenter.default.addObserver(self,selector:#selector(memoryWarning),name:UIApplication.didReceiveMemoryWarningNotification,object:nil)
  }
  @objc override static func requiresMainQueueSetup()->Bool { false }
  override func supportedEvents()->[String]! { ["onARReady","onFaceDetected","onFaceLost","onEffectChanged","onARError","onPerformanceUpdate"] }
  @objc private func background() { session?.stop {} }
  @objc private func memoryWarning() { guard let session=session else {return};session.stop {};sendEvent(withName:"onARError",body:["message":"AR stopped after a system memory warning."]) }
  @objc func getCapabilities(_ resolve:RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) {
    let available=arResource("face_landmarker","task") != nil
    resolve(["nativeAvailable":true,"tracking":available,"customVideo":available,"backgroundSegmentation":false,"implementedEffectIds":available ? ARSessionManager.effectIds:[],"verified":false,"reason":"Experimental iOS pipeline; Xcode and device verification required."])
  }
  @objc func initialize(_ config:NSDictionary,resolver resolve:RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) {
    guard session==nil,let track=(config["trackId"] as? NSNumber)?.intValue,track>=0,let fps=(config["fps"] as? NSNumber)?.intValue,(1...30).contains(fps) else { reject("AR_CONFIG","Invalid configuration or an existing AR session owns the camera",nil);return }
    session=ARSessionManager(trackId:track,fps:fps,front:config["frontCamera"] as? Bool ?? true,emit:{ [weak self] name,body in self?.sendEvent(withName:name,body:body) });resolve(nil)
  }
  private func current(_ reject:RCTPromiseRejectBlock)->ARSessionManager? { guard let session=session else { reject("AR_NOT_INITIALIZED","Initialize the AR session first",nil);return nil };return session }
  @objc func startSession(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) { current(reject)?.start { error in if let error=error { reject("YARO_AR",error.localizedDescription,error) } else { resolve(nil) } } }
  @objc func setEffect(_ id:String,resolver resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) { guard let session=current(reject) else { return };session.setEffect(id) { error in if let error=error { reject("AR_EFFECT",error.localizedDescription,error) } else { resolve(nil) } } }
  @objc func setIntensity(_ value:Double,resolver resolve:RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) { guard value.isFinite else {reject("AR_INTENSITY","Intensity must be finite",nil);return};guard let session=current(reject) else{return};session.intensity(Float(value));resolve(nil) }
  @objc func setBeautyIntensity(_ value:Double,resolver resolve:RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) { guard value.isFinite else {reject("AR_INTENSITY","Intensity must be finite",nil);return};guard let session=current(reject) else{return};session.beauty(Float(value));resolve(nil) }
  @objc func setAdjustments(_ value:NSDictionary,resolver resolve:RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) {
    guard let session=current(reject) else {return}
    let keys=["brightness","contrast","saturation","warmth","sharpness"]
    let values=keys.compactMap { (value[$0] as? NSNumber)?.floatValue }
    guard values.count==5,values.allSatisfy({$0.isFinite}) else {reject("AR_ADJUST","Invalid adjustment values",nil);return}
    session.adjust(SIMD4(values[0],values[1],values[2],values[3]),sharpness:values[4]);resolve(nil)
  }
  @objc func removeEffect(_ resolve:RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) { guard let session=current(reject) else{return};session.removeEffect();resolve(nil) }
  @objc func pause(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) { guard let session=current(reject) else{return};session.stop {resolve(nil)} }
  @objc func resume(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock) { startSession(resolve,rejecter:reject) }
  @objc func stopSession(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) { guard let session=session else {resolve(nil);return};session.stop {resolve(nil)} }
  @objc func release(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock) { let old=session;session=nil;guard let old=old else {resolve(nil);return};old.stop {resolve(nil)} }
  deinit { NotificationCenter.default.removeObserver(self);session?.stop {} }
}
