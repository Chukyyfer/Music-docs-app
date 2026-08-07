import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MusicScreen from './src/screens/MusicScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import TabBar from './src/components/TabBar';
import PlayerBar from './src/components/PlayerBar';
import { PlayerProvider } from './src/context/PlayerContext';
import { colors } from './src/theme';

export default function App() {
  const [tab, setTab] = useState('music');

  return (
    <SafeAreaProvider>
      <PlayerProvider>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar style="light" />
          <View style={styles.content}>
            {tab === 'music' ? <MusicScreen /> : <DocumentsScreen />}
          </View>
          <PlayerBar />
          <TabBar active={tab} onChange={setTab} />
        </SafeAreaView>
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
});
