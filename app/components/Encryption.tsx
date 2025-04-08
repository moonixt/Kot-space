// import CryptoJS from "crypto-js";

// const SECRET_KEY = process.env.ENCRYPTION_KEY || "default_secret_key"; // Use a secure key in production

// // Função para verificar se um texto parece ser criptografado
// const isLikelyEncrypted = (text: string): boolean => {
//   // Textos criptografados por CryptoJS AES geralmente têm estas características
//   try {
//     return (
//       typeof text === 'string' &&
//       text.length > 20 &&
//       text.includes('U2Fsd') // Prefixo comum em textos criptografados por CryptoJS
//     );
//   } catch {
//     return false;
//   }
// };

// export function encrypt(text: string): string {
//   if (!text) return '';
//   try {
//     return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
//   } catch (error) {
//     console.error('Erro ao criptografar:', error);
//     return text;
//   }
// }

// export function decrypt(ciphertext: string): string {
//   if (!ciphertext) return '';

//   try {
//     // Verifica se o texto parece ser criptografado
//     if (!isLikelyEncrypted(ciphertext)) {
//       // Se não parecer criptografado, retorna o texto original
//       return ciphertext;
//     }

//     // Tenta descriptografar
//     const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
//     const decrypted = bytes.toString(CryptoJS.enc.Utf8);

//     // Se a descriptografia resultar em texto vazio, pode indicar um problema
//     if (!decrypted) {
//       console.warn('Descriptografia resultou em texto vazio');
//       return ciphertext;
//     }

//     return decrypted;
//   } catch (error) {
//     console.error('Erro ao descriptografar:', error);
//     // Em caso de erro, retorna o texto original
//     return ciphertext;
//   }
// }
