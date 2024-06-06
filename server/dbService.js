const mysql = require('mysql');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();
let instance = null;

const connection = mysql.createConnection({
host: process.env.HOST,
user: process.env.USERNAME,
password: process.env.PASSWORD,
database: process.env.DATABASE,
port: process.env.DB_PORT
});

connection.connect((err) => {
if (err) {
    console.log(err.message);
}
console.log('db ' + connection.state);
});

class DbService {
static getDbServiceInstance() {
    return instance ? instance : new DbService();
}

// NAMES Methods
async getAllData() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM names;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async insertNewName(name) {
    try {
        const dateAdded = new Date();
        const insertId = await new Promise((resolve, reject) => {
            const query = "INSERT INTO names (name, date_added) VALUES (?, ?);";
            connection.query(query, [name, dateAdded], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.insertId);
            });
        });
        return {
            id: insertId,
            names: name,
            dateAdded: dateAdded
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

async deleteRowById(id) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "DELETE FROM names WHERE id = ?";

            connection.query(query, [id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.affectedRows);
            });
        });
        return response === 1 ? true : false;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async updateNameById(id, name) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "UPDATE names SET name =? WHERE id =?";

            connection.query(query, [name, id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.affectedRows);
            });
        });
        return response === 1;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async searchByName(name) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM names WHERE name LIKE ?";

            connection.query(query, [`%${name}%`], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// AUTH Methods
async registerUser(nama, email, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const dateNow = new Date();
        const insertId = await new Promise((resolve, reject) => {
            const query = "INSERT INTO pelanggan (nama_pelanggan, email, password, created_at) VALUES (?, ?, ?, ?)";
            connection.query(query, [nama, email, hashedPassword, dateNow], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.insertId);
            });
        });

        return {
            id_pelanggan: insertId,
            nama_pelanggan: nama,
            email: email,
            password: hashedPassword,
            alamat: null, 
            created_at: dateNow
        };
    } catch (error) {
        console.error('Gagal Regist woilahh user:', error);
        return null;
    }
}


async getUserByNama(nama) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM users WHERE nama = ?";
            connection.query(query, [nama], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results[0]);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return null;
    }
}

async getPelangganByNama(nama_pelanggan) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM pelanggan WHERE nama_pelanggan = ?";
            connection.query(query, [nama_pelanggan], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results[0]);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return null;
    }
}

async validateUser(nama, password) {
    try {
        const user = await this.getUserByNama(nama);
        if (!user) {
            return null;
        }
        const isValid = await bcrypt.compare(password, user.password);
        return isValid ? user : null;
    } catch (error) {
        console.log(error);
        return null;
    }
}


// USER Methods
async getAllUser() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM users;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async insertNewUser(nama, email, alamat, password, role) {
    try {
        const dated = new Date();
        const hashedPassword = await bcrypt.hash(password, 10);
        const id_user = await new Promise((resolve, reject) => {
            const query = "INSERT INTO users VALUES ('', ?, ?, ?, ?, ?, ?);";
            connection.query(query, [nama, email, alamat, hashedPassword, role, dated], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.id_user);
            });
        });
        return {
            id: id_user,
            nama : nama,
            email : email,
            alamat : alamat,
            password : password,
            role : role,
            created_at : dated
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

async deleteUserById(id) {
    try {
        id = parseInt(id, 10);
        const result = await new Promise((resolve, reject) => {
            const query = "DELETE FROM users WHERE id_user = ?;";

            connection.query(query, [id], (err, result) => {
                if (err) {
                    reject(new Error(err.message));
                } else {
                    resolve(result.affectedRows === 1); // Check affected rows
                }
            });
        });
        return result;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

async getUserById(id) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM users WHERE id_user = ?";

            connection.query(query, [id], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results[0]);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return null;
    }
}


async updateUserById(id, nama, alamat, role, created_at) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "UPDATE users SET nama = ?, alamat = ?, role = ?, created_at = ? WHERE id_user = ?;";

            connection.query(query, [nama, alamat, role, created_at, id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result);
            });
        });
        return response === 1;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async searchByName(name) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM names WHERE name LIKE ?";

            connection.query(query, ['%${name}%'], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// PELANGGAN Methods
async getAllPelanggan() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM pelanggan;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async insertNewPelanggan(nama_pelanggan, email, password, alamat) {
    try {
        const dateAdded = new Date();
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertId = await new Promise((resolve, reject) => {
            const query = "INSERT INTO pelanggan (nama_pelanggan, email, alamat, password, created_at) VALUES (?, ?, ?, ?, ?);";
            connection.query(query, [nama_pelanggan, email, alamat, hashedPassword, dateAdded], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.insertId);
            });
        });
        return {
            id: insertId,
            nama_pelanggan,
            email,
            alamat,
            password,
            dateAdded
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

async deletePelangganById(id) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "DELETE FROM pelanggan WHERE id_pelanggan = ?;";

            connection.query(query, [id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result);
            });
        });
        return response === 1;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async getPelangganById(id) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM pelanggan WHERE id_pelanggan =?;";

            connection.query(query, [id], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });

        return response[0];
    } catch (error) {
        console.log(error);
        return null;
    }
}

async updatePelangganById(id, nama_pelanggan, email, alamat) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "UPDATE pelanggan SET nama_pelanggan = ?, email = ?, alamat = ? WHERE id_pelanggan = ?;";

            connection.query(query, [nama_pelanggan, email, alamat, id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result);
            });
        });
        return response === 1;
    } catch (error) {
        console.log(error);
        return false;
    }
}


// PRODUK Methods 
async getAllProduk() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM produk;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async getAllCountProduk() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT COUNT(*) FROM produk as jumlah_produk;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async insertNewProduk(nama_produk, harga_satuan, stok) {
    try {
        const dateAdded = new Date();
        const insertId = await new Promise((resolve, reject) => {
            const query = "INSERT INTO produk (nama_produk, harga_satuan, stok, created_at) VALUES (?, ?, ?, ?);";
            connection.query(query, [nama_produk, harga_satuan, stok, dateAdded], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.insertId);
            });
        });
        return {
            id: insertId,
            nama_produk,
            harga_satuan,
            stok,
            dateAdded
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

async deleteProdukById(id) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "DELETE FROM produk WHERE id_produk = ?;";

            connection.query(query, [id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result);
            });
        });
        return response === 1;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async getProdukById(id) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM produk WHERE id_produk =?;";

            connection.query(query, [id], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });

        return response[0];
    } catch (error) {
        console.log(error);
        return null;
    }
}

async updateProdukById(id, nama_produk, harga_satuan, stok) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "UPDATE produk SET nama_produk = ?, harga_satuan = ?, stok = ? WHERE id_produk = ?;";

            connection.query(query, [nama_produk, harga_satuan, stok, id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result);
            });
        });
        return response === 1;
    } catch (error) {
        console.log(error);
        return false;
    }
}

//USERS
async getAllUser() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM users;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async getAllCountUser() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT COUNT(*) as jumlah_user FROM users;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return 'kosong';
    }
}

// TRANSAKSI Methods 
async getAllTransaksi() {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM transaksi;";

            connection.query(query, (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return [];
    }
}

async updateStokById(id_produk, newStok) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "UPDATE produk SET stok =? WHERE id_produk =?;";
            connection.query(query, [newStok, id_produk], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return null;
    }
}

async insertNewTransaksi(id_produk, jumlah, id_user, id_pelanggan) {
    try {
        const dateAdded = new Date();
        const db = DbService.getDbServiceInstance();
        const selectProduct = await db.getProdukById(id_produk);

        const newStok = selectProduct.stok - jumlah;
        const total = selectProduct.harga_satuan * jumlah;
        const status_transaksis = "BELUM DIBAYAR";

        db.updateStokById(id_produk, newStok);

        const InsertTransaksi = await new Promise((resolve, reject) => {
            const query = "INSERT INTO transaksi VALUES ('',?,?,?,?,?,?,?,?);";
            connection.query(query, [id_produk, selectProduct.nama_produk, jumlah, total, id_user, id_pelanggan, status_transaksis, dateAdded], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.InsertTransaksi);
            });
        });

        return {
            id_produk,
            nama_produk: selectProduct.nama_produk,
            jumlah: jumlah,
            harga_total: total,
            id_user: id_user,
            id_pelanggan: id_pelanggan,
            status_transaksi: status_transaksis,
            created_at: dateAdded
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

async insertNewPelangganTransaksi(id_produk, jumlah, id_pelanggan) {
    try {
        const dateAdded = new Date();
        const db = DbService.getDbServiceInstance();
        const selectProduct = await db.getProdukById(id_produk);

        const newStok = selectProduct.stok - jumlah;
        const total = selectProduct.harga_satuan * jumlah;
        const status_transaksis = "BELUM DIBAYAR";

        db.updateStokById(id_produk, newStok);

        const InsertTransaksi = await new Promise((resolve, reject) => {
            const query = "INSERT INTO transaksi (id_produk, nama_produk, jumlah, harga_total, id_pelanggan, status_transaksi, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);";
            connection.query(query, [id_produk, selectProduct.nama_produk, jumlah, total, id_pelanggan, status_transaksis, dateAdded], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.InsertTransaksi);
            });
        });

        return {
            id_produk,
            nama_produk: selectProduct.nama_produk,
            jumlah,
            harga_total: total,
            id_user: null,
            id_pelanggan,
            status_transaksi: status_transaksis,
            created_at: dateAdded
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

async updateStatusTransaksi(id, status) {
    try {
        const response = await new Promise((resolve, reject) => {
            const query = "UPDATE transaksi SET status_transaksi = ? WHERE id = ?";

            connection.query(query, [status, id], (err, result) => {
                if (err) reject(new Error(err.message));
                resolve(result.affectedRows);
            });
        });

        return response === 1;
    } catch (error) {
        console.error('Error updating status:', error);
        return false;
    }
}


// async insertNewPelangganTransaksi(id_produk, jumlah, id_pelanggan) {
//     try {
//         const dateAdded = new Date();
//         const db = DbService.getDbServiceInstance();
//         const selectProduct = await db.getProdukById(id_produk);

//         if (!selectProduct) {
//             throw new Error('Product not found');
//         }

//         const newStok = selectProduct.stok - jumlah;
//         const total = selectProduct.harga_satuan * jumlah;
//         const status_transaksi = "BELUM DIBAYAR";
//         const id_user = null;

//         // Update stok produk terlebih dahulu
//         await db.updateStokById(id_produk, newStok);

//         // Insert transaksi baru
//         const InsertTransaksi = await new Promise((resolve, reject) => {
//             const query = "INSERT INTO transaksi (id_produk, nama_produk, jumlah, harga_total, id_user, id_pelanggan, status_transaksi, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
//             connection.query(query, [id_produk, selectProduct.nama_produk, jumlah, total, id_user, id_pelanggan, status_transaksi, dateAdded], (err, result) => {
//                 if (err) {
//                     return reject(new Error(err.message));
//                 }
//                 resolve(result.insertId); // Assuming you want the insert ID
//             });
//         });

//         return {
//             id_produk,
//             nama_produk: selectProduct.nama_produk,
//             jumlah,
//             harga_total: total,
//             id_user,
//             id_pelanggan,
//             status_transaksi,
//             created_at: dateAdded
//         };
//     } catch (error) {
//         console.log(error);
//         return null;
//     }
// }



async getTransaksiById(id) {
    try {
        id = parseInt(id, 10);
        const response = await new Promise((resolve, reject) => {
            const query = "SELECT * FROM transaksi WHERE id_produk = ?";

            connection.query(query, [id], (err, results) => {
                if (err) reject(new Error(err.message));
                resolve(results[0]);
            });
        });
        return response;
    } catch (error) {
        console.log(error);
        return null;
    }
}

}

module.exports = DbService;
