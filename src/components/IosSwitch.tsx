import React from 'react';

interface IosSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const IosSwitch: React.FC<IosSwitchProps> = ({ checked, onChange }) => {
  return (
    <label className="ios-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="slider"></span>
    </label>
  );
};
