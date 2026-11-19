import AVFoundation
import UIKit

final class ARCameraManager {
  let session=AVCaptureSession()
  private var orientationObserver:NSObjectProtocol?
  private func orient(_ connection:AVCaptureConnection) {
    guard connection.isVideoOrientationSupported else { return }
    switch UIDevice.current.orientation {
    case .portrait: connection.videoOrientation = .portrait
    case .portraitUpsideDown: connection.videoOrientation = .portraitUpsideDown
    case .landscapeLeft: connection.videoOrientation = .landscapeRight
    case .landscapeRight: connection.videoOrientation = .landscapeLeft
    default: break
    }
  }
  func configure(front:Bool,delegate:AVCaptureVideoDataOutputSampleBufferDelegate,queue:DispatchQueue) throws {
    guard AVCaptureDevice.authorizationStatus(for:.video)==.authorized else { throw YaroARError.unavailable("Camera permission is required") }
    session.beginConfiguration(); defer { session.commitConfiguration() }
    session.sessionPreset = .hd1280x720
    guard let camera=AVCaptureDevice.default(.builtInWideAngleCamera,for:.video,position:front ? .front : .back) else { throw YaroARError.unavailable("Requested camera unavailable") }
    let input=try AVCaptureDeviceInput(device:camera)
    guard session.canAddInput(input) else { throw YaroARError.unavailable("Camera is already in use") }; session.addInput(input)
    let output=AVCaptureVideoDataOutput(); output.videoSettings=[kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA]
    output.alwaysDiscardsLateVideoFrames=true; output.setSampleBufferDelegate(delegate,queue:queue)
    guard session.canAddOutput(output) else { throw YaroARError.unavailable("Camera frame output unavailable") }; session.addOutput(output)
    if let connection=output.connection(with:.video) {
      if connection.isVideoOrientationSupported { connection.videoOrientation = .portrait }
      orient(connection)
      if connection.isVideoMirroringSupported { connection.automaticallyAdjustsVideoMirroring=false; connection.isVideoMirrored=false }
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()
      orientationObserver=NotificationCenter.default.addObserver(forName:UIDevice.orientationDidChangeNotification,object:nil,queue:.main) { [weak self,weak connection] _ in if let connection=connection { self?.orient(connection) } }
    }
  }
  func start() { session.startRunning() }
  func stop() { if let observer=orientationObserver {NotificationCenter.default.removeObserver(observer);orientationObserver=nil;UIDevice.current.endGeneratingDeviceOrientationNotifications()};session.stopRunning(); session.inputs.forEach { session.removeInput($0) }; session.outputs.forEach { session.removeOutput($0) } }
}
