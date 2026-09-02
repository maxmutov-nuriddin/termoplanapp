import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { LocationScreen } from '../screens/LocationScreen';
import { ConstructorScreen } from '../screens/ConstructorScreen';
import { CADStudioScreen } from '../screens/CADStudioScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { PdfViewerScreen } from '../screens/PdfViewerScreen';

export type RootStackParamList = {
  HomeScreen: undefined;
  LocationScreen: { projectId?: string };
  ConstructorScreen: { projectId?: string };
  CADStudioScreen: { projectId?: string };
  ResultsScreen: { projectId?: string };
  PdfViewerScreen: { projectId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="LocationScreen" component={LocationScreen} />
      <Stack.Screen name="ConstructorScreen" component={ConstructorScreen} />
      <Stack.Screen
        name="CADStudioScreen"
        component={CADStudioScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
      <Stack.Screen name="PdfViewerScreen" component={PdfViewerScreen} />
    </Stack.Navigator>
  );
};
