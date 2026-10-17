const Movie = require('../models/Movie');

class AdminController {
    // 1. Hiển thị danh sách phim và tìm kiếm
    async index(req, res, next) {
        try {
            const searchQuery = req.query.search || '';
            const query = {};

            if (searchQuery.trim()) {
                query.title = {
                    $regex: searchQuery.trim(),
                    $options: 'i'
                };
            }

            const movies = await Movie.find(query).lean();

            res.render('admin/dashboard', {
                movies,
                searchQuery
            });
        } catch (error) {
            next(error);
        }
    }

    // 2. Hiển thị trang thêm phim
    createMovie(req, res, next) {
        res.render('movie/create');
    }

    // 3. Lưu phim mới
    async storeMovie(req, res, next) {
        try {
            const { title, category, posterUrl, poster, description } = req.body;

            const newMovie = new Movie({
                title,
                category,
                posterUrl: posterUrl || poster || '',
                description
            });

            await newMovie.save();
            res.redirect('/admin');
        } catch (error) {
            next(error);
        }
    }

    // 4. Hiển thị trang sửa phim
    async editMovie(req, res, next) {
        try {
            const movie = await Movie.findById(req.params.id).lean();

            if (!movie) {
                return res.status(404).send('Không tìm thấy phim!');
            }

            res.render('movie/edit', { movie });
        } catch (error) {
            next(error);
        }
    }

    // 5. Cập nhật phim
    async updateMovie(req, res, next) {
        try {
            const { title, category, posterUrl, poster, description } = req.body;

            const updatedData = {
                title,
                category,
                posterUrl: posterUrl || poster || '',
                description
            };

            const movie = await Movie.findByIdAndUpdate(
                req.params.id,
                updatedData,
                { new: true, runValidators: true }
            );

            if (!movie) {
                return res.status(404).send('Không tìm thấy phim!');
            }

            res.redirect('/admin');
        } catch (error) {
            next(error);
        }
    }

    // 6. Xóa phim
    async deleteMovie(req, res, next) {
        try {
            const movie = await Movie.findByIdAndDelete(req.params.id);

            if (!movie) {
                return res.status(404).send('Không tìm thấy phim!');
            }

            res.redirect('/admin');
        } catch (error) {
            next(error);
        }
    }

    // 7. Hiển thị trang giao diện thêm tập phim
    async renderAddEpisode(req, res, next) {
        try {
            const movie = await Movie.findById(req.params.id).lean();

            if (!movie) {
                return res.status(404).send('Không tìm thấy phim!');
            }

            res.render('admin/add-episode', { movie });
        } catch (error) {
            next(error);
        }
    }

    // 8. Xử lý thêm tập phim
    async addEpisode(req, res, next) {
        try {
            const { episodeNumber, videoUrl } = req.body;

            if (!episodeNumber || !videoUrl) {
                return res.status(400).send('Vui lòng nhập số tập và đường dẫn video!');
            }

            const movie = await Movie.findByIdAndUpdate(
                req.params.id,
                {
                    $push: {
                        episodes: {
                            episodeNumber: Number(episodeNumber),
                            videoUrl: videoUrl.trim()
                        }
                    }
                },
                { new: true, runValidators: true }
            );

            if (!movie) {
                return res.status(404).send('Không tìm thấy phim!');
            }

            res.redirect('/admin');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();