import React from 'react';
import { Switch, StyleSheet } from 'react-native';

interface IosSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const IosSwitch: React.FC<IosSwitchProps> = ({ checked, onChange }) => {
  return (
    <Switch
      value={checked}
      onValueChange={onChange}
      trackColor={{ false: '#d1d5db', true: '#2563eb' }}
      thumbColor={checked ? '#ffffff' : '#ffffff'}
      style={styles.switch}
    />
  );
};

const styles = StyleSheet.create({
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});
