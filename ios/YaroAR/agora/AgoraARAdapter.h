#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
@interface YaroAgoraARAdapter : NSObject
- (BOOL)pushBGRA:(NSData *)bytes width:(NSInteger)width height:(NSInteger)height timestamp:(NSInteger)timestamp trackId:(NSInteger)trackId error:(NSError **)error;
@end
NS_ASSUME_NONNULL_END
