import React from 'react';


const HighlightText = ({ text, highlight, className }) => {

  if (!highlight || !text) return <span className={className}>{text}</span>;


  const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));

return (
    <span className={className}>
      {parts.map((part, i) =>
   
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span
            key={i}
            className="bg-yellow-200 text-slate-900 px-0.5 rounded-[2px] shadow-sm"
          >
            {part}
          </span>
        ) : (
  
          part
        )
      )}
    </span>
  );
};

export default HighlightText;