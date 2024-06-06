const dbService = require('../server/dbService');

// Middleware untuk memeriksa apakah pengguna sudah login
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Middleware untuk memeriksa apakah pengguna adalah karyawan atau pemilik
const requireKaryawanOrPemilik = async (req, res, next) => {
    const db = dbService.getDbServiceInstance();
    const user = await db.getUserById(req.session.userId);
    
    if (user && (user.role === 'Karyawan' || user.role === 'Pemilik')) {
        return next();
    }
    res.status(403).send('Karyawan or pemilik salah');
};

// Middleware untuk memeriksa apakah pengguna adalah pelanggan
const requirePelanggan = async (req, res, next) => {
    const db = dbService.getDbServiceInstance();
    const pelanggan = await db.getPelangganById(req.session.userId);
    
    if (pelanggan) {
        return next();
    }
    res.status(403).send('Access');
};

module.exports = {
    requireLogin,
    requireKaryawanOrPemilik,
    requirePelanggan
};