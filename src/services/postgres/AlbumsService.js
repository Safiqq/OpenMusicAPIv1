/* eslint-disable no-underscore-dangle */

const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapAlbumsToModel } = require('../../utils/index');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES ($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    // cari album by id
    const query1 = {
      text: 'SELECT * FROM albums WHERE id=$1',
      values: [id],
    };
    const result1 = await this._pool.query(query1);
    if (!result1.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    // cari lagu by album_id
    const query2 = {
      text: 'SELECT * FROM songs WHERE album_id=$1',
      values: [result1.rows[0].id],
    };
    const result2 = await this._pool.query(query2);

    return {
      ...result1.rows.map(mapAlbumsToModel)[0],
      songs: result2.rows.map((song) => ({
        id: song.id,
        title: song.title,
        performer: song.performer,
      })),
    };
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();

    const query = {
      text: 'UPDATE albums SET name=$1, year=$2, updated_at=$3 WHERE id=$4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = AlbumsService;
