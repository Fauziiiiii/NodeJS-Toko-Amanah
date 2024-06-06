const express = require('express');
const session = require('express-session');
const app = express();
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const layouts = require('express-ejs-layouts')
dotenv.config();

const dbService = require('./dbService');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended : false }));
app.use(layouts)

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


// Agar bisa akses file statis dari direktori client
app.use(express.static(path.join(__dirname, '..', 'client')));

// Akses Bootstrap
app.get('/css/bootstrap.css', (req, res) => {
    res.sendFile(__dirname + '/node_modules/bootstrap/dist/css/bootstrap.css')
});
app.get('/js/bootstrap.js', (req, res) => {
    res.sendFile(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.js')
});

// akses static file untuk halaman ejs
app.use('/assets', express.static(path.join(__dirname, '../adminmart-master/adminmart-master/assets')));
app.use('/dist', express.static(path.join(__dirname, '../adminmart-master/adminmart-master/dist')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));


// Agar bisa akses file statis dari direktori client/views
app.set('views', path.join(__dirname, '..', 'client', 'views'));
app.set('view engine', 'ejs');

// Middleware untuk memeriksa apakah user sudah login
const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// akses ke middleware ketika akses endpoint /login dan /register

app.use((req, res, next) => {
    if (req.path !== '/login' && req.path !== '/register') {
        requireLogin(req, res, next);
    } else {
        next();
    }
});

// Middleware untuk memeriksa role
const checkRole = (roles) => {
    return (req, res, next) => {
        const { userRole } = req.session;
        if (roles.includes(userRole)) {
            return next();
        } else {
            return res.status(403).send('Anda tidak memiliki izin untuk mengakses halaman ini.');
        }
    };
};


// Start AUTH Routes
app.get('/login', (req, res) => {
    res.render('login', { layout: 'auth' });
});

// app.post('/login', async (req, res) => {
//     const { nama, password } = req.body;
//     const db = dbService.getDbServiceInstance();
//     const user = await db.getUserByNama(nama);
//     const pelanggan = await db.getPelangganByNama(nama);
    
//     if (user && bcrypt.compareSync(password, user.password)) {
//         req.session.userId = user.id_user;
//         res.redirect('/dashboard');     
//     }else if(pelanggan && bcrypt.compareSync(password, pelanggan.password)){
//         req.session.userId = pelanggan.id_pelanggan;
//         res.redirect('/pelanggan/transaksi');
//     } else {
//         res.json('salah uwoeee');
//     }
// });

app.post('/login', async (req, res) => {
    const { nama, password } = req.body;
    const db = dbService.getDbServiceInstance();
    const user = await db.getUserByNama(nama);
    const pelanggan = await db.getPelangganByNama(nama);
    
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id_user;
        req.session.userRole = user.role;
        res.redirect('/dashboard');     
    } else if(pelanggan && bcrypt.compareSync(password, pelanggan.password)){
        req.session.userId = pelanggan.id_pelanggan;
        req.session.userRole = 'pelanggan';
        res.redirect('/pelanggan/transaksi');
    } else {
        res.json('salah uwoeee');
    }
});


app.get('/register', (req, res) => {
    res.render('regist', { layout: 'auth'});
});

app.post('/register', async (req, res) => {
    const { nama, email, password } = req.body;
    const db = dbService.getDbServiceInstance();
    const userId = await db.registerUser(nama, email, password);
    if (userId) {
        res.redirect('/login');
    } else {
        res.redirect('regist', { error: 'Failed to register user' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});
// End AUTH Routes


app.get('/', checkRole(['Karyawan', 'Pemilik']),  (req, res) => {
    const db = dbService.getDbServiceInstance();
    const users = db.getAllCountUser();
    const produks = db.getAllCountProduk();
    const transaksis = db.getAllTransaksi();

    res.render('dashboard', { user: users});
});

app.get('/dashboard', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const db = dbService.getDbServiceInstance();
    const users = db.getAllCountUser();

    db.getAllCountUser()
        .then(data => {
        
        res.render('dashboard', { user: data }); // Render halaman index USERS dan mengirim properti berupa data USERS
        })
        .catch(err => {
            console.log(err);ng
        });
});


// USERS Table
//User
app.get('/user', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const db = dbService.getDbServiceInstance();

    db.getAllUser()
        .then(data => {
        if (!Array.isArray(data)) {
            console.log('Error:', data);
            data = [];
        }
        res.render('indexUsers', { user: data }); // Render halaman index USERS dan mengirim properti berupa data USERS
        })
        .catch(err => {
        console.log(err);
        res.render('indexUsers', { user: [] }); // Handle error dengan array / data kosong
        });
});


app.get('/user/create', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    res.render('createUsers');
});

app.post('/user/insert/', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const { nama, email, alamat, password,  role, created_at} = req.body;
    const db = dbService.getDbServiceInstance();

    db.insertNewUser(nama, email, alamat, password, role, created_at)
        .then(insertedData => {
            if (insertedData) {
                res.redirect('/user');
            } else {
                res.status(500).send('Gagal menambahkan data!');
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error Lekkk!!');
        });
});

app.get('/user/edit/:id', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
        const { id } = req.params;
        const db = dbService.getDbServiceInstance();
    
        db.getUserById(id).then(user => {
                if (user) {
                    res.render('updateUsers', { user });
                } else {
                    res.status(404).send('Upss data Produk nggak ketemu..');
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).send('Errorr Lekkk!!!!');
            });
    });
    

app.post('/user/update/:id', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const { id } = req.params;
    const { nama, alamat, role } = req.body;
    const db = dbService.getDbServiceInstance();

    db.updateUserById(id, nama, alamat, role)
        .then(res.redirect('/user'))
        .catch(err => {
            console.log(err);
            res.status(500).send('Error Lekkk!!!!');
        });
});

app.post('/user/delete/:id', checkRole(['Karyawan', 'Pemilik']), async (req, res) => {
    const { id } = req.params;
    const db = dbService.getDbServiceInstance();

    try {
        const deleted = await db.deleteUserById(id);
        if (deleted) {
            res.redirect('/user'); 
        } else {
            console.error('Error deleting user:', err);
            res.status(500).send('Gagal menghapus data!');
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Error Lekkk!!!!'); 
    }
});


// PELANGGAN Table
app.get('/pelanggan', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const db = dbService.getDbServiceInstance();

    db.getAllPelanggan()
        .then(data => {
            if (!Array.isArray(data)) {
                console.log('Error:', data);
                data = [];
            }
            res.render('indexPelanggan', { myPelanggan: data });
        })
        .catch(err => {
            console.log(err);
            res.render('indexPelanggan', { myPelanggan: [] });
        });
});

app.get('/pelanggan/create', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    res.render('createPelanggan');
});

app.post('/pelanggan/insert', (req, res) => {
    const { nama_pelanggan, email, password, alamat } = req.body;
    const db = dbService.getDbServiceInstance();

    db.insertNewPelanggan(nama_pelanggan, email, password, alamat)
        .then(insertedData => {
            if (insertedData) {
                res.redirect('/pelanggan');
            } else {
                res.status(500).send('Gagal menambahkan data!');
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error Lekkk!!');
        });
});


// PRODUK Table
app.get('/produk', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const db = dbService.getDbServiceInstance();

    db.getAllProduk()
        .then(data => {
            if (!Array.isArray(data)) {
                console.log('Error:', data);
                data = [];
            }
            res.render('indexProduk', { myProduk: data });
        })
        .catch(err => {
            console.log(err);
            res.render('indexProduk', { myProduk: [] });
        });
});

app.get('/produk/create', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    res.render('createProduk');
});

app.post('/produk/insert', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const { nama_produk, harga_satuan, stok } = req.body;
    const db = dbService.getDbServiceInstance();

    db.insertNewProduk(nama_produk, harga_satuan, stok)
        .then(insertedData => {
            if (insertedData) {
                res.redirect('/produk');
            } else {
                res.status(500).send('Gagal menambahkan data!');
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error Lekkk!!');
        });
});

app.get('/produk/edit/:id', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const { id } = req.params;
    const db = dbService.getDbServiceInstance();

    db.getProdukById(id)
        .then(produk => {
            if (produk) {
                res.render('updateProduk', { produk });
            } else {
                res.status(404).send('Upss data Produk nggak ketemu..');
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Errorr Lekkk!!!!');
        });
});

app.post('/produk/update/:id', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const { id } = req.params;
    const { nama_produk, harga_satuan, stok } = req.body;
    const db = dbService.getDbServiceInstance();

    db.updateProdukById(id, nama_produk, harga_satuan, stok)
        .then(res.redirect('/produk'))
        .catch(err => {
            console.log(err);
            res.status(500).send('Error Lekkk!!!!');
        });
});

app.post('/produk/delete/:id', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const { id } = req.params;
    const db = dbService.getDbServiceInstance();

    const result = db.deleteProdukById(id);

    result
        .then(res.redirect('/produk'))
        .catch(err => console.log(err));
});


// TRANSAKSI Table
app.get('/transaksi', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const db = dbService.getDbServiceInstance();

    db.getAllTransaksi()
        .then(data => {
            if (!Array.isArray(data)) {
                console.log('Error:', data);
                data = [];
            }
            res.render('indexTransaksi', { transaksi: data });
        })
        .catch(err => {
            console.log(err);
            res.render('indexTransaksi', { transaksi: [] });
        });
});

app.get('/transaksi/create', checkRole(['Karyawan', 'Pemilik']), async (req, res) => {
    try {
        const db = dbService.getDbServiceInstance();

        const produkPromise = db.getAllProduk();
        const usersPromise = db.getAllUser();
        const pelangganPromise = db.getAllPelanggan();

        const produk = await produkPromise;
        const users = await usersPromise;
        const pelanggan = await pelangganPromise;

        res.render('createTransaksi', { produk: produk, users: users, pelanggans: pelanggan });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/transaksi/insert', checkRole(['Karyawan', 'Pemilik']), (req, res) => {
    const { id_produk, jumlah, id_user, id_pelanggan } = req.body;
    const db = dbService.getDbServiceInstance();

    // res.json(req.body);

    db.insertNewTransaksi( id_produk, jumlah, id_user, id_pelanggan)
        .then(insertedData => {
            if (insertedData) {
                // res.json(insertedData);
                res.redirect('/transaksi');
            } else {
                res.status(500).send('Gagal menambahkan data!');
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Error Lekkk!!');
        });
});

// app.get('/pelanggan/transaksi', (req, res) => {
//     const db = dbService.getDbServiceInstance();
//     const users = db.getAllCountUser();

//     db.getAllCountUser()
//         .then(data => {
        
//         res.render('pelangganIndexTransaksi', { layout: 'layouts/pelanggan', user: data }); 
//         })
//         .catch(err => {
//             console.log(err);
//         });
// });


// Routes Transaksi Pelanggan
app.get('/pelanggan/transaksi', (req, res) => {
    const db = dbService.getDbServiceInstance();

    db.getAllTransaksi()
        .then(data => {
            if (!Array.isArray(data)) {
                console.log('Error:', data);
                data = [];
            }
            res.render('pelangganIndexTransaksi', { layout: 'layouts/pelanggan', transaksi: data });
        })
        .catch(err => {
            console.log(err);
            res.render('pelangganIndexTransaksi', { transaksi: [] });
        });
});

app.get('/pelanggan/transaksi/create', async (req, res) => {
    try {
        const db = dbService.getDbServiceInstance();

        const produkPromise = db.getAllProduk();
        const usersPromise = db.getAllUser();
        const pelangganPromise = db.getAllPelanggan();

        const produk = await produkPromise;
        const users = await usersPromise;
        const pelanggan = await pelangganPromise;

        res.render('pelangganCreateTransaksi', { 
            layout: 'layouts/pelanggan', 
            produk: produk,
            users: users,
            pelanggans: pelanggan
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/pelanggan/transaksi/insert', (req, res) => {
    const { id_produk, jumlah, id_pelanggan } = req.body;

    // Periksa input dari klien
    if (!id_produk || !jumlah || !id_pelanggan) {
        return res.status(400).send('Semua field wajib diisi!');
    }

    const db = dbService.getDbServiceInstance();

    db.insertNewPelangganTransaksi(id_produk, jumlah, id_pelanggan)
        .then(insertedData => {
            if (insertedData) {
                res.redirect('/pelanggan/transaksi');
            } else {
                // res.status(500).send('Gagal menambahkan data!');
                res.redirect('/pelanggan/transaksi');
            }
        })
        .catch(err => {
            console.error('Error inserting data:', err);
            res.status(500).send('Error Lekkk!!');
        });
});

app.post('/transaksi/update', (req, res) => {
    const { id, status } = req.body;
    const db = dbService.getDbServiceInstance();

    db.updateStatusTransaksi(id, status)
        .then(result => {
            if (result) {
                res.json({ success: true });
            } else {
                res.json({ success: false });
            }
        })
        .catch(err => {
            console.error('Error updating status:', err);
            res.status(500).json({ success: false });
        });
});



// app.get('/pelanggan/transaksi', async (req, res) => {
//     try {
//         const db = dbService.getDbServiceInstance();

//         const produkPromise = db.getAllProduk();
//         const usersPromise = db.getAllUser();

//         const produk = await produkPromise;
//         const users = await usersPromise;

//         // res.render('createTransaksi', { produk: produk, users: users });
//         res.render('transaksiPelanggan', { products: produk});
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });




app.listen(process.env.PORT, () => console.log('Alkhamdulillah.... running rek!!!'));