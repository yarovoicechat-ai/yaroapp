import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import BottomTabsNavigator from "./BottomTabsNavigator";

// user ke baaki screens
import Wallet from "../screens/user/Wallet";
import Details from "../screens/user/Details";
import Ranking from "../screens/user/Ranking";
import Level from "../screens/user/Level";
import LevelHelp from "../screens/user/LevelHelp";
import Frame from "../screens/user/Frame";
import Rules from "../screens/app/Rules";
import Withdrawal from "../screens/user/Withdrawal";
import Kyc from "../screens/user/KycVerification";
import FaceVerification from "../screens/user/FaceVerification";
import VerificationHub from "../screens/user/VerificationHub";
import IdManage from "../screens/user/IdManage";
import AboutUs from "../screens/app/AboutUs";
import ContactUs from "../screens/app/ContactUs";
import Setting from "../screens/user/Setting";
import OneToOne from "../screens/user/OneToOne";
import Language from "../screens/user/Language";
import EditProfile from "../screens/user/EditProfile";
import HelpAndSupport from "../screens/app/HelpAndSupport";
import RechargeHistreoy from "../screens/user/RechargeHistreoy";
import ExchangeHistory from "../screens/user/ExchangeHistory";
import Recharge from "../screens/user/Recharge";
import ExchangeCoins from "../screens/user/ExchangeCoins";
import Notifications from "../screens/user/Notifications";
import SystemMessage from "../screens/user/SystemMessage";
import Blacklist from "../screens/user/Blacklist";
import PrivacyPolicy from "../screens/app/PrivacyPolicy";
import RefundPolicy from "../screens/app/RefundPolicy";
import TermOfUse from "../screens/app/TermOfUse";
import Message from "../screens/chats/ChatScreen";
import Incoming from "../screens/call/callIncomingScreen";
import OutGoing from "../screens/call/callOutgoing";
import OnGoing from "../screens/call/ongoingWithGifts";
import CallHistoryScreen from "../screens/call/callHistoryScreen";
import Account from "../screens/user/Account";
import MobileVerification from "../screens/auth/PhoneVerify";
import MobileOtp from "../screens/auth/PhoneVerifyOtp";
import CountrySelectionScreen from "../screens/auth/CountrySelection";
import HostApply from "../screens/app/HostApply";
import CoinHistory from "../screens/user/CoinHistory";
import Earning from "../screens/user/Earning";
import InviteEarn from "../screens/user/InviteEarn";
import HostProfile from "../screens/user/HostProfile";
import CallsScreen from "../screens/chats/CallsScreen";
import GiftsScreen from "../screens/chats/GiftsScreen";
import SystemNoticeScreen from "../screens/chats/SystemNoticeScreen";
import AgencyDetails from "../screens/user/AgencyDetails";
import AgencyDashboard from "../screens/user/AgencyDashboard";
import VoiceRoom from "../screens/user/VoiceRoom";
import BDDashboard from "../screens/user/BDDashboard";
import SVIP from "../screens/user/SVIP";
import MyItems from "../screens/user/MyItems";
import Medal from "../screens/user/Medal";
import UserProfile from "../screens/user/UserProfile";
import Me from "../screens/user/Me";
import FamilyScreen from "../screens/user/FamilyScreen";
import CpSpaceScreen from "../screens/user/CpSpaceScreen";

// Newly created and verified production screens
import UPIVerify from "../screens/user/UPIVerify";
import LinkAccount from "../screens/user/LinkAccount";
import SearchScreen from "../screens/user/SearchScreen";
import VideoCallScreen from "../screens/call/VideoCallScreen";
import LiveStreamScreen from "../screens/user/LiveStreamScreen";
import LiveListScreen from "../screens/user/LiveListScreen";
import ShortsFeedScreen from "../screens/user/ShortsFeedScreen";
import UploadShortScreen from "../screens/user/UploadShortScreen";
import StoreScreen from "../screens/user/StoreScreen";
import FollowersScreen from "../screens/user/FollowersScreen";
import TasksScreen from "../screens/user/TasksScreen";
import FanClubScreen from "../screens/user/FanClubScreen";
import VIPScreen from "../screens/user/VIPScreen";
import DataCenter from "../screens/user/DataCenter";

const Stack = createStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabsNavigator} />
      <Stack.Screen name="OneToOne" component={OneToOne} />
      <Stack.Screen name="Wallet" component={Wallet} />
      <Stack.Screen name="Details" component={Details} />
      <Stack.Screen name="TransactionDetails" component={Details} />
      <Stack.Screen name="Ranking" component={Ranking} />
      <Stack.Screen name="Level" component={Level} />
      <Stack.Screen name="LevelHelp" component={LevelHelp} />
      <Stack.Screen name="Family" component={FamilyScreen} />
      <Stack.Screen name="CpSpace" component={CpSpaceScreen} />
      <Stack.Screen name="Frame" component={Frame} />
      <Stack.Screen name="Rules" component={Rules} />
      <Stack.Screen name="Withdrawal" component={Withdrawal} />
      <Stack.Screen name="Kyc" component={Kyc} />
      <Stack.Screen name="FaceVerification" component={FaceVerification} />
      <Stack.Screen name="VerificationHub" component={VerificationHub} />
      <Stack.Screen name="IdManage" component={IdManage} />
      <Stack.Screen name="AboutUs" component={AboutUs} />
      <Stack.Screen name="ContactUs" component={ContactUs} />
      <Stack.Screen name="Setting" component={Setting} />
      <Stack.Screen name="Language" component={Language} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="HelpAndSupport" component={HelpAndSupport} />
      <Stack.Screen name="RechargeHistreoy" component={RechargeHistreoy} />
      <Stack.Screen name="ExchangeHistory" component={ExchangeHistory} />
      <Stack.Screen name="Recharge" component={Wallet} />
      <Stack.Screen name="Blacklist" component={Blacklist} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="SystemMessage" component={SystemMessage} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen name="RefundPolicy" component={RefundPolicy} />
      <Stack.Screen name="TermOfUse" component={TermOfUse} />
      <Stack.Screen name="Chat" component={Message} />
      <Stack.Screen name="Incomming" component={Incoming} options={{ animation: "none", gestureEnabled: false }} />
      <Stack.Screen name="OutGoing" component={OutGoing} options={{ animation: "none", gestureEnabled: false }} />
      <Stack.Screen
        name="OnGoing"
        component={OnGoing}
        options={{
          animation: "fade",
          presentation: "transparentModal",
          detachPreviousScreen: false,
          gestureEnabled: false,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="CallHistory" component={CallHistoryScreen} />
      <Stack.Screen name="Account" component={Account} />
      <Stack.Screen name="MobileVerify" component={MobileVerification} />
      <Stack.Screen name="MobileVerifyOtp" component={MobileOtp} />
      <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
      <Stack.Screen name="HostApply" component={HostApply} />
      <Stack.Screen name="CoinHistory" component={CoinHistory} />
      <Stack.Screen name="HostProfile" component={HostProfile} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Me" component={Me} />
      <Stack.Screen name="Earning" component={Earning} />
      <Stack.Screen name="ExchangeCoins" component={ExchangeCoins} />
      <Stack.Screen name="InviteEarn" component={InviteEarn} />
      <Stack.Screen name="CallsScreen" component={CallsScreen} />
      <Stack.Screen name="GiftsScreen" component={GiftsScreen} />
      <Stack.Screen name="SystemNoticeScreen" component={SystemNoticeScreen} />
      <Stack.Screen name="AgencyDetails" component={AgencyDetails} />
      <Stack.Screen name="AgencyDashboard" component={AgencyDashboard} />
      <Stack.Screen name="VoiceRoom" component={VoiceRoom} />
      <Stack.Screen name="BDDashboard" component={BDDashboard} />
      <Stack.Screen name="SVIP" component={SVIP} />
      <Stack.Screen name="MyItems" component={MyItems} />
      <Stack.Screen name="Medal" component={Medal} />

      {/* Newly registered routes */}
      <Stack.Screen name="UPIVerify" component={UPIVerify} />
      <Stack.Screen name="LinkAccount" component={LinkAccount} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
      <Stack.Screen name="LiveList" component={LiveListScreen} />
      <Stack.Screen name="ShortsFeed" component={ShortsFeedScreen} />
      <Stack.Screen name="UploadShort" component={UploadShortScreen} />
      <Stack.Screen name="Store" component={StoreScreen} />
      <Stack.Screen name="Followers" component={FollowersScreen} />
      <Stack.Screen name="LinkPhone" component={MobileVerification} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="FanClub" component={FanClubScreen} />
      <Stack.Screen name="VIP" component={VIPScreen} />
      <Stack.Screen name="BeansHistory" component={CoinHistory} />
      <Stack.Screen name="DataCenter" component={DataCenter} />
    </Stack.Navigator>
  );
}
