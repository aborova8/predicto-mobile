import { Tabs } from 'expo-router';

import { PredictoTabBar } from '@/components/nav/PredictoTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PredictoTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="matches" />
      <Tabs.Screen name="leaderboard" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
