"use client";

/**
 * Botão de submit para ações destrutivas: pede confirmação nativa antes de
 * enviar o form (achado 19). O diálogo nativo é acessível por teclado e
 * leitor de tela.
 */
export function BotaoConfirmar({
  mensagem,
  className,
  style,
  children,
}: {
  mensagem: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <button
      className={className}
      style={style}
      onClick={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
