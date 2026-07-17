import { get as idbGet, set as idbSet } from 'idb-keyval';
import CryptoJS from 'crypto-js';

const SECRET_KEY = "champion-master-super-secret-key"; // Oyun dosyalarında sabit tutulur

// Gelen metni AES ile şifrele
export const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// AES şifresini çöz
export const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (e) {
    console.error("Şifre çözme hatası:", e);
    return null;
  }
};

// Kullanıcı kayıt
export const registerUser = async (email, password, method = 'email') => {
  let encryptedUsers = await idbGet('champion-users');
  let users = encryptedUsers ? decryptData(encryptedUsers) : [];
  
  if (users.find(u => u.email === email)) {
    return { success: false, reason: 'Bu e-posta adresi zaten kayıtlı.' };
  }

  // Şifreyi de hashleyerek saklayalım (Güvenlik)
  const hashedPassword = password ? CryptoJS.SHA256(password).toString() : null;

  const newUser = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    method
  };

  users.push(newUser);
  await idbSet('champion-users', encryptData(users));
  
  // Oturum aç
  await idbSet('champion-active-user', encryptData(newUser));
  return { success: true, user: newUser };
};

// Kullanıcı giriş
export const loginUser = async (email, password, method = 'email') => {
  let encryptedUsers = await idbGet('champion-users');
  if (!encryptedUsers) return { success: false, reason: 'Kayıtlı kullanıcı bulunamadı.' };
  
  let users = decryptData(encryptedUsers);
  if (!users) return { success: false, reason: 'Veritabanı bozuk.' };

  const user = users.find(u => u.email === email);
  if (!user) return { success: false, reason: 'Kullanıcı bulunamadı.' };

  if (method === 'email') {
    const hashedPassword = CryptoJS.SHA256(password).toString();
    if (user.password !== hashedPassword) {
      return { success: false, reason: 'Hatalı şifre.' };
    }
  }

  await idbSet('champion-active-user', encryptData(user));
  return { success: true, user };
};

// Aktif kullanıcıyı getir
export const getActiveUser = async () => {
  const encryptedUser = await idbGet('champion-active-user');
  if (!encryptedUser) return null;
  return decryptData(encryptedUser);
};

// Çıkış yap
export const logoutUser = async () => {
  await idbSet('champion-active-user', null);
};
