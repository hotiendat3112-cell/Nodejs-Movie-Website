const PhimleController = require("./PhimleController");
const PhimboController = require("./PhimboController");
const PhimmoiController = require("./PhimmoiController");
const Movie = require("../models/Movie");
const path = require("path");
const fs = require("fs").promises;

class HomeController {
  static async banner() {
    const filePath = path.join(__dirname, "../../resources/data/banner.json");
    try {
      const data = await fs.readFile(filePath, "utf8");
      const banner = JSON.parse(data).backdrops;
      const bannerRandom = banner[Math.floor(Math.random() * banner.length)];
      return bannerRandom;
    } catch (error) {
      console.error("Error fetching banner:", error);
      return [];
    }
  }

  static index(req, res) {
    Promise.all([
      PhimmoiController.phimmoi(),
      PhimleController.phimle(),
      PhimboController.phimbo(),
      HomeController.banner(),
    ])
      .then(([movies, odd_Movies, seri_Movies, banner_Movies]) => {
        res.render("home", { movies, odd_Movies, seri_Movies, banner_Movies });
      })
      .catch((error) => {
        console.error("Error fetching movies:", error);
        res.render("home", {
          movies: [],
          odd_Movies: [],
          seri_Movies: [],
          banner_Movies: [],
        });
      });
  }

  // Phương thức xem chi tiết phim (Hỗ trợ cả MongoDB cục bộ và API ngoài)
  static async slug(req, res) {
    const slug = req.params.slug;

    try {
      const [phimmoi, phimle, phimbo] = await Promise.all([
        PhimmoiController.phimmoi(),
        PhimleController.phimle(),
        PhimboController.phimbo(),
      ]);

      // 1. Kiểm tra xem slug có phải là ID của MongoDB cục bộ không (24 ký tự hex)
      if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        const localMovie = await Movie.findById(slug).lean();
        if (localMovie) {
          const episodes = localMovie.episodes || [];
          const currentEpisode = episodes.length > 0 ? episodes[0] : null;

          // Chuẩn hóa dữ liệu sang cấu trúc tương thích với view chi tiết
          const normalizedMovie = {
            id: localMovie._id,
            name: localMovie.title,
            title: localMovie.title,
            thumb_url: localMovie.posterUrl,
            posterUrl: localMovie.posterUrl,
            description: localMovie.description,
            category: localMovie.category,
            episodes: episodes.map(ep => ({
              episodeNumber: ep.episodeNumber,
              slug: `tap-${ep.episodeNumber}`,
              videoUrl: ep.videoUrl
            }))
          };

          return res.render("movie/details", {
            movieId: normalizedMovie.id,
            movie: normalizedMovie,
            movieNation: normalizedMovie.category,
            moviePractice: normalizedMovie.episodes,
            movieEmbed: currentEpisode ? currentEpisode.videoUrl : null,
            currentEpisode,
            isLocal: true,
            phimmoi,
            phimle,
            phimbo,
          });
        }
      }

      // 2. Nếu không phải MongoDB cục bộ, gọi API ngoài
      const apiUrl = `https://phim.nguonc.com/api/film/${slug}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success") {
        const movie = data.movie;
        const moviePractice = movie.episodes[0].items.map((item) => ({
          ...item,
          isEpisode: item.slug.startsWith("tap-"),
        }));

        res.render("movie/details", {
          movieId: movie.id,
          movie,
          movieNation: movie.category,
          moviePractice,
          movieEmbed: moviePractice.length > 0 ? moviePractice[0].embed : null,
          currentEpisode: moviePractice.length > 0 ? moviePractice[0] : null,
          isLocal: false,
          phimmoi,
          phimle,
          phimbo,
        });
      } else {
        res.render("movie/details", { movie: null, phimmoi, phimle, phimbo });
      }
    } catch (error) {
      console.error("Lỗi chi tiết phim:", error.message);
      res.render("movie/details", { movie: null });
    }
  }

  // Phương thức xem tập phim cụ thể
  static async tap(req, res) {
    const slug = req.params.slug;
    const tap = req.params.name; // Có thể là id tập hoặc slug tập

    try {
      const [phimmoi, phimle, phimbo] = await Promise.all([
        PhimmoiController.phimmoi(),
        PhimleController.phimle(),
        PhimboController.phimbo(),
      ]);

      // 1. Xử lý phim cục bộ MongoDB
      if (slug.match(/^[0-9a-fA-F]{24}$/)) {
        const localMovie = await Movie.findById(slug).lean();
        if (localMovie) {
          const episodes = localMovie.episodes || [];
          // Tìm tập theo số tập hoặc slug
          const currentEpisode = episodes.find(
            ep => `tap-${ep.episodeNumber}` === tap || ep.episodeNumber.toString() === tap
          ) || episodes[0];

          const normalizedMovie = {
            id: localMovie._id,
            name: localMovie.title,
            title: localMovie.title,
            thumb_url: localMovie.posterUrl,
            posterUrl: localMovie.posterUrl,
            description: localMovie.description,
            category: localMovie.category,
            episodes: episodes.map(ep => ({
              episodeNumber: ep.episodeNumber,
              slug: `tap-${ep.episodeNumber}`,
              videoUrl: ep.videoUrl
            }))
          };

          return res.render("movie/details", {
            movieId: normalizedMovie.id,
            movie: normalizedMovie,
            movieNation: normalizedMovie.category,
            moviePractice: normalizedMovie.episodes,
            movieEmbed: currentEpisode ? currentEpisode.videoUrl : null,
            currentEpisode,
            isLocal: true,
            phimmoi,
            phimle,
            phimbo,
          });
        }
      }

      // 2. Xử lý API ngoài
      const apiUrl = `https://phim.nguonc.com/api/film/${slug}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.status === "success") {
        const movie = data.movie;
        const episodes = movie.episodes[0].items.map((item) => ({
          ...item,
          isEpisode: item.slug.startsWith("tap-"),
        }));

        const currentEpisode = episodes.find((item) => item.slug === tap) || episodes[0];

        res.render("movie/details", {
          movieId: movie.id,
          movie,
          movieNation: movie.category,
          moviePractice: episodes,
          movieEmbed: currentEpisode ? currentEpisode.embed : null,
          currentEpisode,
          isLocal: false,
          phimmoi,
          phimle,
          phimbo,
        });
      } else {
        res.render("movie/details", { movie: null, phimmoi, phimle, phimbo });
      }
    } catch (error) {
      console.error("Lỗi xem tập phim:", error.message);
      res.render("movie/details", { movie: null, phimmoi, phimle, phimbo });
    }
  }

  // Phương thức Tìm kiếm kết hợp: MongoDB (Cục bộ) + API Ngoài
  static async search(req, res, next) {
    try {
      const rawKeyword = req.query.keyword || req.query.search || "";
      const trimmedQuery = rawKeyword.trim();

      if (!trimmedQuery) {
        return res.render("movie/listmovie", {
          movies: [],
          alert: "Vui lòng nhập từ khóa tìm kiếm",
        });
      }

      const mongoQuery = {
        title: { $regex: trimmedQuery,$options: "i" },
      };

      const apiKey = trimmedQuery.replace(/ /g, "+");
      const externalApiUrl = `https://phim.nguonc.com/api/films/search?keyword=${apiKey}`;

      const [localMovies, externalResult, phimmoi, phimle, phimbo] = await Promise.all([
        Movie.find(mongoQuery).lean(),
        
        fetch(externalApiUrl)
          .then(async (response) => {
            if (!response.ok) return { status: "error", items: [] };
            const contentType = response.headers.get("Content-Type");
            if (!contentType || !contentType.includes("application/json")) {
              return { status: "error", items: [] };
            }
            return response.json();
          })
          .catch(() => ({ status: "error", items: [] })),

        PhimmoiController.phimmoi().catch(() => []),
        PhimleController.phimle().catch(() => []),
        PhimboController.phimbo().catch(() => []),
      ]);

      // Chuẩn hóa dữ liệu phim cục bộ để khớp template hiển thị chung
      const formattedLocalMovies = localMovies.map(movie => ({
        _id: movie._id,
        slug: movie._id, // Gắn ID làm slug để khi click chuyển hướng đúng route chi tiết
        name: movie.title,
        title: movie.title,
        thumb_url: movie.posterUrl,
        posterUrl: movie.posterUrl,
        category: movie.category,
        isLocal: true
      }));

      const externalMovies = (externalResult.status === "success" && externalResult.items)
        ? externalResult.items
        : [];

      const combinedMovies = [...formattedLocalMovies, ...externalMovies];

      res.render("movie/listmovie", {
        movies: combinedMovies,
        phimmoi,
        phimle,
        phimbo,
      });
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error.message);
      res.render("movie/listmovie", {
        movies: [],
        alert: "Đã có lỗi xảy ra trong quá trình tìm kiếm",
      });
    }
  }

  static theloai(req, res) {
    const slug = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 18;
    const maxPagesToShow = 3;

    const apiUrl = `https://phim.nguonc.com/api/films/the-loai/${slug}?page=${page}`;
    Promise.all([
      fetch(apiUrl),
      fetch(
        `https://phim.nguonc.com/api/films/the-loai/${slug}?page=${page + 1}`
      ),
    ])
      .then((responses) => {
        responses.forEach((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        });

        return Promise.all(responses.map((response) => response.json()));
      })
      .then((dataArray) => {
        const data1 = dataArray[0];
        const data2 = dataArray[1];

        const allMovies = [...(data1.items || []), ...(data2.items || [])];

        const totalPages = page + 1;
        const pagination = [];

        const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        for (let i = startPage; i <= endPage; i++) {
          pagination.push(i);
        }

        res.render("movie/listmovie", {
          movies: allMovies.slice(0, itemsPerPage),
          currentPage: page,
          totalPages: totalPages,
          pagination: pagination,
        });
      })
      .catch((error) => {
        console.error("Network error:", error.message);
        res.render("movie/listmovie", { movies: null });
      });
  }
}

module.exports = HomeController;