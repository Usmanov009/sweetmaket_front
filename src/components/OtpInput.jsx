import { useRef, memo } from 'react';

const OtpInput = memo(function OtpInput({ value, onChange, C }) {
  const inputRefs = useRef([null,null,null,null,null,null]);
  const digits = (value + '      ').slice(0, 6).split('');

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g,'').slice(-1);
    if (!d) return;
    const arr = [...digits.map(x => x.trim()==='' ? '' : x)];
    arr[i] = d;
    onChange(arr.join('').slice(0, 6));
    if (i < 5) inputRefs.current[i+1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (value.length > 0) onChange(value.slice(0, -1));
      if (i > 0) inputRefs.current[i-1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      if (pasted.length < 6) inputRefs.current[pasted.length]?.focus();
    }
  };

  return (
    <div style={{ display:'flex', gap: 10, justifyContent:'center', margin:'12px 0 24px' }}>
      {[0,1,2,3,4,5].map(i => {
        const filled = digits[i].trim() !== '';
        return (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digits[i].trim()}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            className="input-focus"
            style={{
              width: 48, height: 58,
              textAlign: 'center',
              fontSize: 24, fontWeight: 700,
              borderRadius: 16,
              border: `2px solid ${filled ? C.navy : C.border}`,
              background: filled ? C.pale : C.s1,
              color: C.dark,
              transition: 'all .18s',
              letterSpacing: 2,
            }}
          />
        );
      })}
    </div>
  );
});

export default OtpInput;
