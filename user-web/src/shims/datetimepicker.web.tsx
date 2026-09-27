import React from 'react';

export type DateTimePickerEvent = any;

export const DateTimePicker: React.FC<any> = ({ value, onChange, mode = 'date', ...props }) => {
  const dateStr = value instanceof Date ? value.toISOString().slice(0, 10) : '';

  return (
    <input
      type={mode === 'time' ? 'time' : 'date'}
      value={dateStr}
      onChange={(e) => {
        if (onChange) {
          const newDate = e.target.valueAsDate || new Date(e.target.value);
          onChange({ type: 'set', nativeEvent: { timestamp: newDate?.getTime() || Date.now() } }, newDate);
        }
      }}
      {...props}
    />
  );
};

export default DateTimePicker;
