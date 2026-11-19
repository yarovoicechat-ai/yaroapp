#import "AgoraARAdapter.h"
#import "AgoraRtcNg.h"
#import <AgoraRtcWrapper/iris_module.h>

@implementation YaroAgoraARAdapter
- (BOOL)pushBGRA:(NSData *)bytes width:(NSInteger)width height:(NSInteger)height timestamp:(NSInteger)timestamp trackId:(NSInteger)trackId error:(NSError **)error {
  AgoraRtcNg *module=[AgoraRtcNg shareInstance];
  @synchronized(module) {
    if(!module.irisApiEngine) { if(error) *error=[NSError errorWithDomain:@"YaroAR" code:1 userInfo:@{NSLocalizedDescriptionKey:@"Existing Agora engine unavailable"}]; return NO; }
    NSDictionary *params=@{@"frame":@{@"type":@2,@"format":@2,@"stride":@(width),@"height":@(height),@"rotation":@0,@"timestamp":@(timestamp)},@"videoTrackId":@(trackId)};
    NSData *json=[NSJSONSerialization dataWithJSONObject:params options:0 error:error]; if(!json) return NO;
    NSString *string=[[NSString alloc] initWithData:json encoding:NSUTF8StringEncoding];
    void *buffers[5]={const_cast<void *>(bytes.bytes),nullptr,nullptr,nullptr,nullptr};
    unsigned int lengths[5]={(unsigned int)bytes.length,0,0,0,0};
    char result[kBasicResultLength]="";
    ApiParam parameter={.event="MediaEngine_pushVideoFrame_4e544e2",.data=string.UTF8String,.data_size=(unsigned int)json.length,.result=result,.buffer=buffers,.length=lengths,.buffer_count=5};
    int code=module.irisApiEngine->CallIrisApi(&parameter);
    NSDictionary *value=[NSJSONSerialization JSONObjectWithData:[[NSString stringWithUTF8String:result] dataUsingEncoding:NSUTF8StringEncoding] options:0 error:nil];
    if(code!=0 || !value[@"result"] || [value[@"result"] intValue]<0) { if(error) *error=[NSError errorWithDomain:@"YaroAR" code:2 userInfo:@{NSLocalizedDescriptionKey:@"Agora rejected processed AR video frame"}]; return NO; }
    return YES;
  }
}
@end
