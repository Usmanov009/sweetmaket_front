const MSG = {
  alreadySeller:    { uz: "Siz allaqachon sotuvchi sifatida ro'yxatdan o'tgansiz. Iltimos, boshqa Telegram hisobidan foydalaning.", ru: 'Вы уже зарегистрированы как продавец. Используйте другой аккаунт Telegram.' },
  phoneExists:      { uz: "Bu telefon raqam allaqachon ro'yxatdan o'tgan", ru: 'Этот номер телефона уже зарегистрирован' },
  sellerNotFound:   { uz: 'Sotuvchi topilmadi', ru: 'Продавец не найден' },
  wrongPassword:    { uz: "Parol noto'g'ri", ru: 'Неверный пароль' },
  invalidPhone:     { uz: "Telefon raqam noto'g'ri", ru: 'Неверный номер телефона' },
  serverError:      { uz: 'Server xatosi', ru: 'Ошибка сервера' },
  requiredFields:   { uz: "Ism, do'kon nomi, telefon va parol kerak", ru: 'Имя, название магазина, телефон и пароль обязательны' },
  phonePassRequired:{ uz: 'Telefon va parol kerak', ru: 'Телефон и пароль обязательны' },
  regionCityRequired:{ uz: 'Region va city kerak', ru: 'Область и город обязательны' },
};

function m(req, key) {
  const lang = (req.headers['accept-language'] || 'uz').startsWith('ru') ? 'ru' : 'uz';
  return MSG[key]?.[lang] || MSG[key]?.uz || key;
}

module.exports = { m };
