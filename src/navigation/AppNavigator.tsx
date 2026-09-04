import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthScreen } from '../screens/AuthScreen';
import { SupportControlPanelScreen } from '../screens/SupportControlPanelScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LocationScreen } from '../screens/LocationScreen';
import { ConstructorScreen } from '../screens/ConstructorScreen';
import { CADStudioScreen } from '../screens/CADStudioScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { PdfViewerScreen } from '../screens/PdfViewerScreen';
import { COLORS } from '../theme';

export type RootStackParamList = {
  AuthScreen: undefined;
  SupportControlPanelScreen: undefined;
  HomeScreen: undefined;
  SettingsScreen: undefined;
  LocationScreen: { projectId?: string };
  ConstructorScreen: { projectId?: string };
  CADStudioScreen: { projectId?: string };
  ResultsScreen: { projectId?: string };
  PdfViewerScreen: { projectId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.bg },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="AuthScreen" component={AuthScreen} />
      ) : user?.role === 'support' ? (
        <Stack.Screen name="SupportControlPanelScreen" component={SupportControlPanelScreen} />
      ) : (
        <>
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
          <Stack.Screen name="LocationScreen" component={LocationScreen} />
          <Stack.Screen name="ConstructorScreen" component={ConstructorScreen} />
          <Stack.Screen
            name="CADStudioScreen"
            component={CADStudioScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
          <Stack.Screen name="PdfViewerScreen" component={PdfViewerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
