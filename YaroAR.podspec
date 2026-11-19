Pod::Spec.new do |s|
  s.name = 'YaroAR'
  s.version = '0.1.0'
  s.summary = 'Original Yaro native camera effects pipeline'
  s.homepage = 'https://yaroapp.in'
  s.license = { :type => 'Proprietary', :text => 'Original Yaro application source. Third-party licenses are distributed separately.' }
  s.author = 'Yaro'
  s.source = { :git => 'https://yaroapp.in', :tag => s.version }
  s.platform = :ios, '15.1'
  s.swift_version = '5.0'
  s.source_files = 'ios/YaroAR/**/*.{h,m,mm,swift}'
  s.public_header_files = 'ios/YaroAR/agora/AgoraARAdapter.h'
  s.resource_bundles = { 'YaroARResources' => ['shared/ar-assets/models/*.{task,glb}', 'shared/ar-assets/shaders/*.metal', 'shared/ar-assets/licenses/*'] }
  s.dependency 'React-Core'
  s.dependency 'react-native-agora', '4.6.2'
  s.dependency 'MediaPipeTasksVision', '0.10.21'
  s.frameworks = 'AVFoundation', 'Metal', 'CoreVideo'
  s.pod_target_xcconfig = { 'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17', 'HEADER_SEARCH_PATHS' => '$(inherited) "$(PODS_ROOT)/Headers/Public/react-native-agora"' }
end
