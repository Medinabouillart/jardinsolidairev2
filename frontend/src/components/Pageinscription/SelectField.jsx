import React from 'react';

export default function InputField({
  type, name, value, onChange, placeholder,
  required = true, style = {}, className = ''
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={className}
        style={style}
      />
    </div>
  );
}
