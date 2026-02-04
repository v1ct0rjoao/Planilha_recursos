import React from 'react';


// Recebe: text (o texto completo), highlight (o que o usuário digitou na busca)
const HighlightText = ({ text, highlight, className }) => {
  // Se não tiver o que grifar, devolve o texto puro.
  if (!highlight || !text) return <span className={className}>{text}</span>;

  // O 'gi' significa: Global (busca todas as ocorrências) e Insensitive (ignora maiúscula/minúscula).
  // O split vai quebrar o texto onde ele achar a palavra chave.
  const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));

return (
    <span className={className}>
      {parts.map((part, i) =>
        // Se a parte atual for igual à busca , pinta de amarelo.
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span
            key={i}
            className="bg-yellow-200 text-slate-900 px-0.5 rounded-[2px] shadow-sm"
          >
            {part}
          </span>
        ) : (
          // Se não for, mostra normal.
          part
        )
      )}
    </span>
  );
};

export default HighlightText;