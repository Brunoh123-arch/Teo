import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Map, History, User, Settings } from 'lucide-react-native';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'map', label: 'Mapa', icon: Map },
    { id: 'history', label: 'Viagens', icon: History },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={styles.tab}
            >
              <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                <Icon size={24} color={isActive ? '#2563eb' : '#6b7280'} />
              </View>
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(243, 244, 246, 0.9)', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 64 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconWrapper: { padding: 4, borderRadius: 12 },
  activeIconWrapper: { backgroundColor: '#dbeafe' },
  label: { fontSize: 10, fontWeight: 'bold', color: '#6b7280' },
  activeLabel: { color: '#2563eb' }
});
