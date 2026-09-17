import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "MyNewApp",
      in: window,
      launchOptions: launchOptions
    )

    if let rootViewController = window?.rootViewController, let contentView = rootViewController.view {
      let secureView = SecureView(contentView: contentView)
      rootViewController.view = secureView
    }

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

class SecureView: UIView {
  private let textField = SecureTextField()
  private let contentView: UIView
  private var isConfigured = false
  
  init(contentView: UIView) {
    self.contentView = contentView
    super.init(frame: contentView.bounds)
    self.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    
    textField.frame = self.bounds
    textField.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    textField.isSecureTextEntry = true
    addSubview(textField)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    configureSecureContainerIfNeeded()
  }
  
  private func configureSecureContainerIfNeeded() {
    guard !isConfigured else { return }
    
    if let secureContainer = textField.subviews.first(where: { 
      let name = type(of: $0).description()
      return name.contains("Canvas") || name.contains("Content")
    }) {
      contentView.frame = secureContainer.bounds
      contentView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      secureContainer.addSubview(contentView)
      isConfigured = true
    } else {
      if contentView.superview == nil {
        contentView.frame = self.bounds
        contentView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(contentView)
      }
    }
  }
}

class SecureTextField: UITextField {
  override var canBecomeFirstResponder: Bool {
    return false
  }
  
  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    for subview in subviews {
      let convertedPoint = subview.convert(point, from: self)
      if let hitView = subview.hitTest(convertedPoint, with: event) {
        return hitView
      }
    }
    return super.hitTest(point, with: event)
  }
}
