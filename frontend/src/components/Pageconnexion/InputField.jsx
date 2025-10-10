export default function InputField({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = true,
  style = {},        // styles venus de la page (ex: height: 44px)
  className = '',
  wrapperStyle = {}, // optionnel: pour ajuster le margin du wrapper
}) {
  return (
    <div style={{ marginBottom: '20px', ...wrapperStyle }}>
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
