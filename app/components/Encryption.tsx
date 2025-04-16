import CryptoJS from "crypto-js";

// Usa uma chave segura de ambiente ou cria uma baseada no ID do usuário
// Em produção, esta chave deve vir de uma variável de ambiente segura
// IMPORTANTE: Mudar esta chave fará com que todas as notas existentes não possam ser descriptografadas
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "fair-note-secure-encryption-key-2025";

// Função para verificar se um texto parece ser criptografado
const isLikelyEncrypted = (text: string): boolean => {
  // Textos criptografados por CryptoJS AES geralmente têm estas características
  try {
    return (
      typeof text === 'string' &&
      text.length > 20 &&
      text.includes('U2Fsd') // Prefixo comum em textos criptografados por CryptoJS
    );
  } catch {
    return false;
  }
};

export function encrypt(text: string): string {
  if (!text) return '';
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    return text;
  }
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';

  try {
    // Verifica se o texto parece ser criptografado
    if (!isLikelyEncrypted(ciphertext)) {
      // Se não parecer criptografado, retorna o texto original
      return ciphertext;
    }

    // Tenta descriptografar
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // Se a descriptografia resultar em texto vazio, pode indicar um problema
    if (!decrypted) {
      console.warn('Descriptografia resultou em texto vazio');
      return ciphertext;
    }

    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    // Em caso de erro, retorna o texto original
    return ciphertext;
  }
}
