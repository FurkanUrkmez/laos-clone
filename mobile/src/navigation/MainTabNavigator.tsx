import { Pressable, View } from 'react-native';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/main/HomeScreen';
import { MenuScreen } from '../screens/main/MenuScreen';
import { BranchesScreen } from '../screens/main/BranchesScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  Menu: undefined;
  QrAction: undefined;
  Branches: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyScreen() {
  return null;
}

function QrFloatingButton({ onPress }: BottomTabBarButtonProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <Pressable
        onPress={onPress}
        className="h-16 w-16 items-center justify-center rounded-full bg-primary"
        style={{ top: -20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6 }}
      >
        <Ionicons name="qr-code" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6B3E26',
        tabBarInactiveTintColor: '#8A7563',
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          tabBarLabel: 'Menü',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QrAction"
        component={EmptyScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => <QrFloatingButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('QrModal' as never);
          },
        })}
      />
      <Tab.Screen
        name="Branches"
        component={BranchesScreen}
        options={{
          tabBarLabel: 'Şubeler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
