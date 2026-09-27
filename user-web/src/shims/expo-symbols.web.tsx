import React from 'react';

export const SymbolView: React.FC<any> = ({ name, style, size = 24, tintColor, ...props }) => {
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, color: tintColor, ...style }} {...props}>
      ⚙️
    </span>
  );
};

export default SymbolView;
